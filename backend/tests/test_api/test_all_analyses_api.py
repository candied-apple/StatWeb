import pytest
import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_all_analyses_via_api():
    # 1. Project
    proj = client.post("/api/v1/projects", json={"name": "Comprehensive Analysis Project"}).json()
    proj_id = proj["id"]

    # 2. Upload CSV dataset with rich variables:
    # gender: 1 or 2
    # group: A, B, C (mapped to 1, 2, 3)
    # pre_score, post_score, age, salary
    csv_data = (
        "gender,group,pre_score,post_score,age,salary\n"
        "1,1,50,60,25,45000\n"
        "1,1,55,65,28,48000\n"
        "2,1,60,70,30,52000\n"
        "2,2,65,75,32,55000\n"
        "1,2,70,80,35,62000\n"
        "2,2,75,85,38,68000\n"
        "1,3,80,90,40,75000\n"
        "2,3,85,95,45,82000\n"
        "1,3,90,100,48,90000\n"
        "2,3,95,105,52,98000\n"
    )
    files = {"file": ("data.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    dataset = client.post("/api/v1/datasets/upload", files=files, data={"project_id": proj_id}).json()
    d_id = dataset["id"]

    # 3. Frequencies
    freq_resp = client.post("/api/v1/analyses/frequencies", json={
        "dataset_id": d_id,
        "variable_names": ["gender", "group"],
    })
    assert freq_resp.status_code == 201
    freq_json = freq_resp.json()
    assert freq_json["analysis_type"] == "frequencies"
    assert len(freq_json["results"]["variables"]) == 2

    # 4. Crosstabs
    ct_resp = client.post("/api/v1/analyses/crosstabs", json={
        "dataset_id": d_id,
        "row_variable": "gender",
        "column_variable": "group",
    })
    assert ct_resp.status_code == 201
    ct_json = ct_resp.json()
    assert ct_json["analysis_type"] == "crosstabs"
    assert ct_json["results"]["n_valid"] == 10

    # 5. Independent T-Test (post_score across gender: 1 vs 2)
    t_resp = client.post("/api/v1/analyses/ttest-ind", json={
        "dataset_id": d_id,
        "test_variable": "post_score",
        "group_variable": "gender",
        "group1_value": 1,
        "group2_value": 2,
    })
    assert t_resp.status_code == 201
    t_json = t_resp.json()
    assert t_json["analysis_type"] == "ttest_ind"
    assert len(t_json["results"]["tests"]) == 2

    # 6. Paired T-Test (pre_score vs post_score)
    pt_resp = client.post("/api/v1/analyses/ttest-paired", json={
        "dataset_id": d_id,
        "pair1_variable": "pre_score",
        "pair2_variable": "post_score",
    })
    assert pt_resp.status_code == 201
    pt_json = pt_resp.json()
    assert pt_json["analysis_type"] == "ttest_paired"
    assert pt_json["results"]["mean_diff"] == pytest.approx(-10.0, abs=1e-4)

    # 7. One-Way ANOVA (post_score by group)
    a_resp = client.post("/api/v1/analyses/anova", json={
        "dataset_id": d_id,
        "dependent_variable": "post_score",
        "factor_variable": "group",
    })
    assert a_resp.status_code == 201
    a_json = a_resp.json()
    assert a_json["analysis_type"] == "anova"
    assert len(a_json["results"]["anova_table"]) == 3

    # 8. Bivariate Correlation
    c_resp = client.post("/api/v1/analyses/correlation", json={
        "dataset_id": d_id,
        "variable_names": ["pre_score", "post_score", "age", "salary"],
    })
    assert c_resp.status_code == 201
    c_json = c_resp.json()
    assert c_json["analysis_type"] == "correlation"
    assert len(c_json["results"]["matrix"]) == 16

    # 9. Linear Regression (salary dependent on age and post_score)
    r_resp = client.post("/api/v1/analyses/regression", json={
        "dataset_id": d_id,
        "dependent_variable": "salary",
        "independent_variables": ["age", "post_score"],
    })
    assert r_resp.status_code == 201
    r_json = r_resp.json()
    assert r_json["analysis_type"] == "regression"
    assert r_json["results"]["r_squared"] > 0.9
