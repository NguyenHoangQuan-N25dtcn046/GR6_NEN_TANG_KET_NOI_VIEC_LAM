from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.errors import problem_responses
from app.core.permissions import require_candidate
from app.db.session import get_db
from app.models.entities import User
from app.schemas.application import ApplicationOut
from app.schemas.education import EducationCreate, EducationOut, EducationUpdate
from app.schemas.experience import ExperienceCreate, ExperienceOut, ExperienceUpdate
from app.schemas.profile import CandidateProfileOut, CandidateProfileUpdate
from app.services import application_service, education_service, experience_service, profile_service
from app.services.cv_service import CV_DOWNLOAD_RESPONSES, cv_filename, resolve_cv_path

router = APIRouter(prefix="/candidate", tags=["Candidate"])


@router.get("/dashboard")
def candidate_dashboard(current_user: User = Depends(require_candidate)):
    return {"message": "Chào mừng Candidate", "user_id": current_user.id, "role": "candidate"}


@router.get("/profile", response_model=CandidateProfileOut, summary="Xem hồ sơ của tôi")
def get_my_profile(
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return profile_service.get_profile(db, current_user.id)


@router.patch("/profile", response_model=CandidateProfileOut, summary="Cập nhật hồ sơ")
def update_my_profile(
    payload: CandidateProfileUpdate,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return profile_service.update_profile(db, payload, current_user.id)


# ---- Kinh nghiệm làm việc ----

@router.get("/experiences", response_model=list[ExperienceOut], summary="Danh sách kinh nghiệm")
def list_experiences(
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return experience_service.list_experiences(db, current_user.id)


@router.post("/experiences", response_model=ExperienceOut, status_code=201, summary="Thêm kinh nghiệm")
def create_experience(
    payload: ExperienceCreate,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return experience_service.create_experience(db, payload, current_user.id)


@router.patch("/experiences/{experience_id}", response_model=ExperienceOut, summary="Sửa kinh nghiệm")
def update_experience(
    experience_id: int,
    payload: ExperienceUpdate,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return experience_service.update_experience(db, experience_id, payload, current_user.id)


@router.delete("/experiences/{experience_id}", status_code=204, summary="Xóa kinh nghiệm")
def delete_experience(
    experience_id: int,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    experience_service.delete_experience(db, experience_id, current_user.id)


# ---- Học vấn ----

@router.get("/educations", response_model=list[EducationOut], summary="Danh sách học vấn")
def list_educations(
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return education_service.list_educations(db, current_user.id)


@router.post("/educations", response_model=EducationOut, status_code=201, summary="Thêm học vấn")
def create_education(
    payload: EducationCreate,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return education_service.create_education(db, payload, current_user.id)


@router.patch("/educations/{education_id}", response_model=EducationOut, summary="Sửa học vấn")
def update_education(
    education_id: int,
    payload: EducationUpdate,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return education_service.update_education(db, education_id, payload, current_user.id)


@router.delete("/educations/{education_id}", status_code=204, summary="Xóa học vấn")
def delete_education(
    education_id: int,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    education_service.delete_education(db, education_id, current_user.id)


# ---- Đơn ứng tuyển ----

@router.get("/applications", response_model=list[ApplicationOut], summary="Lịch sử ứng tuyển của tôi")
def get_my_applications(
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return application_service.list_candidate_applications(db, current_user.id)


@router.get("/applications/{application_id}", response_model=ApplicationOut)
def get_my_application(
    application_id: int,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return application_service.get_candidate_application(db, application_id, current_user.id)


# ---- CV ----

@router.post(
    "/cv", response_model=CandidateProfileOut, summary="Upload CV (PDF/DOCX)",
    responses=problem_responses(413, 415),
)
def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return profile_service.upload_cv(db, file, current_user.id)


@router.get("/cv", response_class=FileResponse, summary="Tải CV của tôi", responses=CV_DOWNLOAD_RESPONSES)
def download_own_cv(
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    profile = profile_service.get_profile(db, current_user.id)
    path = resolve_cv_path(profile.cv_url, current_user.id)
    if path is None:
        raise HTTPException(status_code=404, detail="Chưa có CV")
    return FileResponse(path, filename=cv_filename(profile.cv_url))
