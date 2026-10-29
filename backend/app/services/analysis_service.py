import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.dataset import Dataset
from app.models.variable import Variable
from app.models.analysis import AnalysisRun
from app.storage.base import StorageBackend
from app.services.dataset_service import DatasetService
from app.stats.descriptives import compute_descriptives


class AnalysisService:
    @classmethod
    def run_descriptives(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset_id: uuid.UUID,
        variable_names: List[str],
        options: Optional[Dict[str, Any]] = None,
    ) -> AnalysisRun:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        # Query variable records to check user-defined missing values
        variables = (
            db.query(Variable)
            .filter(Variable.dataset_id == dataset_id, Variable.name.in_(variable_names))
            .all()
        )
        found_names = {v.name for v in variables}
        missing_vars = [name for name in variable_names if name not in found_names]
        if missing_vars:
            raise HTTPException(
                status_code=400,
                detail=f"Variables not found in dataset: {', '.join(missing_vars)}",
            )

        # Build user missing values map
        user_missing_map: Dict[str, List[Any]] = {}
        for var in variables:
            if var.missing_values:
                user_missing_map[var.name] = var.missing_values

        # Load columnar data from Parquet storage
        data = DatasetService.get_columns_data(storage, dataset, variable_names)

        # Call standalone statistics engine
        stat_result = compute_descriptives(
            data=data,
            variable_names=variable_names,
            user_missing=user_missing_map,
            options=options,
        )

        # Persist analysis run record
        analysis_run = AnalysisRun(
            dataset_id=dataset_id,
            analysis_type="descriptives",
            name=f"Descriptive Statistics ({', '.join(variable_names[:3])}{'...' if len(variable_names) > 3 else ''})",
            parameters={
                "variables": variable_names,
                "options": options or {},
            },
            results=stat_result.to_dict(),
            status="completed",
        )
        db.add(analysis_run)
        db.commit()
        db.refresh(analysis_run)
        return analysis_run
