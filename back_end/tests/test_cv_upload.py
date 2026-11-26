from io import BytesIO
from zipfile import ZipFile

import pytest

from app.core.config import settings

from tests.helpers import auth_header, create_job, create_user

PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def make_docx():
    output = BytesIO()
    with ZipFile(output, "w") as archive:
        archive.writestr(
            "[Content_Types].xml",
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Override PartName="/word/document.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            '</Types>',
        )
        archive.writestr(
            "_rels/.rels",
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Target="word/document.xml" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"/>'
            '</Relationships>',
        )
        archive.writestr(
            "word/document.xml",
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:body><w:p><w:r><w:t>Example CV</w:t></w:r></w:p></w:body></w:document>',
        )
    return output.getvalue()


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


def test_upload_valid_docx(client, db_session, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    cand, _ = create_user(db_session, "cand@test.com", "candidate")

    docx = make_docx()
    headers = auth_header(cand)
    resp = client.post(
        "/api/v1/candidate/cv",
        files={"file": ("cv.docx", docx, DOCX_MIME)},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["cv_url"].endswith(".docx")

    response = client.get("/api/v1/candidate/cv", headers=headers)
    assert response.headers["content-type"] == DOCX_MIME
    assert "cv.docx" in response.headers["content-disposition"]
    assert response.content == docx


def make_plain_zip():
    output = BytesIO()
    with ZipFile(output, "w") as archive:
        archive.writestr("log.txt", "plain text")
    return output.getvalue()


@pytest.mark.parametrize("payload", [b"not a docx", make_plain_zip()])
def test_reject_fake_docx(client, db_session, tmp_path, monkeypatch, payload):
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    cand, _ = create_user(db_session, "cand@test.com", "candidate")

    resp = client.post(
        "/api/v1/candidate/cv",
        files={"file": ("cv.docx", payload, DOCX_MIME)},
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

    candidate_headers = auth_header(cand)
    first = client.post(
        "/api/v1/candidate/cv",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
        headers=candidate_headers,
    )
    assert first.status_code == 200

    application = client.post(
        f"/api/v1/jobs/{job.id}/applications",
        json={"cover_letter": "Xin chào"},
        headers=candidate_headers,
    )
    assert application.status_code == 201
    assert application.json()["cv_url"] == first.json()["cv_url"]

    replacement_pdf = PDF_BYTES.replace(b"%PDF-1.4", b"%PDF-1.7")
    replacement = client.post(
        "/api/v1/candidate/cv",
        files={"file": ("cv.pdf", replacement_pdf, "application/pdf")},
        headers=candidate_headers,
    )
    assert replacement.status_code == 200
    assert replacement.json()["cv_url"] != application.json()["cv_url"]

    url = f"/api/v1/employer/jobs/{job.id}/applications/{application.json()['id']}/cv"
    resp = client.get(url, headers=auth_header(emp_user))
    assert resp.status_code == 200
    assert resp.content == PDF_BYTES

    resp = client.get(url, headers=auth_header(other_user))
    assert resp.status_code == 403


def test_cv_responses_are_documented(client):
    paths = client.get("/openapi.json").json()["paths"]
    candidate_cv = paths["/api/v1/candidate/cv"]
    employer_cv = paths["/api/v1/employer/jobs/{job_id}/applications/{application_id}/cv"]
    for endpoint in (candidate_cv, employer_cv):
        assert set(endpoint["get"]["responses"]["200"]["content"]) == {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
    for code in ("413", "415"):
        assert set(candidate_cv["post"]["responses"][code]["content"]) == {"application/problem+json"}
