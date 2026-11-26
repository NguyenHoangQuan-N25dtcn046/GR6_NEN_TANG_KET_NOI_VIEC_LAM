
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, select, update
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.db.session import get_db
from app.models.entities import Job
from app.schemas.job import ApprovalStatus, JobResponse, RejectJobRequest
from app.services.job_permissions import get_job_or_404

router = APIRouter(
    prefix="/admin/jobs",
    tags=["Admin - Job Moderation"],
    dependencies=[Depends(require_admin)]
)


@router.get("", response_model=list[JobResponse])
def list_jobs_for_moderation(
    approval_status: ApprovalStatus | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = select(Job)
    if approval_status is not None:
        query = query.where(Job.approval_status == approval_status)
    return db.scalars(query.order_by(Job.id.desc()).offset(offset).limit(limit)).all()


@router.get("/{job_id}", response_model=JobResponse)
def get_job_for_moderation(job_id: int, db: Session = Depends(get_db)):
    return get_job_or_404(db, job_id)


@router.patch("/{job_id}/reject", response_model=JobResponse)
def reject_job(job_id: int, payload: RejectJobRequest, db: Session = Depends(get_db)):
    return moderate_pending_job(
        db, job_id, approval_status="rejected", status="rejected",
        rejection_reason=payload.reason, job_status="closed",
    )


@router.patch("/{job_id}/approve", response_model=JobResponse)
def approve_job(job_id: int, db: Session = Depends(get_db)):
    return moderate_pending_job(
        db, job_id, approval_status="approved",
        status=case((Job.job_status == "open", "published"), else_="closed"),
        rejection_reason=None,
    )


def moderate_pending_job(db: Session, job_id: int, **changes) -> Job:
    result = db.execute(
        update(Job).where(Job.id == job_id, Job.approval_status == "pending").values(**changes)
    )
    if result.rowcount == 0:
        db.rollback()
        get_job_or_404(db, job_id)
        raise HTTPException(409, "Chỉ có thể xử lý tin đang chờ duyệt")
    job = get_job_or_404(db, job_id)
    db.commit()
    return job
