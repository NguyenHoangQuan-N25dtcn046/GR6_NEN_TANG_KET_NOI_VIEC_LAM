from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import CandidateProfile, EmployerProfile, Job


def get_candidate_profile(db: Session, user_id: int) -> CandidateProfile:
    """Lấy hồ sơ ứng viên theo user_id; không có → 404."""
    profile = db.scalar(select(CandidateProfile).where(CandidateProfile.user_id == user_id))
    if profile is None:
        raise HTTPException(status_code=404, detail="Chưa có hồ sơ ứng viên")
    return profile


def get_employer_profile(db: Session, user_id: int) -> EmployerProfile:
    """Lấy hồ sơ nhà tuyển dụng theo user_id; không có → 404."""
    profile = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user_id))
    if profile is None:
        raise HTTPException(status_code=404, detail="Chưa có hồ sơ nhà tuyển dụng")
    return profile


def get_owned_job(db: Session, job_id: int, employer_profile_id: int) -> Job:
    """Lấy tin tuyển dụng và kiểm tra quyền sở hữu (employer).

    - Không tồn tại → 404.
    - Không thuộc employer đang đăng nhập → 403.
    """
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Tin tuyển dụng không tồn tại")
    if job.employer_id != employer_profile_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền với tin này")
    return job
