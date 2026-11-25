from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.entities import CandidateProfile
from app.schemas.profile import CandidateProfileUpdate
from app.services.cv_service import save_cv
from app.services.ownership import get_candidate_profile


def get_profile(db: Session, user_id: int) -> CandidateProfile:
    """Hồ sơ ứng viên của chính mình."""
    return get_candidate_profile(db, user_id)


def update_profile(db: Session, payload: CandidateProfileUpdate, user_id: int) -> CandidateProfile:
    """Cập nhật hồ sơ (chỉ ghi đè trường gửi lên - PATCH)."""
    profile = get_candidate_profile(db, user_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


def upload_cv(db: Session, file: UploadFile, user_id: int) -> CandidateProfile:
    """Upload CV PDF hợp lệ rồi cập nhật cv_url trong hồ sơ."""
    profile = get_candidate_profile(db, user_id)
    cv_url = save_cv(file, user_id)
    profile.cv_url = cv_url
    db.commit()
    db.refresh(profile)
    return profile
