
from fastapi import APIRouter, Depends

from app.core.permissions import (
    require_employer,
    require_employer_or_admin
)
from app.models.entities import User

router = APIRouter(
    prefix="/employer",
    tags=["Employer"]
)


@router.get("/dashboard")
def employer_dashboard(
    current_user: User = Depends(require_employer)
):
    return {
        "message": "Chào mừng Employer",
        "employer_id": current_user.id
    }


@router.post("/jobs")
def create_job(
    current_user: User = Depends(require_employer_or_admin)
):
    return {
        "message": "Bạn có quyền tạo tin tuyển dụng",
        "user_id": current_user.id
    }