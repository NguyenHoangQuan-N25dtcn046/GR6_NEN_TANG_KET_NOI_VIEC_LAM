from tests.helpers import auth_header, create_job, create_user


def test_employer_crud_jobs(client, db_session):
    emp_user, _ = create_user(db_session, "emp@test.com", "employer")
    headers = auth_header(emp_user)

    # Tạo tin (chờ duyệt)
    resp = client.post(
        "/api/v1/employer/jobs",
        json={"title": "Backend Developer", "description": "Mô tả công việc chi tiết", "location": "Hà Nội"},
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["approval_status"] == "pending"
    job_id = resp.json()["id"]

    # Liệt kê tin của mình
    resp = client.get("/api/v1/employer/jobs", headers=headers)
    assert len(resp.json()) == 1

    # Đóng tin (PATCH /jobs/{id}/status)
    resp = client.patch(f"/api/v1/jobs/{job_id}/status", json={"job_status": "closed"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["job_status"] == "closed"

    # Xóa tin
    resp = client.delete(f"/api/v1/employer/jobs/{job_id}", headers=headers)
    assert resp.status_code == 204

    resp = client.get("/api/v1/employer/jobs", headers=headers)
    assert resp.json() == []


def test_employer_cannot_touch_others_job(client, db_session):
    _, emp_a = create_user(db_session, "a@test.com", "employer")
    emp_b_user, _ = create_user(db_session, "b@test.com", "employer")
    job = create_job(db_session, emp_a.id, status="published")

    # Employer B không sửa được tin của A (PATCH /jobs/{id})
    resp = client.patch(f"/api/v1/jobs/{job.id}", json={"title": "Hacked title"}, headers=auth_header(emp_b_user))
    assert resp.status_code == 403

    # Employer B không xóa được tin của A
    resp = client.delete(f"/api/v1/employer/jobs/{job.id}", headers=auth_header(emp_b_user))
    assert resp.status_code == 403


def test_employer_cannot_reopen_unapproved(client, db_session):
    emp_user, _ = create_user(db_session, "emp@test.com", "employer")
    headers = auth_header(emp_user)

    resp = client.post(
        "/api/v1/employer/jobs",
        json={"title": "Backend", "description": "Mô tả công việc chi tiết", "location": "Hà Nội"},
        headers=headers,
    )
    job_id = resp.json()["id"]

    # Tin chưa duyệt → không được mở lại
    resp = client.patch(f"/api/v1/jobs/{job_id}/status", json={"job_status": "open"}, headers=headers)
    assert resp.status_code == 409


def test_employer_rejects_invalid_category(client, db_session):
    emp_user, _ = create_user(db_session, "emp@test.com", "employer")
    resp = client.post(
        "/api/v1/employer/jobs",
        json={"title": "Backend", "description": "Mô tả công việc chi tiết", "location": "Hà Nội", "category_id": 9999},
        headers=auth_header(emp_user),
    )
    assert resp.status_code == 400
