import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import pandas as pd
import numpy as np
import pyreadstat
from sqlalchemy.orm import Session

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
                # Map SPSS measure names: scale, nominal, ordinal
                measure_str = str(measure).lower()
                if measure_str not in ["scale", "nominal", "ordinal"]:
                    measure_str = "scale"

                val_labels = meta.variable_value_labels.get(col_name) if meta.variable_value_labels else None
                val_labels_dict = {str(k): str(v) for k, v in val_labels.items()} if val_labels else None

                missing_user = meta.missing_user_values.get(col_name) if meta.missing_user_values else []
                missing_list = list(missing_user) if missing_user else None

                # Infer dtype
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

        # 3. Convert DataFrame to Parquet for fast columnar and paginated reading
        # Ensure column names are all string
        df.columns = [str(c) for c in df.columns]
        # Save parquet file locally via storage path
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
