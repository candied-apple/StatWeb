import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_dataset_mutations_and_export():
    # 1. Create project & upload initial CSV dataset
    proj = client.post("/api/v1/projects", json={"name": "Mutation Test Proj"}).json()
    csv_content = b"age,income,gender\n25,50000,1\n35,75000,2\n45,90000,1\n"
    files = {"file": ("test_mutations.csv", io.BytesIO(csv_content), "text/csv")}
    dataset = client.post("/api/v1/datasets/upload", files=files, data={"project_id": proj["id"]}).json()
    d_id = dataset["id"]

    assert dataset["row_count"] == 3
    assert dataset["column_count"] == 3

    # 2. Update cell: change row 0, age from 25 to 26
    update_res = client.patch(f"/api/v1/datasets/{d_id}/cells", json={
        "updates": [{"row_index": 0, "column_name": "age", "value": 26}]
    })
    assert update_res.status_code == 200
    assert update_res.json()["updated_cells"] == 1

    # Verify updated data
    page = client.get(f"/api/v1/datasets/{d_id}/data?offset=0&limit=10").json()
    assert page["rows"][0]["age"] == 26

    # 3. Add row
    add_row_res = client.post(f"/api/v1/datasets/{d_id}/rows", json={"values": {"age": 55, "income": 120000, "gender": 2}})
    assert add_row_res.status_code == 200
    assert add_row_res.json()["total_rows"] == 4

    # 4. Delete row 1 (the 35-year-old)
    del_row_res = client.delete(f"/api/v1/datasets/{d_id}/rows/1")
    assert del_row_res.status_code == 200
    assert del_row_res.json()["total_rows"] == 3

    # 5. Add variable
    add_var_res = client.post(f"/api/v1/datasets/{d_id}/variables", json={
        "name": "education",
        "data_type": "numeric",
        "label": "Education Level",
        "measurement_level": "ordinal",
        "decimals": 0,
    })
    assert add_var_res.status_code == 200
    assert add_var_res.json()["name"] == "education"

    # 6. Compute variable (e.g. monthly_income = income / 12)
    compute_res = client.post(f"/api/v1/datasets/{d_id}/compute", json={
        "target_variable": "monthly_income",
        "expression": "income / 12",
        "label": "Monthly Income",
    })
    assert compute_res.status_code == 200
    assert compute_res.json()["name"] == "monthly_income"

    # Verify computed value in data page
    page_after_comp = client.get(f"/api/v1/datasets/{d_id}/data?offset=0&limit=10").json()
    assert round(page_after_comp["rows"][0]["monthly_income"], 1) == round(50000 / 12, 1)

    # 7. Recode variable: gender 1 -> 10, 2 -> 20
    recode_res = client.post(f"/api/v1/datasets/{d_id}/recode", json={
        "source_variable": "gender",
        "target_variable": "gender_recoded",
        "label": "Gender Recoded",
        "rules": [
            {"old_value": 1, "new_value": 10},
            {"old_value": 2, "new_value": 20},
        ],
    })
    assert recode_res.status_code == 200
    assert recode_res.json()["name"] == "gender_recoded"

    # 8. Export CSV
    export_csv = client.get(f"/api/v1/datasets/{d_id}/export?format=csv")
    assert export_csv.status_code == 200
    assert "text/csv" in export_csv.headers["content-type"]
    assert b"monthly_income" in export_csv.content

    # 9. Export XLSX
    export_xlsx = client.get(f"/api/v1/datasets/{d_id}/export?format=xlsx")
    assert export_xlsx.status_code == 200
    assert "spreadsheetml" in export_xlsx.headers["content-type"]

    # 10. Delete variable
    del_var_res = client.delete(f"/api/v1/datasets/{d_id}/variables/education")
    assert del_var_res.status_code == 204
