
from fastapi import APIRouter, Depends

from app.core.permissions import require_admin
from app.models.entities import User

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/dashboard")
def admin_dashboard(
    current_user: User = Depends(require_admin)
):
    return {
        "message": "Chào mừng Admin",
        "admin_id": current_user.id
    }


@router.get("/users")
def get_all_users(
    current_user: User = Depends(require_admin)
):
    return {
        "message": "Bạn có quyền xem danh sách người dùng",
        "data": []
    }
