import io
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import pandas as pd
import numpy as np
import pyreadstat
from sqlalchemy.orm import Session
import uuid

from app.models.dataset import Dataset
from app.models.variable import Variable
from app.storage.base import StorageBackend


class DatasetService:
    @staticmethod
    def _sanitize_cell_value(val: Any) -> Any:
        """Converts NaN / Inf / NaT to None for clean JSON serialization."""
        if val is None:
            return None
        if isinstance(val, (float, np.floating)):
            if np.isnan(val) or np.isinf(val):
                return None
            return float(val)
        if isinstance(val, (int, np.integer)):
            return int(val)
        if pd.isna(val):
            return None
        return val

    @classmethod
    def ingest_file(
        cls,
        db: Session,
        storage: StorageBackend,
        project_id: uuid.UUID,
        filename: str,
        file_bytes: bytes,
        custom_name: Optional[str] = None,
    ) -> Dataset:
        dataset_id = uuid.uuid4()
        clean_ext = Path(filename).suffix.lower().lstrip(".")
        if clean_ext not in ["csv", "xlsx", "sav"]:
            raise ValueError(f"Unsupported file format: .{clean_ext}. Supported formats: .csv, .xlsx, .sav")

        raw_key = f"datasets/{dataset_id}/raw.{clean_ext}"
        parquet_key = f"datasets/{dataset_id}/data.parquet"

        # 1. Save raw bytes in storage layer
        storage.save_bytes(raw_key, file_bytes)
        local_raw_path = storage.get_local_path(raw_key)

        variables_meta: List[Dict[str, Any]] = []

        # 2. Parse file and extract metadata
        if clean_ext == "sav":
            df, meta = pyreadstat.read_sav(str(local_raw_path))
            for idx, col_name in enumerate(meta.column_names):
                label = meta.column_names_to_labels.get(col_name) if meta.column_names_to_labels else None
                measure = meta.variable_measure.get(col_name, "scale") if meta.variable_measure else "scale"
                measure_str = str(measure).lower()
                if measure_str not in ["scale", "nominal", "ordinal"]:
                    measure_str = "scale"

                val_labels = meta.variable_value_labels.get(col_name) if meta.variable_value_labels else None
                val_labels_dict = {str(k): str(v) for k, v in val_labels.items()} if val_labels else None

                missing_user = meta.missing_user_values.get(col_name) if meta.missing_user_values else []
                missing_list = list(missing_user) if missing_user else None

                col_series = df[col_name]
                if pd.api.types.is_numeric_dtype(col_series):
                    dtype_str = "numeric"
                elif pd.api.types.is_datetime64_any_dtype(col_series):
                    dtype_str = "date"
                else:
                    dtype_str = "string"

                decimals = 2 if dtype_str == "numeric" else 0
                display_width = meta.variable_display_width.get(col_name, 8) if meta.variable_display_width else 8

                variables_meta.append({
                    "name": str(col_name),
                    "column_index": idx,
                    "label": label,
                    "data_type": dtype_str,
                    "measurement_level": measure_str,
                    "role": "input",
                    "missing_values": missing_list,
                    "value_labels": val_labels_dict,
                    "display_width": int(display_width) if display_width else 8,
                    "decimals": decimals,
                })
        else:
            if clean_ext == "csv":
                df = pd.read_csv(local_raw_path)
            else:  # xlsx
                df = pd.read_excel(local_raw_path)

            for idx, col_name in enumerate(df.columns):
                col_series = df[col_name]
                if pd.api.types.is_numeric_dtype(col_series):
                    dtype_str = "numeric"
                    measure_str = "scale"
                    decimals = 2
                elif pd.api.types.is_datetime64_any_dtype(col_series):
                    dtype_str = "date"
                    measure_str = "nominal"
                    decimals = 0
                else:
                    dtype_str = "string"
                    measure_str = "nominal"
                    decimals = 0

                variables_meta.append({
                    "name": str(col_name),
                    "column_index": idx,
                    "label": str(col_name),
                    "data_type": dtype_str,
                    "measurement_level": measure_str,
                    "role": "input",
                    "missing_values": None,
                    "value_labels": None,
                    "display_width": 10,
                    "decimals": decimals,
                })

        # 3. Convert DataFrame to Parquet
        df.columns = [str(c) for c in df.columns]
        local_parquet_path = storage.base_dir / parquet_key
        local_parquet_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(local_parquet_path, engine="pyarrow", index=False)

        # 4. Save metadata in PostgreSQL
        dataset_name = custom_name or Path(filename).stem
        dataset = Dataset(
            id=dataset_id,
            project_id=project_id,
            name=dataset_name,
            original_filename=filename,
            file_format=clean_ext,
            raw_storage_key=raw_key,
            parquet_storage_key=parquet_key,
            row_count=len(df),
            column_count=len(df.columns),
            file_size_bytes=len(file_bytes),
        )
        db.add(dataset)
        db.flush()

        for v in variables_meta:
            var_record = Variable(
                dataset_id=dataset_id,
                name=v["name"],
                column_index=v["column_index"],
                label=v["label"],
                data_type=v["data_type"],
                measurement_level=v["measurement_level"],
                role=v["role"],
                missing_values=v["missing_values"],
                value_labels=v["value_labels"],
                display_width=v["display_width"],
                decimals=v["decimals"],
            )
            db.add(var_record)

        db.commit()
        db.refresh(dataset)
        return dataset

    @classmethod
    def get_data_page(
        cls,
        storage: StorageBackend,
        dataset: Dataset,
        offset: int = 0,
        limit: int = 50,
        columns: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, columns=columns, engine="pyarrow")
        total_rows = len(df)

        page_df = df.iloc[offset : offset + limit]
        rows: List[Dict[str, Any]] = []

        for idx, row in page_df.iterrows():
            row_dict = {"_row_id": int(offset + len(rows) + 1)}
            for col in page_df.columns:
                row_dict[col] = cls._sanitize_cell_value(row[col])
            rows.append(row_dict)

        return {
            "dataset_id": str(dataset.id),
            "total_rows": total_rows,
            "offset": offset,
            "limit": limit,
            "columns": list(df.columns),
            "rows": rows,
        }

    @classmethod
    def get_columns_data(
        cls,
        storage: StorageBackend,
        dataset: Dataset,
        column_names: List[str],
    ) -> Dict[str, List[Any]]:
        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, columns=column_names, engine="pyarrow")
        result: Dict[str, List[Any]] = {}
        for col in column_names:
            if col in df.columns:
                result[col] = [cls._sanitize_cell_value(x) for x in df[col]]
            else:
                result[col] = []
        return result

    @classmethod
    def update_cells(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset: Dataset,
        updates: List[Dict[str, Any]],
    ) -> int:
        """Updates specific cell values in the dataset Parquet file."""
        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, engine="pyarrow")
        n_rows = len(df)

        # Get variable types map
        vars_in_db = db.query(Variable).filter(Variable.dataset_id == dataset.id).all()
        type_map = {v.name: v.data_type for v in vars_in_db}

        updated_count = 0
        for item in updates:
            r_idx = item["row_index"]
            c_name = item["column_name"]
            val = item.get("value")

            if r_idx < 0 or r_idx >= n_rows:
                continue
            if c_name not in df.columns:
                continue

            var_type = type_map.get(c_name, "numeric")
            if val is None or val == "" or val == ".":
                df.at[r_idx, c_name] = np.nan if var_type == "numeric" else None
            else:
                if var_type == "numeric":
                    try:
                        df.at[r_idx, c_name] = float(val)
                    except (ValueError, TypeError):
                        df.at[r_idx, c_name] = np.nan
                else:
                    df.at[r_idx, c_name] = str(val)
            updated_count += 1

        df.to_parquet(parquet_path, engine="pyarrow", index=False)
        dataset.updated_at = datetime.now(timezone.utc)
        db.commit()
        return updated_count

    @classmethod
    def add_row(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset: Dataset,
        values: Optional[Dict[str, Any]] = None,
    ) -> int:
        """Appends a new case (row) to the dataset."""
        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, engine="pyarrow")

        new_row = {}
        for col in df.columns:
            new_row[col] = values.get(col, np.nan) if values else np.nan

        new_df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        new_df.to_parquet(parquet_path, engine="pyarrow", index=False)

        dataset.row_count = len(new_df)
        dataset.updated_at = datetime.now(timezone.utc)
        db.commit()
        return dataset.row_count

    @classmethod
    def delete_row(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset: Dataset,
        row_index: int,
    ) -> int:
        """Deletes a case (row) at specified 0-indexed position."""
        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, engine="pyarrow")

        if row_index < 0 or row_index >= len(df):
            raise ValueError(f"Invalid row index {row_index}. Dataset has {len(df)} rows.")

        new_df = df.drop(index=row_index).reset_index(drop=True)
        new_df.to_parquet(parquet_path, engine="pyarrow", index=False)

        dataset.row_count = len(new_df)
        dataset.updated_at = datetime.now(timezone.utc)
        db.commit()
        return dataset.row_count

    @classmethod
    def add_variable(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset: Dataset,
        name: str,
        data_type: str = "numeric",
        label: Optional[str] = None,
        measurement_level: str = "scale",
        decimals: int = 2,
    ) -> Variable:
        """Adds a new variable column to the dataset and database."""
        clean_name = re.sub(r"[^\w]", "_", name.strip())
        if not clean_name:
            raise ValueError("Variable name cannot be empty or invalid.")

        # Check existing
        existing = (
            db.query(Variable)
            .filter(Variable.dataset_id == dataset.id, Variable.name == clean_name)
            .first()
        )
        if existing:
            raise ValueError(f"Variable '{clean_name}' already exists in this dataset.")

        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, engine="pyarrow")

        df[clean_name] = np.nan if data_type == "numeric" else None
        df.to_parquet(parquet_path, engine="pyarrow", index=False)

        new_var = Variable(
            dataset_id=dataset.id,
            name=clean_name,
            column_index=len(df.columns) - 1,
            label=label or clean_name,
            data_type=data_type,
            measurement_level=measurement_level,
            role="input",
            decimals=decimals,
            display_width=10,
        )
        db.add(new_var)
        dataset.column_count = len(df.columns)
        dataset.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(new_var)
        return new_var

    @classmethod
    def delete_variable(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset: Dataset,
        variable_name: str,
    ) -> None:
        """Removes a variable column from the dataset and database."""
        target_var = (
            db.query(Variable)
            .filter(Variable.dataset_id == dataset.id, Variable.name == variable_name)
            .first()
        )
        if not target_var:
            raise ValueError(f"Variable '{variable_name}' not found.")

        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, engine="pyarrow")

        if variable_name in df.columns:
            df = df.drop(columns=[variable_name])
            df.to_parquet(parquet_path, engine="pyarrow", index=False)

        db.delete(target_var)

        # Re-index remaining variables
        remaining_vars = (
            db.query(Variable)
            .filter(Variable.dataset_id == dataset.id, Variable.name != variable_name)
            .order_by(Variable.column_index)
            .all()
        )
        for idx, v in enumerate(remaining_vars):
            v.column_index = idx

        dataset.column_count = len(remaining_vars)
        dataset.updated_at = datetime.now(timezone.utc)
        db.commit()

    @classmethod
    def export_dataset(
        cls,
        storage: StorageBackend,
        dataset: Dataset,
        export_format: str = "csv",
    ) -> Tuple[bytes, str, str]:
        """Exports dataset to CSV or Excel bytes."""
        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, engine="pyarrow")

        clean_format = export_format.lower()
        if clean_format == "xlsx":
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
                df.to_excel(writer, index=False)
            content = buffer.getvalue()
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"{dataset.name}.xlsx"
        else:
            content = df.to_csv(index=False).encode("utf-8")
            media_type = "text/csv; charset=utf-8"
            filename = f"{dataset.name}.csv"

        return content, media_type, filename

    @classmethod
    def compute_variable(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset: Dataset,
        target_variable: str,
        expression: str,
        label: Optional[str] = None,
    ) -> Variable:
        """Safely evaluates an arithmetic or transformation expression and stores as a new/updated variable."""
        clean_target = re.sub(r"[^\w]", "_", target_variable.strip())
        if not clean_target:
            raise ValueError("Target variable name cannot be empty.")

        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, engine="pyarrow")

        # Prepare safe evaluation context
        safe_env = {col: df[col] for col in df.columns}
        safe_env.update({
            "log": np.log,
            "exp": np.exp,
            "sqrt": np.sqrt,
            "abs": np.abs,
            "round": np.round,
            "sin": np.sin,
            "cos": np.cos,
            "tan": np.tan,
        })

        try:
            evaluated = eval(expression, {"__builtins__": {}}, safe_env)
        except Exception as e:
            raise ValueError(f"Expression evaluation error: {str(e)}")

        df[clean_target] = evaluated
        df.to_parquet(parquet_path, engine="pyarrow", index=False)

        # Update or create variable in DB
        var_record = (
            db.query(Variable)
            .filter(Variable.dataset_id == dataset.id, Variable.name == clean_target)
            .first()
        )
        if not var_record:
            var_record = Variable(
                dataset_id=dataset.id,
                name=clean_target,
                column_index=len(df.columns) - 1,
                label=label or clean_target,
                data_type="numeric" if pd.api.types.is_numeric_dtype(df[clean_target]) else "string",
                measurement_level="scale",
                decimals=2,
            )
            db.add(var_record)
            dataset.column_count = len(df.columns)
        else:
            if label:
                var_record.label = label

        dataset.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(var_record)
        return var_record

    @classmethod
    def recode_variable(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset: Dataset,
        source_variable: str,
        target_variable: str,
        rules: List[Dict[str, Any]],
        label: Optional[str] = None,
    ) -> Variable:
        """Recodes values from a source variable into a target variable based on rules."""
        parquet_path = storage.get_local_path(dataset.parquet_storage_key)
        df = pd.read_parquet(parquet_path, engine="pyarrow")

        if source_variable not in df.columns:
            raise ValueError(f"Source variable '{source_variable}' not found.")

        src = df[source_variable].copy()
        tgt = pd.Series(index=df.index, dtype=object)

        # Apply recode rules sequentially
        for r in rules:
            new_val = r["new_value"]
            if r.get("is_else"):
                mask = tgt.isna()
                tgt[mask] = new_val
            elif r.get("is_range"):
                r_min = float(r.get("range_min", float("-inf")))
                r_max = float(r.get("range_max", float("inf")))
                numeric_src = pd.to_numeric(src, errors="coerce")
                mask = (numeric_src >= r_min) & (numeric_src <= r_max) & tgt.isna()
                tgt[mask] = new_val
            else:
                old_val = r.get("old_value")
                # Type matching
                mask = (src == old_val) & tgt.isna()
                tgt[mask] = new_val

        # If target variable is same as source, overwrite, otherwise append
        clean_target = re.sub(r"[^\w]", "_", target_variable.strip())
        df[clean_target] = tgt
        df.to_parquet(parquet_path, engine="pyarrow", index=False)

        var_record = (
            db.query(Variable)
            .filter(Variable.dataset_id == dataset.id, Variable.name == clean_target)
            .first()
        )
        if not var_record:
            var_record = Variable(
                dataset_id=dataset.id,
                name=clean_target,
                column_index=len(df.columns) - 1,
                label=label or clean_target,
                data_type="numeric" if pd.api.types.is_numeric_dtype(df[clean_target]) else "string",
                measurement_level="ordinal" if any(r.get("is_range") for r in rules) else "nominal",
                decimals=2 if pd.api.types.is_numeric_dtype(df[clean_target]) else 0,
            )
            db.add(var_record)
            dataset.column_count = len(df.columns)
        else:
            if label:
                var_record.label = label

        dataset.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(var_record)
        return var_record
