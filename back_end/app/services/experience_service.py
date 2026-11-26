from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import CandidateExperience
from app.schemas.experience import ExperienceCreate, ExperienceUpdate
from app.services.ownership import get_candidate_profile


def _get_owned(db: Session, experience_id: int, candidate_id: int) -> CandidateExperience:
    exp = db.get(CandidateExperience, experience_id)
    if exp is None or exp.candidate_id != candidate_id:
        raise HTTPException(status_code=404, detail="Kinh nghiệm không tồn tại")
    return exp


def list_experiences(db: Session, user_id: int):
    profile = get_candidate_profile(db, user_id)
    stmt = (
        select(CandidateExperience)
        .where(CandidateExperience.candidate_id == profile.id)
        .order_by(CandidateExperience.start_date.desc())
    )
    return db.scalars(stmt).all()


def create_experience(db: Session, payload: ExperienceCreate, user_id: int) -> CandidateExperience:
    profile = get_candidate_profile(db, user_id)
    exp = CandidateExperience(candidate_id=profile.id, **payload.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


def update_experience(db: Session, experience_id: int, payload: ExperienceUpdate, user_id: int) -> CandidateExperience:
    profile = get_candidate_profile(db, user_id)
    exp = _get_owned(db, experience_id, profile.id)
    changes = payload.model_dump(exclude_unset=True)
    values = {field: getattr(exp, field) for field in ExperienceCreate.model_fields}
    values.update(changes)
    try:
        ExperienceCreate.model_validate(values)
    except ValidationError as error:
        raise HTTPException(status_code=422, detail=error.errors()[0]["msg"])

    for key, value in changes.items():
        setattr(exp, key, value)
    db.commit()
    db.refresh(exp)
    return exp


def delete_experience(db: Session, experience_id: int, user_id: int) -> None:
    profile = get_candidate_profile(db, user_id)
    exp = _get_owned(db, experience_id, profile.id)
    db.delete(exp)
    db.commit()
