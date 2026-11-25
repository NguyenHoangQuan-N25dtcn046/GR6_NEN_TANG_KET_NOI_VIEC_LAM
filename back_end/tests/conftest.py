import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test-only-secret-with-at-least-32-characters"
os.environ.setdefault("UPLOAD_DIR", "test_uploads")
os.environ.setdefault("MAX_CV_SIZE_MB", "5")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_password
from app.db.session import Base, get_db
from app.main import app
from app.models import entities  # noqa: F401
from app.models.entities import EmployerProfile, Job, User

PASSWORD = "SecurePass123!"
HASH = hash_password(PASSWORD)


# ===== Fixture của TV1 (test_security_api, test_job_migration) =====
@pytest.fixture
def api():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)

    @event.listens_for(engine, "connect")
    def foreign_keys(connection, record):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        users = [
            User(id=i, email=f"{role}@example.com", password_hash=HASH,
                 role=role if role != "other" else "employer")
            for i, role in enumerate(["candidate", "employer", "other", "admin"], 1)
        ]
        db.add_all(users)
        db.flush()
        db.add_all([
            EmployerProfile(id=1, user_id=2, company_name="A"),
            EmployerProfile(id=2, user_id=3, company_name="B"),
        ])
        db.flush()
        db.add_all([
            Job(id=i, employer_id=i, title=f"Job {i}", description="Original description", location="Hanoi")
            for i in [1, 2]
        ])
        db.commit()

    def override():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = override
    client = TestClient(app)
    tokens = {
        role: {"Authorization": "Bearer " + create_access_token(i)}
        for i, role in enumerate(["candidate", "employer", "other", "admin"], 1)
    }
    yield client, sessions, tokens
    client.close()
    app.dependency_overrides.clear()
    engine.dispose()


# ===== Fixtures của TV2 (test_jobs, test_applications, ...) =====
@pytest.fixture()
def engine(tmp_path):
    eng = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    yield eng
    eng.dispose()


@pytest.fixture()
def db_session(engine):
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(engine):
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    c = TestClient(app)
    yield c
    c.close()
    app.dependency_overrides.clear()
