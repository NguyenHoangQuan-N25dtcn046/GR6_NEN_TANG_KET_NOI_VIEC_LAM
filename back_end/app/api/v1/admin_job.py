
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.db.session import get_db
from app.models.entities import Job
from app.schemas.job import JobResponse, PendingJobPage, RejectJobRequest
from app.services.job_permissions import get_job_or_404

router = APIRouter(
    prefix="/admin/jobs",
    tags=["Admin - Job Moderation"],
    dependencies=[Depends(require_admin)]
)


@router.get("/pending", response_model=PendingJobPage, summary="Danh sách tin chờ duyệt")
def list_pending_jobs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    pending = Job.approval_status == "pending"
    total = db.scalar(select(func.count(Job.id)).where(pending))
    query = select(Job).where(pending).order_by(Job.id.desc()).offset(offset).limit(limit)
    return {"items": db.scalars(query).all(), "total": total}


@router.patch("/{job_id}/approve", response_model=JobResponse)
def approve_job(job_id: int,db: Session = Depends(get_db)):
    job = get_job_or_404(db, job_id)

    if job.approval_status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Chỉ có thể duyệt tin đang chờ duyệt"
        )

    job.approval_status = "approved"
    job.status = "published" if job.job_status == "open" else "closed"
    job.rejection_reason = None

    db.commit()
    db.refresh(job)

    return job


@router.patch("/{job_id}/reject", response_model=JobResponse)
def reject_job(job_id: int,payload: RejectJobRequest,db: Session = Depends(get_db)):
    job = get_job_or_404(db, job_id)

    if job.approval_status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Chỉ có thể từ chối tin đang chờ duyệt"
        )

    job.approval_status = "rejected"
    job.status = "rejected"
    job.rejection_reason = payload.reason
    job.job_status = "closed"

    db.commit()
    db.refresh(job)

    return job
