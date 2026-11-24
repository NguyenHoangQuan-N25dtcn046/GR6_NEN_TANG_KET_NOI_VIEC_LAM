from app.core.config import settings

from tests.helpers import auth_header, create_user

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

    # MIME đúng nhưng nội dung không phải PDF
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
