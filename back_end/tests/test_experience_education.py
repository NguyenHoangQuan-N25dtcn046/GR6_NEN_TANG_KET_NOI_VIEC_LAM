import pytest

from tests.helpers import auth_header, create_user


def test_experience_crud(client, db_session):
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    headers = auth_header(cand)

    # Thêm kinh nghiệm
    resp = client.post(
        "/api/v1/candidate/experiences",
        json={"company": "Công ty A", "position": "Backend Dev", "start_date": "2022-01-01", "end_date": "2023-01-01"},
        headers=headers,
    )
    assert resp.status_code == 201
    exp_id = resp.json()["id"]

    # Liệt kê
    resp = client.get("/api/v1/candidate/experiences", headers=headers)
    assert len(resp.json()) == 1

    # Sửa
    resp = client.patch(
        f"/api/v1/candidate/experiences/{exp_id}",
        json={"position": "Senior Backend Dev"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["position"] == "Senior Backend Dev"

    # Xóa
    resp = client.delete(f"/api/v1/candidate/experiences/{exp_id}", headers=headers)
    assert resp.status_code == 204

    resp = client.get("/api/v1/candidate/experiences", headers=headers)
    assert resp.json() == []


def test_experience_requires_valid_dates(client, db_session):
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    resp = client.post(
        "/api/v1/candidate/experiences",
        json={"company": "A", "position": "Dev", "start_date": "2024-01-01", "end_date": "2023-01-01"},
        headers=auth_header(cand),
    )
    assert resp.status_code == 422


def test_experience_ownership(client, db_session):
    cand_a, _ = create_user(db_session, "a@test.com", "candidate")
    cand_b, _ = create_user(db_session, "b@test.com", "candidate")

    resp = client.post(
        "/api/v1/candidate/experiences",
        json={"company": "A", "position": "Dev", "start_date": "2022-01-01"},
        headers=auth_header(cand_a),
    )
    exp_id = resp.json()["id"]

    # B không sửa được kinh nghiệm của A
    resp = client.patch(
        f"/api/v1/candidate/experiences/{exp_id}",
        json={"position": "Hack"},
        headers=auth_header(cand_b),
    )
    assert resp.status_code == 404


def test_education_crud(client, db_session):
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    headers = auth_header(cand)

    resp = client.post(
        "/api/v1/candidate/educations",
        json={"school": "ĐH Bách Khoa", "major": "CNTT", "degree": "Kỹ sư", "start_date": "2018-09-01", "end_date": "2022-06-01"},
        headers=headers,
    )
    assert resp.status_code == 201
    edu_id = resp.json()["id"]

    resp = client.get("/api/v1/candidate/educations", headers=headers)
    assert len(resp.json()) == 1

    resp = client.delete(f"/api/v1/candidate/educations/{edu_id}", headers=headers)
    assert resp.status_code == 204

    resp = client.get("/api/v1/candidate/educations", headers=headers)
    assert resp.json() == []


def test_education_requires_valid_dates(client, db_session):
    cand, _ = create_user(db_session, "cand@test.com", "candidate")
    resp = client.post(
        "/api/v1/candidate/educations",
        json={"school": "ĐH", "major": "CNTT", "degree": "KS", "start_date": "2024-01-01", "end_date": "2022-01-01"},
        headers=auth_header(cand),
    )
    assert resp.status_code == 422


@pytest.mark.parametrize(
    "endpoint, fields, non_nullable",
    [
        ("experiences", {"company": "A", "position": "Dev"}, "company"),
        ("educations", {"school": "A", "major": "CS", "degree": "BS"}, "school"),
    ],
)
def test_candidate_patch_validates_saved_dates_before_commit(
    client, db_session, endpoint, fields, non_nullable
):
    candidate, _ = create_user(db_session, "patch@test.com", "candidate")
    headers = auth_header(candidate)
    url = f"/api/v1/candidate/{endpoint}"
    response = client.post(
        url, json={**fields, "start_date": "2020-01-01", "end_date": "2022-01-01"}, headers=headers
    )
    assert response.status_code == 201
    original = response.json()
    item = f"{url}/{original['id']}"

    for changes in ({"start_date": "2023-01-01"}, {"end_date": "2019-01-01"}, {non_nullable: None}):
        response = client.patch(item, json=changes, headers=headers)
        assert response.status_code == 422
        assert client.get(url, headers=headers).json() == [original]

    response = client.patch(item, json={"end_date": None}, headers=headers)
    assert response.status_code == 200
    assert response.json()["end_date"] is None
