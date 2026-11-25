from typing import Callable
from fastapi import Depends, HTTPException, status
from app.api.v1.auth import get_current_user
from app.models.entities import User


def require_roles(*allowed_roles: str) -> Callable:
    def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:

        role = current_user.role
        role = role.value if hasattr(role, "value") else role
        role = str(role).lower()

        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập chức năng này"
            )

        return current_user

    return role_checker


# Các dependency phân quyền dùng lại
require_candidate = require_roles("candidate")
require_employer = require_roles("employer")
require_admin = require_roles("admin")
require_employer_or_admin = require_roles("employer", "admin")