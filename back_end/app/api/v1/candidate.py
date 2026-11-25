
from fastapi import APIRouter, Depends

from app.core.permissions import require_candidate
from app.models.entities import User

router = APIRouter(
    prefix="/candidate",
    tags=["Candidate"]
)


@router.get("/dashboard")
def candidate_dashboard(current_user: User = Depends(require_candidate)):
    return {
        "message": "Chào mừng Candidate",
        "user_id": current_user.id,
        "role": "candidate"
    }


@router.get("/applications")
def get_my_applications(current_user: User = Depends(require_candidate)):
    return {
        "message": "Danh sách công việc đã ứng tuyển",
        "candidate_id": current_user.id,
        "data": []
    }