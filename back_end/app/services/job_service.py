from decimal import Decimal
from datetime import date

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import normalize_search_text
from app.models.entities import Application, EmployerProfile, Job, JobCategory, SavedJob
from app.schemas.job import ExperienceBand, JobCreate, JobType, WorkMode
from app.services.ownership import get_candidate_profile, get_employer_profile, get_owned_job


_EXPERIENCE_FILTERS = {
    "0-1": Job.experience_years.between(0, 1),
    "2-3": Job.experience_years.between(2, 3),
    "4+": Job.experience_years >= 4,
}


def ensure_category(db: Session, category_id: int | None) -> None:
    if category_id is not None and db.get(JobCategory, category_id) is None:
        raise HTTPException(status_code=400, detail="Ngành nghề không tồn tại")


def _matches_text(db: Session, column, value: str):
    if db.get_bind().dialect.name == "sqlite":
        return func.job_search_text(column).contains(normalize_search_text(value), autoescape=True)
    return column.icontains(value, autoescape=True)


def list_public_jobs(
    db: Session,
    *,
    q: str | None = None,
    location: str | None = None,
    category_id: int | None = None,
    work_mode: list[WorkMode] | None = None,
    job_type: list[JobType] | None = None,
    experience: list[ExperienceBand] | None = None,
    salary_min: Decimal | None = None,
    salary_max: Decimal | None = None,
    limit: int = 20,
    offset: int = 0,
):
    """Danh sách tin đã duyệt, còn mở và còn hạn, có tìm kiếm và phân trang."""
    stmt = select(Job).where(
        Job.approval_status == "approved",
        Job.job_status == "open",
        or_(Job.deadline.is_(None), Job.deadline >= date.today()),
    )
    if q:
        stmt = stmt.where(or_(
            _matches_text(db, Job.title, q),
            _matches_text(db, Job.description, q),
            _matches_text(db, Job.location, q),
            Job.employer.has(_matches_text(db, EmployerProfile.company_name, q)),
        ))
    if location:
        stmt = stmt.where(_matches_text(db, Job.location, location))
    if category_id is not None:
        stmt = stmt.where(Job.category_id == category_id)
    if work_mode:
        stmt = stmt.where(Job.work_mode.in_(work_mode))
    if job_type:
        stmt = stmt.where(Job.job_type.in_(job_type))
    if experience:
        stmt = stmt.where(or_(*(_EXPERIENCE_FILTERS[band] for band in experience)))
    if salary_min is not None:
        stmt = stmt.where(func.coalesce(Job.salary_max, Job.salary_min) >= salary_min)
    if salary_max is not None:
        stmt = stmt.where(func.coalesce(Job.salary_min, Job.salary_max) <= salary_max)
    return db.scalars(stmt.order_by(Job.id.desc()).offset(offset).limit(limit)).all()


def get_public_job(db: Session, job_id: int) -> Job:
    """Chi tiết tin công khai; ẩn tin chưa duyệt (trả 404 như không tồn tại)."""
    job = db.get(Job, job_id)
    if job is None or job.approval_status != "approved":
        raise HTTPException(status_code=404, detail="Tin tuyển dụng không tồn tại")
    return job


def list_employer_jobs(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    """Danh sách tin của chính nhà tuyển dụng (mọi trạng thái)."""
    profile = get_employer_profile(db, user_id)
    stmt = (
        select(Job)
        .where(Job.employer_id == profile.id)
        .order_by(Job.id.desc())
        .offset(offset)
        .limit(limit)
    )
    return db.scalars(stmt).all()


def create_job(db: Session, payload: JobCreate, user_id: int) -> Job:
    """Tạo tin tuyển dụng (trạng thái chờ duyệt)."""
    profile = get_employer_profile(db, user_id)
    ensure_category(db, payload.category_id)
    job = Job(
        employer_id=profile.id,
        **payload.model_dump(),
        status="pending",
        job_status="open",
        approval_status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, job_id: int, user_id: int) -> None:
    """Xóa tin tuyển dụng của chính mình."""
    profile = get_employer_profile(db, user_id)
    job = get_owned_job(db, job_id, profile.id)
    applications = select(Application.id).where(Application.job_id == job_id).limit(1)
    conflict = "Tin tuyển dụng đã có đơn ứng tuyển. Vui lòng đóng tin."

    if db.scalar(applications) is not None:
        raise HTTPException(status_code=409, detail=conflict)

    db.delete(job)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # A concurrent submission can commit after the initial check.
        if db.scalar(applications) is not None:
            raise HTTPException(status_code=409, detail=conflict)
        raise


def list_saved_jobs(db: Session, user_id: int) -> list[Job]:
    profile = get_candidate_profile(db, user_id)
    query = (
        select(Job).join(SavedJob, SavedJob.job_id == Job.id)
        .where(SavedJob.candidate_id == profile.id, Job.approval_status == "approved")
        .order_by(SavedJob.saved_at.desc(), Job.id.desc())
    )
    return list(db.scalars(query))


def save_job(db: Session, job_id: int, user_id: int) -> None:
    profile = get_candidate_profile(db, user_id)
    get_public_job(db, job_id)
    key = (profile.id, job_id)
    if db.get(SavedJob, key) is not None:
        return
    db.add(SavedJob(candidate_id=profile.id, job_id=job_id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        get_public_job(db, job_id)
        if db.get(SavedJob, key) is None:
            raise


def remove_saved_job(db: Session, job_id: int, user_id: int) -> None:
    profile = get_candidate_profile(db, user_id)
    saved = db.get(SavedJob, (profile.id, job_id))
    if saved is not None:
        db.delete(saved)
        db.commit()
