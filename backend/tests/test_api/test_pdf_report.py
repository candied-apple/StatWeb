import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_pdf_report_generation():
    proj = client.post("/api/v1/projects", json={"name": "PDF Report Test Project"}).json()
    files = {"file": ("report_data.csv", io.BytesIO(b"a,b\n1,10\n2,20\n3,30\n"), "text/csv")}
    dataset = client.post("/api/v1/datasets/upload", files=files, data={"project_id": proj["id"]}).json()

    # Run descriptives
    run = client.post("/api/v1/analyses/descriptives", json={
        "dataset_id": dataset["id"],
        "variable_names": ["a", "b"],
    }).json()

    # Request PDF
    pdf_resp = client.get(f"/api/v1/analyses/{run['id']}/pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert pdf_resp.content.startswith(b"%PDF")

    # Run regression and check PDF
    reg_run = client.post("/api/v1/analyses/regression", json={
        "dataset_id": dataset["id"],
        "dependent_variable": "b",
        "independent_variables": ["a"],
    }).json()
    reg_pdf = client.get(f"/api/v1/analyses/{reg_run['id']}/pdf")
    assert reg_pdf.status_code == 200
    assert reg_pdf.content.startswith(b"%PDF")
