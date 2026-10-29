import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_storage, get_current_user
from app.storage.base import StorageBackend
from app.models.user import User
from app.models.project import Project
from app.models.dataset import Dataset
from app.models.analysis import AnalysisRun
from app.schemas.analysis import DescriptivesRequest, AnalysisRunResponse
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/analyses", tags=["Analyses"])


@router.post("/descriptives", response_model=AnalysisRunResponse, status_code=status.HTTP_201_CREATED)
def run_descriptives_analysis(
    req: DescriptivesRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == req.dataset_id, Project.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found or access denied")

    return AnalysisService.run_descriptives(
        db=db,
        storage=storage,
        dataset_id=req.dataset_id,
        variable_names=req.variable_names,
        options={
            "statistics": req.statistics,
            "missing_strategy": req.missing_strategy,
        },
    )


@router.get("/{analysis_id}", response_model=AnalysisRunResponse)
def get_analysis_run(
    analysis_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = (
        db.query(AnalysisRun)
        .join(Dataset)
        .join(Project)
        .filter(AnalysisRun.id == analysis_id, Project.owner_id == current_user.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    return run


@router.get("/dataset/{dataset_id}", response_model=List[AnalysisRunResponse])
def list_dataset_analyses(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
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

    runs = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.dataset_id == dataset_id)
        .order_by(AnalysisRun.created_at.desc())
        .all()
    )
    return runs
