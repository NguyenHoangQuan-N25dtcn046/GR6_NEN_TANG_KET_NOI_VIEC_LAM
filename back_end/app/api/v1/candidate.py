from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.errors import problem_responses
from app.core.permissions import require_candidate
from app.db.session import get_db
from app.models.entities import User
from app.schemas.application import ApplicationOut
from app.schemas.profile import CandidateProfileOut, CandidateProfileUpdate
from app.services import application_service, profile_service
from app.services.cv_service import resolve_cv_path

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


@router.post(
    "/cv", response_model=CandidateProfileOut, summary="Upload CV PDF",
    responses=problem_responses(413, 415),
)
def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    return profile_service.upload_cv(db, file, current_user.id)


@router.get(
    "/cv", response_class=FileResponse, summary="Tải CV của tôi",
    responses={200: {"content": {"application/pdf": {"schema": {"type": "string", "format": "binary"}}}}},
)
def download_own_cv(
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    profile = profile_service.get_profile(db, current_user.id)
    path = resolve_cv_path(profile.cv_url, current_user.id)
    if path is None:
        raise HTTPException(status_code=404, detail="Chưa có CV")
    return FileResponse(path, media_type="application/pdf", filename="cv.pdf")
