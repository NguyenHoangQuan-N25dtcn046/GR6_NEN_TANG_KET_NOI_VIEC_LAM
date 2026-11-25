from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Job
from app.schemas.job import JobPublic, JobResponse
from app.core.permissions import require_employer
from app.models.entities import User
from app.schemas.job import (JobUpdateRequest,JobStatusRequest)
from app.services.job_permissions import require_job_owner

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=list[JobPublic])
def list_jobs(q: str | None = None, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    stmt = select(Job).where(Job.approval_status == "approved", Job.job_status == "open")
    if q:
        stmt = stmt.where(or_(Job.title.ilike(f"%{q}%"), Job.location.ilike(f"%{q}%")))
    return db.scalars(stmt.order_by(Job.id.desc()).offset(offset).limit(limit)).all()


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
