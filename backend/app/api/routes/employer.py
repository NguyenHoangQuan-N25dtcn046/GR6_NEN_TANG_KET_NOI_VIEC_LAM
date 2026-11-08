from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import (
    Application,
    Company,
    Job,
    JobStatus,
    User,
    UserRole,
)
from app.schemas.application import ApplicationResponse, ApplicationStatusUpdate
from app.schemas.common import Message, Page
from app.schemas.company import CompanyProfileResponse, CompanyProfileUpdate
from app.schemas.job import JobResponse, JobStatusUpdate
from app.services.serializers import application_response

router = APIRouter(tags=["employer"])

employer_required = require_role(UserRole.employer)


def _get_company(user: User, db: Session) -> Company:
    company = db.query(Company).filter(Company.user_id == user.id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company profile not found"
        )
    return company


@router.get("/api/employer/company", response_model=CompanyProfileResponse)
def get_company(
    user: User = Depends(employer_required), db: Session = Depends(get_db)
):
    company = _get_company(user, db)
    return CompanyProfileResponse(
        id=company.id,
        user_id=company.user_id,
        email=user.email,
        company_name=company.company_name,
        logo_url=company.logo_url,
        website=company.website,
        address=company.address,
        size=company.size,
        created_at=company.created_at,
    )


@router.put("/api/employer/company", response_model=CompanyProfileResponse)
def update_company(
    payload: CompanyProfileUpdate,
    user: User = Depends(employer_required),
    db: Session = Depends(get_db),
):
    company = _get_company(user, db)
    for field, value in payload.model_dump().items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    return CompanyProfileResponse(
        id=company.id,
        user_id=company.user_id,
        email=user.email,
        company_name=company.company_name,
        logo_url=company.logo_url,
        website=company.website,
        address=company.address,
        size=company.size,
        created_at=company.created_at,
    )


@router.get("/api/employer/jobs", response_model=Page[JobResponse])
def list_my_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    user: User = Depends(employer_required),
    db: Session = Depends(get_db),
):
    company = _get_company(user, db)
    query = db.query(Job).filter(Job.company_id == company.id)
    total = query.count()
    items = (
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return Page[JobResponse](items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/api/employer/jobs/{job_id}/applications",
    response_model=Page[ApplicationResponse],
)
def list_job_applications(
    job_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    user: User = Depends(employer_required),
    db: Session = Depends(get_db),
):
    company = _get_company(user, db)
    job = db.get(Job, job_id)
    if not job or job.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your job"
        )

    query = db.query(Application).filter(Application.job_id == job_id)
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


@router.patch("/api/applications/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    user: User = Depends(employer_required),
    db: Session = Depends(get_db),
):
    company = _get_company(user, db)
    app = db.get(Application, application_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    if not app.job or app.job.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your application"
        )

    app.status = payload.status.value
    db.commit()
    db.refresh(app)
    return application_response(app)


@router.patch("/api/employer/jobs/{job_id}/status", response_model=Message)
def toggle_job_status(
    job_id: int,
    payload: JobStatusUpdate,
    user: User = Depends(employer_required),
    db: Session = Depends(get_db),
):
    company = _get_company(user, db)
    job = db.get(Job, job_id)
    if not job or job.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your job"
        )

    if payload.status not in {JobStatus.active, JobStatus.closed}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employer can only set active or closed",
        )
    job.status = payload.status.value
    db.commit()
    return Message(message=f"Job status set to {payload.status.value}")
