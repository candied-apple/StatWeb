import pytest
import io
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db, SessionLocal
from app.api.deps import get_current_user
from app.models.user import User

client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_full_dataset_and_descriptives_vertical_slice():
    # 1. Create Project
    proj_resp = client.post("/api/v1/projects", json={
        "name": "Academic Study 2026",
        "description": "Validation dataset testing SPSS workflow",
    })
    assert proj_resp.status_code == 201
    project = proj_resp.json()
    project_id = project["id"]

    # 2. Upload CSV dataset
    # 10 observations with known numbers
    csv_content = (
        "id,score,age\n"
        "1,10,25\n"
        "2,12,28\n"
        "3,14,30\n"
        "4,15,31\n"
        "5,17,35\n"
        "6,18,36\n"
        "7,18,37\n"
        "8,20,40\n"
        "9,22,42\n"
        "10,24,45\n"
    )

    files = {
        "file": ("survey_data.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv"),
    }
    data = {
        "project_id": project_id,
        "name": "Survey 2026 Sample",
    }

    upload_resp = client.post("/api/v1/datasets/upload", files=files, data=data)
    assert upload_resp.status_code == 201, upload_resp.text
    dataset = upload_resp.json()
    dataset_id = dataset["id"]

    assert dataset["name"] == "Survey 2026 Sample"
    assert dataset["row_count"] == 10
    assert dataset["column_count"] == 3
    assert len(dataset["variables"]) == 3

    # 3. Query Paginated Data
    data_page_resp = client.get(f"/api/v1/datasets/{dataset_id}/data?offset=0&limit=5")
    assert data_page_resp.status_code == 200
    page = data_page_resp.json()
    assert page["total_rows"] == 10
    assert len(page["rows"]) == 5
    assert page["rows"][0]["score"] == 10.0
    assert page["rows"][4]["score"] == 17.0

    # 4. Update Variable Metadata in Variable View
    score_var = next(v for v in dataset["variables"] if v["name"] == "score")
    var_id = score_var["id"]
    update_var_resp = client.patch(f"/api/v1/variables/{var_id}", json={
        "label": "Exam Performance Score",
        "decimals": 3,
        "measurement_level": "scale",
    })
    assert update_var_resp.status_code == 200
    updated_var = update_var_resp.json()
    assert updated_var["label"] == "Exam Performance Score"
    assert updated_var["decimals"] == 3

    # 5. Execute Descriptive Statistics
    desc_resp = client.post("/api/v1/analyses/descriptives", json={
        "dataset_id": dataset_id,
        "variable_names": ["score", "age"],
    })
    assert desc_resp.status_code == 201, desc_resp.text
    analysis_run = desc_resp.json()
    assert analysis_run["analysis_type"] == "descriptives"
    assert analysis_run["status"] == "completed"

    results = analysis_run["results"]
    assert len(results["variables"]) == 2

    score_res = next(v for v in results["variables"] if v["variable_name"] == "score")
    assert score_res["n_valid"] == 10
    assert score_res["mean"] == pytest.approx(17.0, rel=1e-4)
    assert score_res["variance"] == pytest.approx(19.111111, rel=1e-4)
    assert score_res["std_dev"] == pytest.approx(4.371626, rel=1e-4)
    assert score_res["median"] == pytest.approx(17.5, rel=1e-4)

    # 6. Retrieve Analysis Run from DB
    get_run_resp = client.get(f"/api/v1/analyses/{analysis_run['id']}")
    assert get_run_resp.status_code == 200
    assert get_run_resp.json()["id"] == analysis_run["id"]
