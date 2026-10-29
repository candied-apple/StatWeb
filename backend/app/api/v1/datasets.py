import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.api.deps import get_storage, get_current_user
from app.storage.base import StorageBackend
from app.models.user import User
from app.models.project import Project
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetResponse, DatasetDataPageResponse
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
        # Reload with variables
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

    # Clean up storage files
    if storage.exists(dataset.raw_storage_key):
        storage.delete(dataset.raw_storage_key)
    if storage.exists(dataset.parquet_storage_key):
        storage.delete(dataset.parquet_storage_key)

    db.delete(dataset)
    db.commit()
    return None
