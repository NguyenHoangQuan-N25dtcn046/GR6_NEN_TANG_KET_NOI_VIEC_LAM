from tests.helpers import auth_header, create_job, create_user


def test_employer_crud_jobs(client, db_session):
    emp_user, _ = create_user(db_session, "emp@test.com", "employer")
    headers = auth_header(emp_user)

    # Tạo tin (mặc định pending, chờ admin duyệt)
    resp = client.post(
        "/api/v1/employer/jobs",
        json={"title": "Backend", "description": "Mô tả", "location": "Hà Nội"},
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "pending"
    job_id = resp.json()["id"]

    # Liệt kê tin của mình
    resp = client.get("/api/v1/employer/jobs", headers=headers)
    assert len(resp.json()) == 1

    # Sửa + đóng tin
    resp = client.patch(
        f"/api/v1/employer/jobs/{job_id}",
        json={"title": "Backend 2", "status": "closed"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Backend 2"
    assert resp.json()["status"] == "closed"

    # Xóa tin
    resp = client.delete(f"/api/v1/employer/jobs/{job_id}", headers=headers)
    assert resp.status_code == 204

    resp = client.get("/api/v1/employer/jobs", headers=headers)
    assert resp.json() == []


def test_employer_cannot_touch_others_job(client, db_session):
    _, emp_a = create_user(db_session, "a@test.com", "employer")
    emp_b_user, _ = create_user(db_session, "b@test.com", "employer")
    job = create_job(db_session, emp_a.id, status="published")

    resp = client.patch(f"/api/v1/employer/jobs/{job.id}", json={"title": "Hacked"}, headers=auth_header(emp_b_user))
    assert resp.status_code == 403

    resp = client.delete(f"/api/v1/employer/jobs/{job.id}", headers=auth_header(emp_b_user))
    assert resp.status_code == 403


def test_employer_cannot_publish_own_job(client, db_session):
    emp_user, _ = create_user(db_session, "emp@test.com", "employer")
    headers = auth_header(emp_user)

    resp = client.post(
        "/api/v1/employer/jobs",
        json={"title": "X", "description": "Y", "location": "Z"},
        headers=headers,
    )
    job_id = resp.json()["id"]

    # Employer không được tự duyệt published/rejected (chỉ admin)
    resp = client.patch(
        f"/api/v1/employer/jobs/{job_id}",
        json={"status": "published"},
        headers=headers,
    )
    assert resp.status_code == 422


def test_employer_rejects_invalid_category(client, db_session):
    emp_user, _ = create_user(db_session, "emp@test.com", "employer")
    resp = client.post(
        "/api/v1/employer/jobs",
        json={"title": "X", "description": "Y", "location": "Z", "category_id": 9999},
        headers=auth_header(emp_user),
    )
    assert resp.status_code == 400
