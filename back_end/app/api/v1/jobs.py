from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.permissions import require_candidate
from app.db.session import get_db
from app.models.entities import User
from app.schemas.application import ApplicationCreate, ApplicationOut
from app.schemas.job import JobOut
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
