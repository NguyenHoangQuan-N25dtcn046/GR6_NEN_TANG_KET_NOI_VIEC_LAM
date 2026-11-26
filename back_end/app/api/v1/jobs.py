from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import require_candidate, require_employer
from app.db.session import get_db
from app.models.entities import JobCategory, User
from app.schemas.application import ApplicationCreate, ApplicationOut
from app.schemas.job import (
    ExperienceBand, JobCategoryOut, JobPublic, JobResponse, JobStatusRequest,
    JobType, JobUpdateRequest, PublicJobDetail, WorkMode,
)
from app.services import application_service, job_service
from app.services.job_permissions import require_job_owner

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[JobPublic])
def list_jobs(
    q: str | None = None,
    location: str | None = None,
    category_id: int | None = None,
    work_mode: list[WorkMode] | None = Query(default=None),
    job_type: list[JobType] | None = Query(default=None),
    experience: list[ExperienceBand] | None = Query(default=None),
    salary_min: Decimal | None = Query(default=None, ge=0),
    salary_max: Decimal | None = Query(default=None, ge=0),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    if salary_min is not None and salary_max is not None and salary_min > salary_max:
        raise HTTPException(422, "Lương tối thiểu không được lớn hơn lương tối đa")
    return job_service.list_public_jobs(
        db, q=q, location=location, category_id=category_id, work_mode=work_mode,
        job_type=job_type, experience=experience, salary_min=salary_min, salary_max=salary_max,
        limit=limit, offset=offset,
    )


@router.get("/categories", response_model=list[JobCategoryOut])
def list_job_categories(db: Session = Depends(get_db)):
    return db.scalars(select(JobCategory).order_by(JobCategory.name, JobCategory.id)).all()


@router.get("/{job_id}", response_model=PublicJobDetail)
def get_job(job_id: int, db: Session = Depends(get_db)):
    return job_service.get_public_job(db, job_id)


@router.post(
    "/{job_id}/applications", response_model=ApplicationOut, status_code=201,
    responses={201: {"headers": {"Location": {"schema": {"type": "string"}}}}},
)
def apply_to_job(
    job_id: int,
    payload: ApplicationCreate,
    request: Request,
    response: Response,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    application = application_service.apply_to_job(db, job_id, payload, current_user.id)
    response.headers["Location"] = request.url_for("get_my_application", application_id=application.id).path
    return application


@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    payload: JobUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer),
):
    job = require_job_owner(db, job_id, current_user)

    changes = payload.model_dump(exclude_unset=True)

    if any(field in changes and changes[field] is None for field in ("title", "description", "location")):
        raise HTTPException(status_code=422, detail="Không được đặt thông tin tin tuyển dụng thành null")

    if not changes:
        raise HTTPException(status_code=400, detail="Không có dữ liệu cần cập nhật")

    salary_min = changes.get("salary_min", job.salary_min)
    salary_max = changes.get("salary_max", job.salary_max)
    if salary_min is not None and salary_max is not None and salary_min > salary_max:
        raise HTTPException(422, "Lương tối thiểu không được lớn hơn lương tối đa")
    if "category_id" in changes:
        job_service.ensure_category(db, changes["category_id"])

    for field, value in changes.items():
        setattr(job, field, value)

    # Tin đã duyệt hoặc bị từ chối cần duyệt lại
    job.approval_status = "pending"
    job.status = "pending"
    job.rejection_reason = None

    db.commit()
    db.refresh(job)
    return job


@router.patch("/{job_id}/status", response_model=JobResponse)
def update_job_status(
    job_id: int,
    payload: JobStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer),
):
    job = require_job_owner(db, job_id, current_user)

    # Không cho phép mở tin chưa được duyệt
    if payload.job_status == "open" and job.approval_status != "approved":
        raise HTTPException(status_code=409, detail="Tin tuyển dụng chưa được Admin duyệt")

    job.job_status = payload.job_status
    if job.approval_status == "approved":
        job.status = "published" if payload.job_status == "open" else "closed"

    db.commit()
    db.refresh(job)
    return job
