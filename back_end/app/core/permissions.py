
from typing import Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
import jwt
from jwt import InvalidTokenError

from app.core.config import settings
from app.db.session import get_db
from app.models.entities import User, RevokedToken

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    # 1. Kiểm tra Bearer Token
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bạn chưa đăng nhập",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials

    # 2. Giải mã JWT
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["sub", "exp", "jti"]}
        )

        if payload.get("token_type") != "access":
            raise InvalidTokenError("Sai loại token")

        user_id = int(payload["sub"])
        jti = payload["jti"]

    except (InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 3. Kiểm tra token đã logout chưa
    revoked = db.query(RevokedToken).filter(
        RevokedToken.jti == jti
    ).first()

    if revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã bị thu hồi"
        )

    # 4. Tìm người dùng trong database
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Người dùng không tồn tại"
        )

    # Nếu User có trường is_active, kiểm tra tại đây
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị vô hiệu hóa"
        )

    return user


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