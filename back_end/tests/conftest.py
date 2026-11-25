import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test-only-secret-with-at-least-32-characters"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.session import Base, get_db
from app.models.entities import User, EmployerProfile, Job
from app.core.security import hash_password, create_access_token

PASSWORD = "SecurePass123!"
HASH = hash_password(PASSWORD)


@pytest.fixture
def api():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    @event.listens_for(engine, "connect")
    def foreign_keys(connection, record):
        connection.execute("PRAGMA foreign_keys=ON")
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        users = [User(id=i, email=f"{role}@example.com", password_hash=HASH, role=role if role != "other" else "employer")
                 for i, role in enumerate(["candidate", "employer", "other", "admin"], 1)]
        db.add_all(users)
        db.flush()
        # Deliberately different profile/user IDs, including a collision with another user.
        db.add_all([EmployerProfile(id=1, user_id=2, company_name="A"), EmployerProfile(id=2, user_id=3, company_name="B")])
        db.flush()
        db.add_all([Job(id=i, employer_id=i, title=f"Job {i}", description="Original description", location="Hanoi") for i in [1, 2]])
        db.commit()
    def override():
        with sessions() as db:
            yield db
    app.dependency_overrides[get_db] = override
    client = TestClient(app)  # No production startup/database access.
    tokens = {role: {"Authorization": "Bearer " + create_access_token(i)}
              for i, role in enumerate(["candidate", "employer", "other", "admin"], 1)}
    yield client, sessions, tokens
    client.close()
    app.dependency_overrides.clear()
    engine.dispose()
