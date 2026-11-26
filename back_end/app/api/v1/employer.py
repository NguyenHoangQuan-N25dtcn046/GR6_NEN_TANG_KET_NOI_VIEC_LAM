from fastapi import APIRouter, Depends, Query, Request, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.permissions import require_employer
from app.db.session import get_db
from app.models.entities import User
from app.schemas.application import ApplicationStatusUpdate, EmployerApplicationOut
from app.schemas.job import JobCreate, JobResponse
from app.services import application_service, job_service
from app.services.ownership import get_employer_profile, get_owned_job

router = APIRouter(prefix="/employer", tags=["Employer"])


@router.get("/dashboard")
def employer_dashboard(current_user: User = Depends(require_employer)):
    return {"message": "Chào mừng Employer", "employer_id": current_user.id}


@router.get("/jobs", response_model=list[JobResponse], summary="Danh sách tin của tôi")
def list_my_jobs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    return job_service.list_employer_jobs(db, current_user.id, limit, offset)


@router.get("/jobs/{job_id}", response_model=JobResponse, summary="Xem tin của tôi")
def get_my_job(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    profile = get_employer_profile(db, current_user.id)
    return get_owned_job(db, job_id, profile.id)


@router.post(
    "/jobs", response_model=JobResponse, status_code=201, summary="Tạo tin tuyển dụng",
    responses={201: {"headers": {"Location": {"schema": {"type": "string"}}}}},
)
def create_job(
    payload: JobCreate,
    request: Request,
    response: Response,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    job = job_service.create_job(db, payload, current_user.id)
    response.headers["Location"] = request.url_for("get_my_job", job_id=job.id).path
    return job


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa tin")
def delete_job(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    job_service.delete_job(db, job_id, current_user.id)


@router.get("/jobs/{job_id}/applications", response_model=list[EmployerApplicationOut], summary="Xem đơn ứng tuyển của tin")
def list_job_applications(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    return application_service.list_job_applications(db, job_id, current_user.id)


@router.patch("/jobs/{job_id}/applications/{application_id}", response_model=EmployerApplicationOut, summary="Xử lý đơn ứng tuyển")
def update_application_status(
    job_id: int,
    application_id: int,
    payload: ApplicationStatusUpdate,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    return application_service.update_application_status(db, job_id, application_id, payload, current_user.id)


@router.get(
    "/jobs/{job_id}/applications/{application_id}/cv",
    response_class=FileResponse, summary="Tải CV ứng viên",
    responses={200: {"content": {"application/pdf": {"schema": {"type": "string", "format": "binary"}}}}},
)
def download_application_cv(
    job_id: int,
    application_id: int,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    path = application_service.get_application_cv_path(db, job_id, application_id, current_user.id)
    return FileResponse(path, media_type="application/pdf", filename="cv.pdf")
