from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.permissions import require_candidate, require_employer
from app.db.session import get_db
from app.models.entities import User
from app.schemas.application import ApplicationCreate, ApplicationOut
from app.schemas.job import JobOut, JobResponse, JobUpdateRequest, JobStatusRequest
from app.services.job_permissions import require_job_owner
from app.services import application_service, job_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[JobOut], summary="Danh sách tin tuyển dụng công khai")
def list_jobs(
    q: Optional[str] = None,
    location: Optional[str] = None,
    category_id: Optional[int] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return job_service.list_public_jobs(db, q, location, category_id, limit, offset)


@router.get("/{job_id}", response_model=JobOut, summary="Chi tiết tin tuyển dụng")
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    return job_service.get_public_job(db, job_id)


@router.post("/{job_id}/applications", response_model=ApplicationOut, status_code=201, summary="Ứng tuyển công việc")
def apply_to_job(
    job_id: int,
    payload: ApplicationCreate,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return application_service.apply_to_job(db, job_id, payload, current_user.id)


@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    payload: JobUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    job = require_job_owner(db, job_id, current_user)

    changes = payload.model_dump(exclude_unset=True)

    if any(value is None for value in changes.values()):
        raise HTTPException(
            status_code=422,
            detail="Không được đặt thông tin tin tuyển dụng thành null"
        )

    if not changes:
        raise HTTPException(
            status_code=400,
            detail="Không có dữ liệu cần cập nhật"
        )

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
    current_user: User = Depends(require_employer)
):
    job = require_job_owner(db, job_id, current_user)

    # Không cho phép mở tin chưa được duyệt
    if (
        payload.job_status == "open"
        and job.approval_status != "approved"
    ):
        raise HTTPException(
            status_code=409,
            detail="Tin tuyển dụng chưa được Admin duyệt"
        )

    job.job_status = payload.job_status
    if job.approval_status == "approved":
        job.status = "published" if payload.job_status == "open" else "closed"

    db.commit()
    db.refresh(job)

    return job
