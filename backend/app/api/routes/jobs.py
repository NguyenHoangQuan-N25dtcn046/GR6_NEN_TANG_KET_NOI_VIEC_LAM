from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import Company, Job, JobStatus, User, UserRole, WorkType
from app.schemas.common import Message, Page
from app.schemas.job import JobCreate, JobResponse, JobUpdate

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

employer_required = require_role(UserRole.employer)


@router.get("", response_model=Page[JobResponse])
def list_jobs(
    keyword: str | None = Query(default=None),
    location: str | None = Query(default=None),
    category: str | None = Query(default=None),
    work_type: WorkType | None = Query(default=None),
    salary_min: int | None = Query(default=None, ge=0),
    salary_max: int | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Job).filter(Job.status == JobStatus.active.value)

    if keyword:
        like = f"%{keyword}%"
        query = query.filter(or_(Job.title.ilike(like), Job.description.ilike(like)))
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if category:
        query = query.filter(Job.category.ilike(f"%{category}%"))
    if work_type:
        query = query.filter(Job.work_type == work_type.value)
    if salary_min is not None:
        query = query.filter(Job.salary_max >= salary_min)
    if salary_max is not None:
        query = query.filter(Job.salary_min <= salary_max)

    total = query.count()
    items = (
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return Page[JobResponse](items=items, total=total, page=page, page_size=page_size)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job or job.status == JobStatus.rejected.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    user: User = Depends(employer_required),
    db: Session = Depends(get_db),
):
    company = db.query(Company).filter(Company.user_id == user.id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile not found. Create it first.",
        )
    job = Job(company_id=company.id, **payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    payload: JobUpdate,
    user: User = Depends(employer_required),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    company = db.query(Company).filter(Company.user_id == user.id).first()
    if not company or job.company_id != company.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(job, field, value)
    job.status = JobStatus.pending.value
    db.commit()
    db.refresh(job)
    return job


@router.patch("/{job_id}/close", response_model=Message)
def close_job(
    job_id: int,
    user: User = Depends(employer_required),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    company = db.query(Company).filter(Company.user_id == user.id).first()
    if not company or job.company_id != company.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job")

    job.status = JobStatus.closed.value
    db.commit()
    return Message(message="Job closed successfully")
