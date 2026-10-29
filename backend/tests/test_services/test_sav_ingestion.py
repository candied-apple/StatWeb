import pytest
import pyreadstat
import pandas as pd
from pathlib import Path
from app.db.session import SessionLocal
from app.api.deps import get_current_user, get_storage
from app.models.project import Project
from app.services.dataset_service import DatasetService


def test_spss_sav_ingestion(tmp_path: Path):
    db = SessionLocal()
    storage = get_storage()
    user = get_current_user(db)

    project = Project(name="SPSS Test Project", owner_id=user.id)
    db.add(project)
    db.commit()
    db.refresh(project)

    # Create dummy SPSS dataset with pyreadstat
    df = pd.DataFrame({
        "gender": [1.0, 2.0, 1.0, 2.0],
        "income": [45000.0, 52000.0, 61000.0, 75000.0],
    })
    column_labels = {"gender": "Gender of Respondent", "income": "Annual Household Income"}
    variable_value_labels = {"gender": {1.0: "Male", 2.0: "Female"}}
    variable_measure = {"gender": "nominal", "income": "scale"}

    sav_file_path = tmp_path / "test_data.sav"
    pyreadstat.write_sav(
        df,
        str(sav_file_path),
        column_labels=column_labels,
        variable_value_labels=variable_value_labels,
        variable_measure=variable_measure,
    )

    sav_bytes = sav_file_path.read_bytes()

    dataset = DatasetService.ingest_file(
        db=db,
        storage=storage,
        project_id=project.id,
        filename="test_data.sav",
        file_bytes=sav_bytes,
    )

    assert dataset.row_count == 4
    assert dataset.column_count == 2
    assert len(dataset.variables) == 2

    # Verify metadata preservation (as strictly required in AGENTS.md)
    gender_var = next(v for v in dataset.variables if v.name == "gender")
    assert gender_var.label == "Gender of Respondent"
    assert gender_var.measurement_level == "nominal"
    assert gender_var.value_labels is not None
    # Check value labels preservation
    assert "1" in str(gender_var.value_labels) or "1.0" in str(gender_var.value_labels)
    assert "Male" in str(gender_var.value_labels)

    income_var = next(v for v in dataset.variables if v.name == "income")
    assert income_var.label == "Annual Household Income"
    assert income_var.measurement_level == "scale"

    db.close()
