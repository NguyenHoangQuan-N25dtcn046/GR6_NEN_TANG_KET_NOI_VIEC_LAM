from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import Application, Company, Job, JobStatus, User, UserRole
from app.schemas.admin import AdminStats, UserAdminResponse
from app.schemas.common import Message, Page
from app.schemas.job import JobResponse, JobStatusUpdate

router = APIRouter(tags=["admin"])

admin_required = require_role(UserRole.admin)


@router.get("/api/admin/jobs", response_model=Page[JobResponse])
def list_jobs(
    status_filter: JobStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    user: User = Depends(admin_required),
    db: Session = Depends(get_db),
):
    query = db.query(Job)
    if status_filter:
        query = query.filter(Job.status == status_filter.value)
    total = query.count()
    items = (
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return Page[JobResponse](items=items, total=total, page=page, page_size=page_size)


@router.patch("/api/admin/jobs/{job_id}/status", response_model=Message)
def review_job(
    job_id: int,
    payload: JobStatusUpdate,
    user: User = Depends(admin_required),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if payload.status not in {JobStatus.active, JobStatus.rejected}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin can only approve (active) or reject (rejected)",
        )
    job.status = payload.status.value
    db.commit()
    return Message(message=f"Job status set to {payload.status.value}")


@router.get("/api/admin/users", response_model=Page[UserAdminResponse])
def list_users(
    role: UserRole | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    user: User = Depends(admin_required),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.value)
    total = query.count()
    items = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return Page[UserAdminResponse](
        items=items, total=total, page=page, page_size=page_size
    )


@router.patch("/api/admin/users/{user_id}/lock", response_model=UserAdminResponse)
def lock_user(
    user_id: int,
    user: User = Depends(admin_required),
    db: Session = Depends(get_db),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.role == UserRole.admin.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot lock an admin"
        )
    target.is_active = False
    db.commit()
    db.refresh(target)
    return target


@router.patch("/api/admin/users/{user_id}/unlock", response_model=UserAdminResponse)
def unlock_user(
    user_id: int,
    user: User = Depends(admin_required),
    db: Session = Depends(get_db),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    target.is_active = True
    db.commit()
    db.refresh(target)
    return target


@router.get("/api/admin/stats", response_model=AdminStats)
def stats(
    user: User = Depends(admin_required),
    db: Session = Depends(get_db),
):
    total_jobs = db.query(func.count(Job.id)).scalar() or 0
    total_applications = db.query(func.count(Application.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0

    now = datetime.now(timezone.utc)
    new_users_this_month = (
        db.query(func.count(User.id))
        .filter(
            extract("year", User.created_at) == now.year,
            extract("month", User.created_at) == now.month,
        )
        .scalar()
        or 0
    )

    return AdminStats(
        total_jobs=total_jobs,
        total_applications=total_applications,
        total_users=total_users,
        new_users_this_month=new_users_this_month,
    )
