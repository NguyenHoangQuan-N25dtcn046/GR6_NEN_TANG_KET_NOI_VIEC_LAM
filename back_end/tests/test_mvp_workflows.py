from tests.helpers import auth_header, create_job, create_user


def test_admin_reviews_queue_and_creates_category(client, db_session):
    employer, profile = create_user(db_session, "employer@test.com", "employer")
    admin, _ = create_user(db_session, "admin@test.com", "admin")
    waiting = create_job(db_session, profile.id, status="pending")
    create_job(db_session, profile.id, status="published")
    queue = "/api/v1/admin/jobs"
    headers = auth_header(admin)
    assert client.get(queue, headers=auth_header(employer)).status_code == 403
    response = client.get(queue, params={"approval_status": "pending"}, headers=headers)
    assert [job["id"] for job in response.json()] == [waiting.id]
    assert client.patch(f"{queue}/{waiting.id}/approve", headers=headers).status_code == 200
    assert client.patch(f"{queue}/{waiting.id}/reject", headers=headers, json={"reason": "Invalid content"}).status_code == 409
    assert client.get(queue, params={"approval_status": "pending"}, headers=headers).json() == []

    response = client.post("/api/v1/admin/categories", headers=headers, json={"name": " QA "})
    assert response.status_code == 201
    assert client.get("/api/v1/jobs/categories").json() == [response.json()]
    assert client.post("/api/v1/admin/categories", headers=headers, json={"name": "QA"}).status_code == 409


def test_admin_can_lock_accounts_and_invalidate_existing_tokens(api):
    client, _, tokens = api
    users = "/api/v1/admin/users"
    headers = tokens["admin"]
    assert client.get(users, headers=tokens["candidate"]).status_code == 403
    data = client.get(users, params={"role": "candidate"}, headers=headers).json()["data"]
    assert len(data) == 1
    assert set(data[0]) == {"id", "email", "role", "is_active"}
    assert client.patch(users + "/4", headers=headers, json={"is_active": False}).status_code == 409
    path = f"{users}/{data[0]['id']}"
    response = client.patch(path, headers=headers, json={"is_active": False})
    assert response.status_code == 200 and not response.json()["is_active"]
    assert client.get("/api/v1/auth/me", headers=tokens["candidate"]).status_code == 403
    assert client.patch(path, headers=headers, json={"is_active": True}).json()["is_active"]
    assert client.get("/api/v1/auth/me", headers=tokens["candidate"]).status_code == 401


def test_employer_can_only_read_and_update_own_company(client, db_session):
    employer, _ = create_user(db_session, "emp@test.com", "employer")
    other, _ = create_user(db_session, "other@test.com", "employer")
    candidate, _ = create_user(db_session, "cand@test.com", "candidate")
    url = "/api/v1/employer/profile"
    headers = auth_header(employer)
    assert client.get(url, headers=auth_header(candidate)).status_code == 403
    response = client.patch(url, headers=headers, json={
        "company_name": " New company ", "company_website": "https://example.com", "description": "Company overview",
    })
    assert response.status_code == 200
    assert response.json()["company_name"] == "New company"
    assert client.get(url, headers=auth_header(other)).json()["company_name"] != "New company"
    assert client.patch(url, headers=headers, json={"company_name": None}).status_code == 422
    assert client.patch(url, headers=headers, json={"company_website": "example"}).status_code == 422
    assert client.patch(url, headers=headers, json={"company_website": None}).json()["company_website"] is None


def test_job_filters_and_partial_salary_validation(client, db_session):
    employer, _ = create_user(db_session, "emp@test.com", "employer", company_name="Example company")
    admin, _ = create_user(db_session, "admin@test.com", "admin")
    payload = {
        "title": "Software Engineer", "description": "Software engineering", "location": "Hanoi",
        "job_type": "full-time", "experience_years": 4, "work_mode": "remote",
        "salary_min": "15000000", "salary_max": "25000000",
    }
    headers = auth_header(employer)
    created = client.post("/api/v1/employer/jobs", headers=headers, json=payload)
    assert created.status_code == 201
    job_id = created.json()["id"]
    job = f"/api/v1/jobs/{job_id}"
    assert client.patch(job, headers=headers, json={"salary_min": "30000000"}).status_code == 422
    assert client.get(created.headers["location"], headers=headers).json()["salary_min"] == "15000000.00"
    assert client.patch(f"/api/v1/admin/jobs/{job_id}/approve", headers=auth_header(admin)).status_code == 200
    response = client.get("/api/v1/jobs", params=[
        ("work_mode", "hybrid"), ("work_mode", "remote"), ("job_type", "full-time"),
        ("experience", "4+"), ("salary_min", "20000000"), ("q", "Example company"),
    ])
    assert [item["id"] for item in response.json()] == [job_id]
    assert client.get("/api/v1/jobs", params={"experience": "0-1"}).json() == []
    assert client.patch(job, headers=headers, json={"deadline": None, "work_mode": None}).status_code == 200


def test_saved_jobs_are_private_and_idempotent(client, db_session):
    candidate, _ = create_user(db_session, "candidate@test.com", "candidate")
    other, _ = create_user(db_session, "other@test.com", "candidate")
    employer, profile = create_user(db_session, "emp@test.com", "employer")
    job = create_job(db_session, profile.id)
    url = "/api/v1/candidate/saved-jobs"
    item = f"{url}/{job.id}"
    assert client.put(item, headers=auth_header(employer)).status_code == 403
    headers = auth_header(candidate)
    assert client.put(item, headers=headers).status_code == 204
    assert client.put(item, headers=headers).status_code == 204
    assert [saved["id"] for saved in client.get(url, headers=headers).json()] == [job.id]
    assert client.get(url, headers=auth_header(other)).json() == []
    assert client.delete(item, headers=headers).status_code == 204
    assert client.delete(item, headers=headers).status_code == 204
    assert client.get(url, headers=headers).json() == []


def test_password_change_requires_current_password_and_revokes_tokens(api):
    client, _, tokens = api
    headers = tokens["candidate"]
    path = "/api/v1/auth/password"
    current = "SecurePass123!"
    replacement = "Replacement123!"
    assert client.patch(path, headers=headers, json={
        "current_password": "WrongPassword1!", "new_password": replacement,
    }).status_code == 400
    assert client.patch(path, headers=headers, json={
        "current_password": current, "new_password": replacement,
    }).status_code == 204
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401
    login = "/api/v1/auth/login"
    assert client.post(login, json={"email": "candidate@example.com", "password": current}).status_code == 401
    assert client.post(login, json={"email": "candidate@example.com", "password": replacement}).status_code == 200
