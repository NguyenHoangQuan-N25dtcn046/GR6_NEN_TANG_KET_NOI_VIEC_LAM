from app.core.config import settings

from tests.helpers import auth_header, create_job, create_user

PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"


def test_upload_valid_pdf(client, db_session, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    cand, _ = create_user(db_session, "cand@test.com", "candidate")

    resp = client.post(
        "/api/v1/candidate/cv",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        headers=auth_header(cand),
    )
    assert resp.status_code == 200
    cv_url = resp.json()["cv_url"]
    assert cv_url.startswith("/uploads/cv/")
    assert (tmp_path / "cv").exists()


def test_reject_wrong_extension(client, db_session, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    cand, _ = create_user(db_session, "cand@test.com", "candidate")

    resp = client.post(
        "/api/v1/candidate/cv",
        files={"file": ("cv.txt", b"hello", "text/plain")},
        headers=auth_header(cand),
    )
    assert resp.status_code == 415


def test_reject_fake_pdf(client, db_session, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    cand, _ = create_user(db_session, "cand@test.com", "candidate")

    resp = client.post(
        "/api/v1/candidate/cv",
        files={"file": ("cv.pdf", b"not a pdf", "application/pdf")},
        headers=auth_header(cand),
    )
    assert resp.status_code == 415


def test_reject_oversize(client, db_session, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(settings, "MAX_CV_SIZE_MB", 0)
    cand, _ = create_user(db_session, "cand@test.com", "candidate")

    resp = client.post(
        "/api/v1/candidate/cv",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        headers=auth_header(cand),
    )
    assert resp.status_code == 413


def test_download_own_cv(client, db_session, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    headers = auth_header(cand)

    client.post("/api/v1/candidate/cv", files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")}, headers=headers)
    resp = client.get("/api/v1/candidate/cv", headers=headers)
    assert resp.status_code == 200
    assert resp.content.startswith(b"%PDF")


def test_download_cv_without_cv(client, db_session, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    resp = client.get("/api/v1/candidate/cv", headers=auth_header(cand))
    assert resp.status_code == 404


def test_employer_downloads_application_cv(client, db_session, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    emp_user, emp = create_user(db_session, "emp@test.com", "employer")
    other_user, _ = create_user(db_session, "other@test.com", "employer")
    job = create_job(db_session, emp.id, status="published")

    client.post("/api/v1/candidate/cv", files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")}, headers=auth_header(cand))
    app = client.post(
        f"/api/v1/jobs/{job.id}/applications",
        json={"cover_letter": "Xin chào"},
        headers=auth_header(cand),
    ).json()

    resp = client.get(f"/api/v1/employer/jobs/{job.id}/applications/{app['id']}/cv", headers=auth_header(emp_user))
    assert resp.status_code == 200
    assert resp.content.startswith(b"%PDF")

    resp = client.get(f"/api/v1/employer/jobs/{job.id}/applications/{app['id']}/cv", headers=auth_header(other_user))
    assert resp.status_code == 403
