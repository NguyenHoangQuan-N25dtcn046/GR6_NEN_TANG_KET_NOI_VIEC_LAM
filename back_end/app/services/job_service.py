from typing import Optional

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.entities import Job, JobCategory
from app.schemas.job import JobCreate, JobUpdate
from app.services.ownership import get_employer_profile, get_owned_job


def _ensure_category(db: Session, category_id: Optional[int]) -> None:
    if category_id is not None and db.get(JobCategory, category_id) is None:
        raise HTTPException(status_code=400, detail="Ngành nghề không tồn tại")


def list_public_jobs(
    db: Session,
    q: Optional[str] = None,
    location: Optional[str] = None,
    category_id: Optional[int] = None,
    limit: int = 20,
    offset: int = 0,
):
    """Danh sách tin công khai (chỉ published), hỗ trợ tìm kiếm + phân trang."""
    stmt = select(Job).where(Job.status == "published")
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Job.title.ilike(like), Job.description.ilike(like), Job.location.ilike(like)))
    if location:
        stmt = stmt.where(Job.location.ilike(f"%{location}%"))
    if category_id is not None:
        stmt = stmt.where(Job.category_id == category_id)
    return db.scalars(stmt.order_by(Job.id.desc()).offset(offset).limit(limit)).all()


def get_public_job(db: Session, job_id: int) -> Job:
    """Chi tiết tin công khai; ẩn tin chưa duyệt (trả 404 như không tồn tại)."""
    job = db.get(Job, job_id)
    if job is None or job.status != "published":
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
    """Tạo tin tuyển dụng (trạng thái khởi tạo pending, chờ admin duyệt)."""
    profile = get_employer_profile(db, user_id)
    _ensure_category(db, payload.category_id)
    job = Job(employer_id=profile.id, **payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job(db: Session, job_id: int, payload: JobUpdate, user_id: int) -> Job:
    """Sửa tin hoặc đóng/mở lại tin (chỉ tin của chính mình)."""
    profile = get_employer_profile(db, user_id)
    job = get_owned_job(db, job_id, profile.id)
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        _ensure_category(db, data["category_id"])
    for key, value in data.items():
        setattr(job, key, value)
    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, job_id: int, user_id: int) -> None:
    """Xóa tin tuyển dụng của chính mình."""
    profile = get_employer_profile(db, user_id)
    job = get_owned_job(db, job_id, profile.id)
    db.delete(job)
    db.commit()
