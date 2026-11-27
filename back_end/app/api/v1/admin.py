from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.db.session import get_db
from app.models.entities import User
from app.schemas.admin import AccountStatusUpdate, AdminUserPage, AdminUserResponse

router = APIRouter(prefix='/admin', tags=['Admin'])


@router.get('/dashboard')
def admin_dashboard(current_user: User = Depends(require_admin)):
    return {'message': 'Chào mừng Admin', 'admin_id': current_user.id}


@router.get('/users', response_model=AdminUserPage)
def get_all_users(
    q: str | None = Query(None, max_length=255),
    role: Literal['candidate', 'employer', 'admin'] | None = None,
    is_active: bool | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    filters = []
    if q and q.strip():
        filters.append(func.lower(User.email).contains(q.strip().lower(), autoescape=True))
    if role is not None:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active == is_active)
    total = db.scalar(select(func.count(User.id)).where(*filters))
    users = db.scalars(select(User).where(*filters).order_by(User.id.desc()).offset(offset).limit(limit)).all()
    return AdminUserPage(items=[AdminUserResponse.model_validate(user) for user in users],
                         total=total, limit=limit, offset=offset)


@router.patch('/users/{user_id}/status', response_model=AdminUserResponse)
def update_user_status(
    user_id: int,
    data: AccountStatusUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, 'Không tìm thấy tài khoản')
    # SRS allows locking Candidate and Employer, not administrators.
    if user.id == current_user.id or user.role not in ('candidate', 'employer'):
        raise HTTPException(403, 'Không được thay đổi trạng thái tài khoản quản trị viên')
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user
