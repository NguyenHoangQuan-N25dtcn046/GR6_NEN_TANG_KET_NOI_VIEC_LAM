
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.db.session import get_db
from app.models.entities import JobCategory, User
from app.schemas.auth import UserManagementList, UserResponse, UserStatusUpdate
from app.schemas.job import JobCategoryCreate, JobCategoryOut

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/dashboard")
def admin_dashboard(current_user: User = Depends(require_admin)):
    return {
        "message": "Chào mừng Admin",
        "admin_id": current_user.id
    }


@router.get("/users", response_model=UserManagementList, dependencies=[Depends(require_admin)])
def get_all_users(
    role: Literal["candidate", "employer", "admin"] | None = None,
    is_active: bool | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = select(User)
    if role is not None:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    return {
        "message": "Danh sách người dùng",
        "data": db.scalars(query.order_by(User.id.desc()).offset(offset).limit(limit)).all(),
    }


@router.patch("/users/{user_id}", response_model=UserResponse, dependencies=[Depends(require_admin)])
def update_user_status(user_id: int, payload: UserStatusUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "Tài khoản không tồn tại")
    if user.role == "admin":
        raise HTTPException(409, "Không thể thay đổi trạng thái tài khoản quản trị")
    db.execute(
        update(User).where(User.id == user_id, User.is_active.is_not(payload.is_active))
        .values(is_active=payload.is_active, auth_version=User.auth_version + 1)
    )
    db.commit()
    db.refresh(user)
    return user


@router.post("/categories", response_model=JobCategoryOut, status_code=201, dependencies=[Depends(require_admin)])
def create_category(payload: JobCategoryCreate, db: Session = Depends(get_db)):
    category = JobCategory(name=payload.name)
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if db.scalar(select(JobCategory.id).where(JobCategory.name == payload.name)) is not None:
            raise HTTPException(409, "Ngành nghề đã tồn tại")
        raise
    db.refresh(category)
    return category
