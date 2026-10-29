import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.dataset import Dataset
from app.models.variable import Variable
from app.schemas.variable import VariableUpdate, VariableResponse

router = APIRouter(tags=["Variables"])


@router.get("/datasets/{dataset_id}/variables", response_model=List[VariableResponse])
def list_variables(
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

    variables = (
        db.query(Variable)
        .filter(Variable.dataset_id == dataset_id)
        .order_by(Variable.column_index.asc())
        .all()
    )
    return variables


@router.patch("/variables/{variable_id}", response_model=VariableResponse)
def update_variable(
    variable_id: uuid.UUID,
    variable_in: VariableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    variable = (
        db.query(Variable)
        .join(Dataset)
        .join(Project)
        .filter(Variable.id == variable_id, Project.owner_id == current_user.id)
        .first()
    )
    if not variable:
        raise HTTPException(status_code=404, detail="Variable not found")

    if variable_in.name is not None:
        variable.name = variable_in.name
    if variable_in.label is not None:
        variable.label = variable_in.label
    if variable_in.data_type is not None:
        variable.data_type = variable_in.data_type
    if variable_in.measurement_level is not None:
        variable.measurement_level = variable_in.measurement_level
    if variable_in.role is not None:
        variable.role = variable_in.role
    if variable_in.missing_values is not None:
        variable.missing_values = variable_in.missing_values
    if variable_in.value_labels is not None:
        variable.value_labels = variable_in.value_labels
    if variable_in.display_width is not None:
        variable.display_width = variable_in.display_width
    if variable_in.decimals is not None:
        variable.decimals = variable_in.decimals

    db.commit()
    db.refresh(variable)
    return variable
