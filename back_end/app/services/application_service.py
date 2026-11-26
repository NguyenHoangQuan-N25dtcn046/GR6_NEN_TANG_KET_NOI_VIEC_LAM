from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.entities import Application, Job
from app.schemas.application import ApplicationCreate, ApplicationStatusUpdate
from app.services.cv_service import resolve_cv_path
from app.services.ownership import get_candidate_profile, get_employer_profile, get_owned_job


def apply_to_job(db: Session, job_id: int, payload: ApplicationCreate, user_id: int) -> Application:
    """Ứng viên gửi đơn; chặn gửi trùng và tin không hợp lệ."""
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Tin tuyển dụng không tồn tại")
    if job.approval_status != "approved" or job.job_status != "open":
        raise HTTPException(status_code=400, detail="Tin tuyển dụng chưa được công khai")
    if job.is_expired:
        raise HTTPException(status_code=400, detail="Tin tuyển dụng đã hết hạn")

    profile = get_candidate_profile(db, user_id)

    candidate_id = profile.id
    duplicate = select(Application.id).where(
        Application.job_id == job_id, Application.candidate_id == candidate_id
    )
    if db.scalar(duplicate) is not None:
        raise HTTPException(status_code=409, detail="Bạn đã ứng tuyển công việc này")

    # CV kèm đơn: ưu tiên cv_url gửi lên (phải thuộc về ứng viên), nếu không thì dùng CV hồ sơ.
    cv_url = payload.cv_url
    if cv_url and resolve_cv_path(cv_url, user_id) is None:
        raise HTTPException(status_code=400, detail="CV không hợp lệ")
    if not cv_url:
        cv_url = profile.cv_url if resolve_cv_path(profile.cv_url, user_id) else None

    application = Application(
        job_id=job_id,
        candidate_id=candidate_id,
        cover_letter=payload.cover_letter,
        cv_url=cv_url,
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if db.scalar(duplicate) is not None:
            raise HTTPException(status_code=409, detail="Bạn đã ứng tuyển công việc này")
        if db.get(Job, job_id) is None:
            raise HTTPException(status_code=404, detail="Tin tuyển dụng không tồn tại")
        raise
    db.refresh(application)
    return application


def list_candidate_applications(db: Session, user_id: int):
    """Lịch sử đơn ứng tuyển của chính ứng viên."""
    profile = get_candidate_profile(db, user_id)
    stmt = (
        select(Application)
        .where(Application.candidate_id == profile.id)
        .order_by(Application.applied_at.desc())
    )
    return db.scalars(stmt).all()


def get_candidate_application(db: Session, application_id: int, user_id: int) -> Application:
    profile = get_candidate_profile(db, user_id)
    application = db.get(Application, application_id)
    if application is None or application.candidate_id != profile.id:
        raise HTTPException(status_code=404, detail="Đơn ứng tuyển không tồn tại")
    return application


def list_job_applications(db: Session, job_id: int, user_id: int):
    """Đơn ứng tuyển của một tin mà nhà tuyển dụng sở hữu."""
    profile = get_employer_profile(db, user_id)
    job = get_owned_job(db, job_id, profile.id)
    stmt = (
        select(Application)
        .where(Application.job_id == job.id)
        .order_by(Application.applied_at.desc())
    )
    return db.scalars(stmt).all()


def update_application_status(
    db: Session, job_id: int, application_id: int, payload: ApplicationStatusUpdate, user_id: int
) -> Application:
    """Xử lý đơn (chuyển trạng thái) cho tin mà nhà tuyển dụng sở hữu."""
    profile = get_employer_profile(db, user_id)
    job = get_owned_job(db, job_id, profile.id)
    application = db.get(Application, application_id)
    if application is None or application.job_id != job.id:
        raise HTTPException(status_code=404, detail="Đơn ứng tuyển không tồn tại")
    application.status = payload.status
    db.commit()
    db.refresh(application)
    return application


def get_application_cv_path(db: Session, job_id: int, application_id: int, user_id: int) -> Path:
    """Đường dẫn file CV của đơn ứng tuyển (chỉ employer sở hữu tin xem được)."""
    profile = get_employer_profile(db, user_id)
    job = get_owned_job(db, job_id, profile.id)
    application = db.get(Application, application_id)
    if application is None or application.job_id != job.id:
        raise HTTPException(status_code=404, detail="Đơn ứng tuyển không tồn tại")

    candidate = application.candidate
    path = resolve_cv_path(application.cv_url, candidate.user_id) if candidate else None
    if path is None:
        raise HTTPException(status_code=404, detail="Ứng viên chưa có CV")
    return path
