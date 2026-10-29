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

    # Request PDF in Turkish and English
    pdf_resp_tr = client.get(f"/api/v1/analyses/{run['id']}/pdf?lang=tr")
    assert pdf_resp_tr.status_code == 200
    assert pdf_resp_tr.headers["content-type"] == "application/pdf"
    assert pdf_resp_tr.content.startswith(b"%PDF")

    pdf_resp_en = client.get(f"/api/v1/analyses/{run['id']}/pdf?lang=en")
    assert pdf_resp_en.status_code == 200
    assert pdf_resp_en.headers["content-type"] == "application/pdf"
    assert pdf_resp_en.content.startswith(b"%PDF")

    # Run regression and check PDF
    reg_run = client.post("/api/v1/analyses/regression", json={
        "dataset_id": dataset["id"],
        "dependent_variable": "b",
        "independent_variables": ["a"],
    }).json()
    reg_pdf = client.get(f"/api/v1/analyses/{reg_run['id']}/pdf")
    assert reg_pdf.status_code == 200
    assert reg_pdf.content.startswith(b"%PDF")
