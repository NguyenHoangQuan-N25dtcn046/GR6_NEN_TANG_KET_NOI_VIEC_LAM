
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.db.session import get_db
from app.models.entities import User
from app.schemas.job import RejectJobRequest, JobResponse
from app.services.job_permissions import get_job_or_404

router = APIRouter(
    prefix="/admin/jobs",
    tags=["Admin - Job Moderation"],
    dependencies=[Depends(require_admin)]
)


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