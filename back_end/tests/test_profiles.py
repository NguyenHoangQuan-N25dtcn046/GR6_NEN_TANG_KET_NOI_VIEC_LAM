from tests.helpers import auth_header, create_user


def test_get_and_update_profile(client, db_session):
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    headers = auth_header(cand)

    resp = client.get("/api/v1/candidate/profile", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Ứng viên Test"

    resp = client.patch(
        "/api/v1/candidate/profile",
        json={"phone": "0123456789", "skills": "Python, FastAPI"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["phone"] == "0123456789"
    assert resp.json()["skills"] == "Python, FastAPI"


def test_profile_requires_candidate_role(client, db_session):
    emp_user, _ = create_user(db_session, "emp@test.com", "employer")
    resp = client.get("/api/v1/candidate/profile", headers=auth_header(emp_user))
    assert resp.status_code == 403


def test_candidate_cannot_clear_full_name(client, db_session):
    candidate, _ = create_user(db_session, "cand@test.com", "candidate")
    headers = auth_header(candidate)
    path = "/api/v1/candidate/profile"

    response = client.patch(path, json={"full_name": None}, headers=headers)
    assert response.status_code == 422
    assert response.json()["errors"][0]["location"] == ["body", "full_name"]
    assert client.get(path, headers=headers).json()["full_name"] == "Ứng viên Test"
