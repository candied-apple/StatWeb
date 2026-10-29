import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.api.deps import get_storage, get_current_user
from app.storage.base import StorageBackend
from app.models.user import User
from app.models.project import Project
from app.models.dataset import Dataset
from app.schemas.dataset import (
    DatasetResponse,
    DatasetDataPageResponse,
    CellBatchUpdateRequest,
    AddRowRequest,
    AddVariableRequest,
    ComputeVariableRequest,
    RecodeVariableRequest,
)
from app.schemas.variable import VariableResponse
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    project_id: uuid.UUID = Form(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Target project not found")

    content = await file.read()
    max_size_mb = 100
    if len(content) > max_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum size of {max_size_mb} MB")

    try:
        dataset = DatasetService.ingest_file(
            db=db,
            storage=storage,
            project_id=project_id,
            filename=file.filename or "dataset.csv",
            file_bytes=content,
            custom_name=name,
        )
        dataset_with_vars = (
            db.query(Dataset)
            .filter(Dataset.id == dataset.id)
            .options(joinedload(Dataset.variables))
            .first()
        )
        return dataset_with_vars
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest dataset: {str(e)}")


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .options(joinedload(Dataset.variables))
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.get("/{dataset_id}/data", response_model=DatasetDataPageResponse)
def get_dataset_data(
    dataset_id: uuid.UUID,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    columns: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        return DatasetService.get_data_page(
            storage=storage,
            dataset=dataset,
            offset=offset,
            limit=limit,
            columns=columns,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset page: {str(e)}")


@router.patch("/{dataset_id}/cells")
def update_dataset_cells(
    dataset_id: uuid.UUID,
    req: CellBatchUpdateRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    updated = DatasetService.update_cells(
        db=db,
        storage=storage,
        dataset=dataset,
        updates=[u.model_dump() for u in req.updates],
    )
    return {"status": "success", "updated_cells": updated}


@router.post("/{dataset_id}/rows")
def add_dataset_row(
    dataset_id: uuid.UUID,
    req: Optional[AddRowRequest] = None,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    new_total = DatasetService.add_row(
        db=db,
        storage=storage,
        dataset=dataset,
        values=req.values if req else None,
    )
    return {"status": "success", "total_rows": new_total}


@router.delete("/{dataset_id}/rows/{row_index}")
def delete_dataset_row(
    dataset_id: uuid.UUID,
    row_index: int,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        new_total = DatasetService.delete_row(
            db=db,
            storage=storage,
            dataset=dataset,
            row_index=row_index,
        )
        return {"status": "success", "total_rows": new_total}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{dataset_id}/variables", response_model=VariableResponse)
def add_dataset_variable(
    dataset_id: uuid.UUID,
    req: AddVariableRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        new_var = DatasetService.add_variable(
            db=db,
            storage=storage,
            dataset=dataset,
            name=req.name,
            data_type=req.data_type,
            label=req.label,
            measurement_level=req.measurement_level,
            decimals=req.decimals,
        )
        return new_var
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{dataset_id}/variables/{variable_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset_variable(
    dataset_id: uuid.UUID,
    variable_name: str,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        DatasetService.delete_variable(
            db=db,
            storage=storage,
            dataset=dataset,
            variable_name=variable_name,
        )
        return None
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{dataset_id}/export")
def export_dataset(
    dataset_id: uuid.UUID,
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    content, media_type, filename = DatasetService.export_dataset(
        storage=storage,
        dataset=dataset,
        export_format=format,
    )
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{dataset_id}/compute", response_model=VariableResponse)
def compute_dataset_variable(
    dataset_id: uuid.UUID,
    req: ComputeVariableRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        var_record = DatasetService.compute_variable(
            db=db,
            storage=storage,
            dataset=dataset,
            target_variable=req.target_variable,
            expression=req.expression,
            label=req.label,
        )
        return var_record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{dataset_id}/recode", response_model=VariableResponse)
def recode_dataset_variable(
    dataset_id: uuid.UUID,
    req: RecodeVariableRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        var_record = DatasetService.recode_variable(
            db=db,
            storage=storage,
            dataset=dataset,
            source_variable=req.source_variable,
            target_variable=req.target_variable,
            rules=[r.model_dump() for r in req.rules],
            label=req.label,
        )
        return var_record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if storage.exists(dataset.raw_storage_key):
        storage.delete(dataset.raw_storage_key)
    if storage.exists(dataset.parquet_storage_key):
        storage.delete(dataset.parquet_storage_key)

    db.delete(dataset)
    db.commit()
    return None
