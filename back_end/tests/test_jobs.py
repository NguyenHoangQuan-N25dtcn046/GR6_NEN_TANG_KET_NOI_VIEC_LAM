from tests.helpers import create_category, create_job, create_user


def test_list_jobs_only_approved_open(client, db_session):
    _, emp = create_user(db_session, "emp1@test.com", "employer")
    create_job(db_session, emp.id, title="Backend", status="published")   # approved + open
    create_job(db_session, emp.id, title="Frontend", status="pending")    # chưa duyệt
    create_job(db_session, emp.id, title="Closed", status="closed")       # đã đóng

    resp = client.get("/api/v1/jobs")
    assert resp.status_code == 200
    titles = [j["title"] for j in resp.json()]
    assert titles == ["Backend"]


def test_search_by_keyword_location_category(client, db_session):
    _, emp = create_user(db_session, "emp2@test.com", "employer")
    it = create_category(db_session, "IT")
    accounting = create_category(db_session, "Kế toán")

    create_job(db_session, emp.id, title="Kỹ sư Python", location="Hà Nội", category_id=it.id, status="published")
    create_job(db_session, emp.id, title="Kế toán viên", location="Đà Nẵng", category_id=accounting.id, status="published")

    resp = client.get("/api/v1/jobs", params={"q": "python"})
    assert [j["title"] for j in resp.json()] == ["Kỹ sư Python"]

    resp = client.get("/api/v1/jobs", params={"location": "Đà Nẵng"})
    assert [j["title"] for j in resp.json()] == ["Kế toán viên"]

    resp = client.get("/api/v1/jobs", params={"category_id": it.id})
    assert [j["title"] for j in resp.json()] == ["Kỹ sư Python"]


def test_pagination(client, db_session):
    _, emp = create_user(db_session, "emp3@test.com", "employer")
    for i in range(5):
        create_job(db_session, emp.id, title=f"Job {i}", status="published")

    resp = client.get("/api/v1/jobs", params={"limit": 2, "offset": 0})
    assert len(resp.json()) == 2

    resp = client.get("/api/v1/jobs", params={"limit": 2, "offset": 4})
    assert len(resp.json()) == 1


def test_job_detail_approved(client, db_session):
    _, emp = create_user(db_session, "emp4@test.com", "employer")
    job = create_job(db_session, emp.id, title="Backend", status="published")

    resp = client.get(f"/api/v1/jobs/{job.id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == job.id
    assert resp.json()["title"] == "Backend"
    assert resp.json()["approval_status"] == "approved"


def test_job_detail_hides_unapproved(client, db_session):
    _, emp = create_user(db_session, "emp5@test.com", "employer")
    job = create_job(db_session, emp.id, title="Secret", status="pending")

    resp = client.get(f"/api/v1/jobs/{job.id}")
    assert resp.status_code == 404


def test_filter_by_work_mode(client, db_session):
    _, emp = create_user(db_session, "emp6@test.com", "employer")
    create_job(db_session, emp.id, title="Remote Dev", work_mode="remote", status="published")
    create_job(db_session, emp.id, title="Onsite Dev", work_mode="onsite", status="published")

    resp = client.get("/api/v1/jobs", params={"work_mode": "remote"})
    assert [j["title"] for j in resp.json()] == ["Remote Dev"]


def test_filter_by_salary(client, db_session):
    _, emp = create_user(db_session, "emp7@test.com", "employer")
    create_job(db_session, emp.id, title="Low", salary_min=5000000, salary_max=10000000, status="published")
    create_job(db_session, emp.id, title="High", salary_min=20000000, salary_max=30000000, status="published")

    resp = client.get("/api/v1/jobs", params={"salary_min": 15000000})
    assert [j["title"] for j in resp.json()] == ["High"]
