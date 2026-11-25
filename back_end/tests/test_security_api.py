import jwt
import pytest
from sqlalchemy import select
from app.models.entities import User, Job, RevokedToken
from app.core.security import verify_password
from app.core.config import settings

BASE = "/api/v1"


@pytest.mark.parametrize("role", ["candidate", "employer"])
def test_registration_hash_and_duplicate(api, role):
    client, sessions, _ = api
    body = {"email": "New@example.com", "password": "SecurePass123!", "role": role,
            "full_name": "Test Name", "company_name": "Test Company"}
    result = client.post(BASE + "/auth/register", json=body)
    assert result.status_code == 201
    assert "password" not in result.text
    assert result.json()["email"] == "new@example.com"
    with sessions() as db:
        user = db.get(User, result.json()["id"])
        assert user.password_hash.startswith("$argon2id$")
        assert verify_password(body["password"], user.password_hash)
    for email in ["New@example.com", "NEW@EXAMPLE.COM"]:
        result = client.post(BASE + "/auth/register", json={**body, "email": email})
        assert result.status_code == 409


def test_login_logout_and_token_reuse(api):
    client, sessions, _ = api
    login = {"email": "EMPLOYER@example.com", "password": "SecurePass123!"}
    response = client.post(BASE + "/auth/login", json=login)
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    token = response.json()["access_token"]
    claims = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert claims["sub"] == "2" and claims["token_type"] == "access"
    assert claims["exp"] > claims["iat"] and claims["jti"]
    headers = {"Authorization": "Bearer " + token}
    assert client.get(BASE + "/auth/me", headers=headers).status_code == 200
    response = client.post(BASE + "/auth/logout", headers=headers)
    assert response.status_code == 204 and response.content == b""
    with sessions() as db:
        revoked = db.scalar(select(RevokedToken).where(RevokedToken.jti == claims["jti"]))
        assert revoked.user_id == 2 and revoked.expires_at
    for path in ["/auth/me", "/employer/dashboard"]:
        response = client.get(BASE + path, headers=headers)
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"
    assert client.post(BASE + "/auth/logout", headers=headers).status_code == 401
    assert client.post(BASE + "/auth/login", json=login).status_code == 200


@pytest.mark.parametrize("role", ["candidate", "employer", "other", "admin"])
@pytest.mark.parametrize("area", ["candidate", "employer", "admin"])
def test_role_matrix(api, role, area):
    client, _, tokens = api
    actual_role = "employer" if role == "other" else role
    assert client.get(BASE + f"/{area}/dashboard", headers=tokens[role]).status_code == (200 if actual_role == area else 403)


@pytest.mark.parametrize("path", ["/auth/me", "/candidate/dashboard", "/employer/dashboard", "/admin/dashboard"])
@pytest.mark.parametrize("kind", ["missing", "invalid", "expired"])
def test_invalid_authentication(api, path, kind):
    client, _, _ = api
    headers = {}
    if kind != "missing":
        token = "invalid" if kind == "invalid" else jwt.encode(
            {"sub": "2", "jti": "expired", "token_type": "access", "iat": 1, "exp": 2},
            settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        headers = {"Authorization": "Bearer " + token}
    response = client.get(BASE + path, headers=headers)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("actor,job_id,expected", [("employer",1,200),("employer",2,403),("other",1,403),("candidate",1,403),("admin",1,403)])
@pytest.mark.parametrize("action", ["edit", "close"])
def test_job_ownership(api, actor, job_id, expected, action):
    client, sessions, tokens = api
    path = f"/jobs/{job_id}" + ("/status" if action == "close" else "")
    body = {"job_status": "closed"} if action == "close" else {"title": "Updated title"}
    response = client.patch(BASE + path, json=body, headers=tokens[actor])
    assert response.status_code == expected
    with sessions() as db:
        job = db.get(Job, job_id)
        assert job.title == ("Updated title" if expected == 200 and action == "edit" else f"Job {job_id}")
        assert job.job_status == ("closed" if expected == 200 and action == "close" else "open")
    if expected == 200:
        assert response.json()["id"] == job_id
        assert "message" not in response.json()


@pytest.mark.parametrize("action", ["approve", "reject"])
@pytest.mark.parametrize("actor", ["candidate", "employer", "other", "admin"])
def test_moderation(api, action, actor):
    client, sessions, tokens = api
    response = client.patch(BASE + f"/admin/jobs/1/{action}", json={"reason": "Invalid content"} if action == "reject" else None, headers=tokens[actor])
    assert response.status_code == (200 if actor == "admin" else 403)
    with sessions() as db:
        job = db.get(Job, 1)
        assert job.approval_status == (("approved" if action == "approve" else "rejected") if actor == "admin" else "pending")
        if actor == "admin":
            assert response.json()["approval_status"] == job.approval_status
            assert job.rejection_reason == ("Invalid content" if action == "reject" else None)
            assert client.patch(BASE + f"/admin/jobs/1/{action}", json={"reason":"Invalid content"}, headers=tokens[actor]).status_code == 409


def test_moderation_publication_lifecycle(api):
    client, sessions, tokens = api
    assert client.get(BASE + "/jobs").json() == []
    assert client.patch(BASE + "/jobs/1/status", json={"job_status":"open"}, headers=tokens["employer"]).status_code == 409
    assert client.patch(BASE + "/admin/jobs/1/approve", headers=tokens["admin"]).status_code == 200
    assert [j["id"] for j in client.get(BASE + "/jobs?q=Hanoi&limit=1&offset=0").json()] == [1]
    assert client.get(BASE + "/jobs?q=missing").json() == []
    assert client.patch(BASE + "/jobs/1/status", json={"job_status":"closed"}, headers=tokens["employer"]).status_code == 200
    assert client.get(BASE + "/jobs").json() == []
    assert client.patch(BASE + "/jobs/1/status", json={"job_status":"open"}, headers=tokens["employer"]).status_code == 200
    assert client.patch(BASE + "/jobs/1", json={"title":"Needs review"}, headers=tokens["employer"]).json()["approval_status"] == "pending"
    assert client.get(BASE + "/jobs").json() == []
    assert client.patch(BASE + "/admin/jobs/1/reject", json={"reason":"Invalid content"}, headers=tokens["admin"]).status_code == 200
    assert client.patch(BASE + "/jobs/1", json={"title":"Corrected title"}, headers=tokens["employer"]).status_code == 200
    with sessions() as db:
        job = db.get(Job, 1)
        assert job.approval_status == "pending" and job.rejection_reason is None


@pytest.mark.parametrize("body,expected", [({},400),({"title":None},422),({"title":"x"*201},422),({"employer_id":2},422),({"approval_status":"approved"},422)])
def test_update_validation(api, body, expected):
    client, _, tokens = api
    response = client.patch(BASE + "/jobs/1", json=body, headers=tokens["employer"])
    assert response.status_code == expected
    assert response.headers["content-type"] == "application/problem+json"
    assert response.json()["status"] == expected


def test_auth_errors_and_problem_format(api):
    client, sessions, tokens = api
    for email in ["employer@example.com", "missing@example.com"]:
        response = client.post(BASE + "/auth/login", json={"email":email,"password":"wrong"})
        assert response.status_code == 401
    response = client.post(BASE + "/auth/register", json={"email":"new@example.com","password":"secret","role":"admin"})
    assert response.status_code == 422
    assert "secret" not in response.text and "input" not in response.text
    for path in ["/missing", "/jobs/999"]:
        response = client.patch(BASE + path, json={"title":"Test title"}, headers=tokens["employer"])
        assert response.status_code == 404
        assert response.json()["status"] == 404
    with sessions() as db:
        db.get(User, 2).is_active = False
        db.commit()
    assert client.get(BASE + "/auth/me", headers=tokens["employer"]).status_code == 403
    assert client.get(BASE + "/employer/dashboard", headers=tokens["employer"]).status_code == 403
    assert client.post(BASE + "/auth/login", json={"email":"employer@example.com","password":"SecurePass123!"}).status_code == 403


def test_problem_responses_and_openapi(api):
    client, _, _ = api
    response = client.delete(BASE + "/auth/login")
    assert response.status_code == 405 and response.json()["status"] == 405
    assert "POST" in response.headers["allow"]
    schema = client.get("/openapi.json").json()
    assert "application/problem+json" in schema["paths"][BASE + "/auth/login"]["post"]["responses"]["422"]["content"]
    assert "content" not in schema["paths"][BASE + "/auth/logout"]["post"]["responses"]["204"]


def test_internal_errors_hide_details():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.core.errors import register_error_handlers
    isolated = FastAPI()
    register_error_handlers(isolated)
    @isolated.get("/fail")
    def fail():
        raise RuntimeError("private database details")
    with TestClient(isolated, raise_server_exceptions=False) as client:
        response = client.get("/fail")
    assert response.status_code == 500
    assert response.headers["content-type"] == "application/problem+json"
    assert response.json()["status"] == 500
    assert "private database details" not in response.text
