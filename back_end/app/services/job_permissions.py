
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.entities import EmployerProfile, Job, User


def get_job_or_404(
    db: Session,
    job_id: int
) -> Job:
    job = db.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tin tuyển dụng không tồn tại"
        )

    return job


def require_job_owner(
    db: Session,
    job_id: int,
    current_user: User
) -> Job:
    job = get_job_or_404(db, job_id)

    profile = db.get(EmployerProfile, job.employer_id)
    if profile is None or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không sở hữu tin tuyển dụng này"
        )

    return job
