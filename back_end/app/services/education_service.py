from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import CandidateEducation
from app.schemas.education import EducationCreate, EducationUpdate
from app.services.ownership import get_candidate_profile


def _get_owned(db: Session, education_id: int, candidate_id: int) -> CandidateEducation:
    edu = db.get(CandidateEducation, education_id)
    if edu is None or edu.candidate_id != candidate_id:
        raise HTTPException(status_code=404, detail="Học vấn không tồn tại")
    return edu


def list_educations(db: Session, user_id: int):
    profile = get_candidate_profile(db, user_id)
    stmt = (
        select(CandidateEducation)
        .where(CandidateEducation.candidate_id == profile.id)
        .order_by(CandidateEducation.start_date.desc())
    )
    return db.scalars(stmt).all()


def create_education(db: Session, payload: EducationCreate, user_id: int) -> CandidateEducation:
    profile = get_candidate_profile(db, user_id)
    edu = CandidateEducation(candidate_id=profile.id, **payload.model_dump())
    db.add(edu)
    db.commit()
    db.refresh(edu)
    return edu


def update_education(db: Session, education_id: int, payload: EducationUpdate, user_id: int) -> CandidateEducation:
    profile = get_candidate_profile(db, user_id)
    edu = _get_owned(db, education_id, profile.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(edu, key, value)
    db.commit()
    db.refresh(edu)
    return edu


def delete_education(db: Session, education_id: int, user_id: int) -> None:
    profile = get_candidate_profile(db, user_id)
    edu = _get_owned(db, education_id, profile.id)
    db.delete(edu)
    db.commit()
