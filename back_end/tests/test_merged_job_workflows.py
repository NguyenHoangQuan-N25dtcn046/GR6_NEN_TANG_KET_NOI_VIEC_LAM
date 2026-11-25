import pytest

from app.models.entities import Job


@pytest.mark.parametrize("changes", [{"title": "Updated via employer API"}, {"status": "closed"}, {"status": "pending"}])
def test_employer_changes_hide_previously_approved_job(api, changes):
    client, _, tokens = api
    assert client.patch("/api/v1/admin/jobs/1/approve", headers=tokens["admin"]).status_code == 200
    assert client.get("/api/v1/jobs/1").status_code == 200

    response = client.patch("/api/v1/employer/jobs/1", json=changes, headers=tokens["employer"])
    assert response.status_code == 200
    if changes.get("status") == "closed":
        assert response.json()["job_status"] == "closed"
    else:
        assert response.json()["approval_status"] == "pending"
    assert client.get("/api/v1/jobs").json() == []
    assert client.get("/api/v1/jobs/1").status_code == 404
    assert client.post("/api/v1/jobs/1/applications", json={}, headers=tokens["candidate"]).status_code == 400


@pytest.mark.parametrize("approval,job_status", [("pending", "open"), ("rejected", "open"), ("approved", "closed")])
def test_legacy_published_status_cannot_bypass_moderation(api, approval, job_status):
    client, sessions, tokens = api
    with sessions() as db:
        job = db.get(Job, 1)
        job.status = "published"
        job.approval_status = approval
        job.job_status = job_status
        db.commit()
    assert client.get("/api/v1/jobs").json() == []
    assert client.get("/api/v1/jobs/1").status_code == 404
    assert client.post("/api/v1/jobs/1/applications", json={}, headers=tokens["candidate"]).status_code == 400


def test_closed_job_stays_closed_after_admin_approval(api):
    client, _, tokens = api
    response = client.patch("/api/v1/employer/jobs/1", json={"title": "Review while closed", "status": "closed"}, headers=tokens["employer"])
    assert response.status_code == 200
    response = client.patch("/api/v1/admin/jobs/1/approve", headers=tokens["admin"])
    assert response.status_code == 200
    assert response.json()["job_status"] == "closed"
    assert client.get("/api/v1/jobs").json() == []
    assert client.patch("/api/v1/jobs/1/status", json={"job_status": "open"}, headers=tokens["employer"]).status_code == 200
    assert client.get("/api/v1/jobs/1").status_code == 200
