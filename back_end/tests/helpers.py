from app.core.security import create_access_token
from app.models.entities import CandidateProfile, EmployerProfile, Job, JobCategory, User


def create_user(session, email, role, full_name="Ứng viên Test", company_name="Công ty Test"):
    user = User(email=email, password_hash="x", role=role, is_active=True)
    session.add(user)
    session.flush()
    if role == "candidate":
        profile = CandidateProfile(user_id=user.id, full_name=full_name)
    else:
        profile = EmployerProfile(user_id=user.id, company_name=company_name)
    session.add(profile)
    session.commit()
    session.refresh(user)
    session.refresh(profile)
    return user, profile


def create_job(session, employer_id, title="Developer", description="Mô tả công việc",
               location="Hà Nội", status="published", category_id=None, deadline=None):
    job = Job(
        employer_id=employer_id,
        title=title,
        description=description,
        location=location,
        status=status,
        category_id=category_id,
        deadline=deadline,
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


def create_category(session, name="IT"):
    category = JobCategory(name=name)
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


def auth_header(user):
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}
