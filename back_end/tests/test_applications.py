from datetime import date, timedelta

from tests.helpers import auth_header, create_job, create_user


def _apply(client, job_id, user):
    return client.post(
        f"/api/v1/jobs/{job_id}/applications",
        json={"cover_letter": "Xin chào, tôi muốn ứng tuyển"},
        headers=auth_header(user),
    )


def test_apply_and_prevent_duplicate(client, db_session):
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    _, emp = create_user(db_session, "emp@test.com", "employer")
    job = create_job(db_session, emp.id, status="published")

    resp = _apply(client, job.id, cand)
    assert resp.status_code == 201
    assert resp.json()["status"] == "submitted"
    assert resp.json()["job_title"] == job.title

    dup = _apply(client, job.id, cand)
    assert dup.status_code == 409


def test_cannot_apply_to_unapproved(client, db_session):
    cand, _ = create_user(db_session, "cand2@test.com", "candidate")
    _, emp = create_user(db_session, "emp2@test.com", "employer")
    job = create_job(db_session, emp.id, status="pending")

    resp = _apply(client, job.id, cand)
    assert resp.status_code == 400


def test_cannot_apply_expired(client, db_session):
    cand, _ = create_user(db_session, "cand3@test.com", "candidate")
    _, emp = create_user(db_session, "emp3@test.com", "employer")
    job = create_job(db_session, emp.id, status="published", deadline=date.today() - timedelta(days=1))

    resp = _apply(client, job.id, cand)
    assert resp.status_code == 400


def test_candidate_sees_only_own_applications(client, db_session):
    cand_a, _ = create_user(db_session, "a@test.com", "candidate")
    cand_b, _ = create_user(db_session, "b@test.com", "candidate")
    _, emp = create_user(db_session, "emp@test.com", "employer")
    job = create_job(db_session, emp.id, status="published")

    created = _apply(client, job.id, cand_a)
    location = created.headers["Location"]
    detail = client.get(location, headers=auth_header(cand_a))
    assert detail.status_code == 200
    assert detail.json() == created.json()
    assert client.get(location, headers=auth_header(cand_b)).status_code == 404

    resp = client.get("/api/v1/candidate/applications", headers=auth_header(cand_a))
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp_b = client.get("/api/v1/candidate/applications", headers=auth_header(cand_b))
    assert resp_b.json() == []


def test_employer_view_and_process_applications(client, db_session):
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    emp_user, emp = create_user(db_session, "emp@test.com", "employer")
    other_user, _ = create_user(db_session, "other@test.com", "employer")
    job = create_job(db_session, emp.id, status="published")

    _apply(client, job.id, cand)

    resp = client.get(f"/api/v1/employer/jobs/{job.id}/applications", headers=auth_header(emp_user))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["candidate_name"] == "Ứng viên Test"

    resp = client.get(f"/api/v1/employer/jobs/{job.id}/applications", headers=auth_header(other_user))
    assert resp.status_code == 403

    app_id = data[0]["id"]
    resp = client.patch(
        f"/api/v1/employer/jobs/{job.id}/applications/{app_id}",
        json={"status": "accepted"},
        headers=auth_header(emp_user),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"


def test_apply_with_custom_cv(client, db_session, tmp_path, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    _, emp = create_user(db_session, "emp@test.com", "employer")
    job = create_job(db_session, emp.id, status="published")

    pdf = b"%PDF-1.4 test content"
    resp = client.post(
        "/api/v1/candidate/cv",
        files={"file": ("cv.pdf", pdf, "application/pdf")},
        headers=auth_header(cand),
    )
    cv_url = resp.json()["cv_url"]

    # Ứng tuyển kèm CV riêng (cv_url) thay vì CV mặc định
    resp = client.post(
        f"/api/v1/jobs/{job.id}/applications",
        json={"cover_letter": "hi", "cv_url": cv_url},
        headers=auth_header(cand),
    )
    assert resp.status_code == 201
    assert resp.json()["cv_url"] == cv_url
