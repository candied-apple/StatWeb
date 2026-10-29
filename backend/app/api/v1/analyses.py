import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_storage, get_current_user
from app.storage.base import StorageBackend
from app.models.user import User
from app.models.project import Project
from app.models.dataset import Dataset
from app.models.analysis import AnalysisRun
from app.schemas.analysis import (
    DescriptivesRequest,
    FrequenciesRequest,
    CrosstabRequest,
    IndependentTTestRequest,
    PairedTTestRequest,
    AnovaRequest,
    CorrelationRequest,
    RegressionRequest,
    AnalysisRunResponse,
)
from app.services.analysis_service import AnalysisService
from app.services.report_service import ReportService

router = APIRouter(prefix="/analyses", tags=["Analyses"])


def _verify_dataset_access(db: Session, dataset_id: uuid.UUID, user: User) -> Dataset:
    dataset = (
        db.query(Dataset)
        .join(Project)
        .filter(Dataset.id == dataset_id, Project.owner_id == user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found or access denied")
    return dataset


@router.post("/descriptives", response_model=AnalysisRunResponse, status_code=status.HTTP_201_CREATED)
def run_descriptives_analysis(
    req: DescriptivesRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    _verify_dataset_access(db, req.dataset_id, current_user)
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


@router.post("/frequencies", response_model=AnalysisRunResponse, status_code=status.HTTP_201_CREATED)
def run_frequencies_analysis(
    req: FrequenciesRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    _verify_dataset_access(db, req.dataset_id, current_user)
    return AnalysisService.run_frequencies(
        db=db,
        storage=storage,
        dataset_id=req.dataset_id,
        variable_names=req.variable_names,
    )


@router.post("/crosstabs", response_model=AnalysisRunResponse, status_code=status.HTTP_201_CREATED)
def run_crosstabs_analysis(
    req: CrosstabRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    _verify_dataset_access(db, req.dataset_id, current_user)
    return AnalysisService.run_crosstabs(
        db=db,
        storage=storage,
        dataset_id=req.dataset_id,
        row_var=req.row_variable,
        col_var=req.column_variable,
    )


@router.post("/ttest-ind", response_model=AnalysisRunResponse, status_code=status.HTTP_201_CREATED)
def run_independent_ttest_analysis(
    req: IndependentTTestRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    _verify_dataset_access(db, req.dataset_id, current_user)
    return AnalysisService.run_independent_ttest(
        db=db,
        storage=storage,
        dataset_id=req.dataset_id,
        test_var=req.test_variable,
        group_var=req.group_variable,
        group1_val=req.group1_value,
        group2_val=req.group2_value,
    )


@router.post("/ttest-paired", response_model=AnalysisRunResponse, status_code=status.HTTP_201_CREATED)
def run_paired_ttest_analysis(
    req: PairedTTestRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    _verify_dataset_access(db, req.dataset_id, current_user)
    return AnalysisService.run_paired_ttest(
        db=db,
        storage=storage,
        dataset_id=req.dataset_id,
        pair1_var=req.pair1_variable,
        pair2_var=req.pair2_variable,
    )


@router.post("/anova", response_model=AnalysisRunResponse, status_code=status.HTTP_201_CREATED)
def run_anova_analysis(
    req: AnovaRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    _verify_dataset_access(db, req.dataset_id, current_user)
    return AnalysisService.run_anova(
        db=db,
        storage=storage,
        dataset_id=req.dataset_id,
        dep_var=req.dependent_variable,
        factor_var=req.factor_variable,
    )


@router.post("/correlation", response_model=AnalysisRunResponse, status_code=status.HTTP_201_CREATED)
def run_correlation_analysis(
    req: CorrelationRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    _verify_dataset_access(db, req.dataset_id, current_user)
    return AnalysisService.run_correlation(
        db=db,
        storage=storage,
        dataset_id=req.dataset_id,
        variable_names=req.variable_names,
    )


@router.post("/regression", response_model=AnalysisRunResponse, status_code=status.HTTP_201_CREATED)
def run_regression_analysis(
    req: RegressionRequest,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    _verify_dataset_access(db, req.dataset_id, current_user)
    return AnalysisService.run_regression(
        db=db,
        storage=storage,
        dataset_id=req.dataset_id,
        dependent_var=req.dependent_variable,
        independent_vars=req.independent_variables,
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
    _verify_dataset_access(db, dataset_id, current_user)
    runs = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.dataset_id == dataset_id)
        .order_by(AnalysisRun.created_at.desc())
        .all()
    )
    return runs


@router.get("/{analysis_id}/pdf")
def export_analysis_pdf(
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

    pdf_bytes = ReportService.generate_pdf_report(run)
    safe_name = run.analysis_type
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report_{safe_name}_{analysis_id}.pdf"'},
    )

