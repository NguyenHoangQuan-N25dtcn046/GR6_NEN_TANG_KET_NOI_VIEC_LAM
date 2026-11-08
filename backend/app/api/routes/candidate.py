from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import Application, ApplicationStatus, Candidate, Job, JobStatus, User, UserRole
from app.schemas.application import ApplicationCreate, ApplicationResponse
from app.schemas.candidate import CandidateProfileResponse, CandidateProfileUpdate
from app.schemas.common import Message, Page
from app.services.cv_service import skills_from_json, skills_to_json, validate_and_save_cv
from app.services.serializers import application_response

router = APIRouter(tags=["candidate"])

candidate_required = require_role(UserRole.candidate)


def _get_candidate(user: User, db: Session) -> Candidate:
    candidate = db.query(Candidate).filter(Candidate.user_id == user.id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found"
        )
    return candidate


@router.get("/api/candidate/profile", response_model=CandidateProfileResponse)
def get_profile(
    user: User = Depends(candidate_required), db: Session = Depends(get_db)
):
    candidate = _get_candidate(user, db)
    return CandidateProfileResponse(
        id=candidate.id,
        user_id=candidate.user_id,
        email=user.email,
        full_name=candidate.full_name,
        phone=candidate.phone,
        cv_url=candidate.cv_url,
        skills=skills_from_json(candidate.skills),
        created_at=candidate.created_at,
    )


@router.put("/api/candidate/profile", response_model=CandidateProfileResponse)
def update_profile(
    payload: CandidateProfileUpdate,
    user: User = Depends(candidate_required),
    db: Session = Depends(get_db),
):
    candidate = _get_candidate(user, db)
    candidate.full_name = payload.full_name
    candidate.phone = payload.phone
    candidate.skills = skills_to_json(payload.skills)
    db.commit()
    db.refresh(candidate)
    return CandidateProfileResponse(
        id=candidate.id,
        user_id=candidate.user_id,
        email=user.email,
        full_name=candidate.full_name,
        phone=candidate.phone,
        cv_url=candidate.cv_url,
        skills=skills_from_json(candidate.skills),
        created_at=candidate.created_at,
    )


@router.post("/api/candidate/cv", response_model=CandidateProfileResponse)
def upload_cv(
    file: UploadFile = File(...),
    user: User = Depends(candidate_required),
    db: Session = Depends(get_db),
):
    candidate = _get_candidate(user, db)
    cv_url = validate_and_save_cv(file)
    candidate.cv_url = cv_url
    db.commit()
    db.refresh(candidate)
    return CandidateProfileResponse(
        id=candidate.id,
        user_id=candidate.user_id,
        email=user.email,
        full_name=candidate.full_name,
        phone=candidate.phone,
        cv_url=candidate.cv_url,
        skills=skills_from_json(candidate.skills),
        created_at=candidate.created_at,
    )


@router.post(
    "/api/jobs/{job_id}/apply",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_job(
    job_id: int,
    payload: ApplicationCreate,
    user: User = Depends(candidate_required),
    db: Session = Depends(get_db),
):
    candidate = _get_candidate(user, db)
    job = db.get(Job, job_id)
    if not job or job.status != JobStatus.active.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or not available",
        )

    existing = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.candidate_id == candidate.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="You already applied to this job"
        )

    application = Application(
        job_id=job_id,
        candidate_id=candidate.id,
        cover_letter=payload.cover_letter,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application_response(application)


@router.get("/api/candidate/applications", response_model=Page[ApplicationResponse])
def my_applications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    user: User = Depends(candidate_required),
    db: Session = Depends(get_db),
):
    candidate = _get_candidate(user, db)
    query = db.query(Application).filter(Application.candidate_id == candidate.id)
    total = query.count()
    items = (
        query.order_by(Application.applied_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return Page[ApplicationResponse](
        items=[application_response(a) for a in items],
        total=total,
        page=page,
        page_size=page_size,
    )
