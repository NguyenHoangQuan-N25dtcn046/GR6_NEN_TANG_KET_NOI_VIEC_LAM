from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import Candidate, Company, User, UserRole
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.common import Message

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.role == UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot register as admin",
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role.value,
    )
    db.add(user)
    db.flush()

    if payload.role == UserRole.candidate:
        if not payload.full_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="full_name is required for candidate",
            )
        db.add(Candidate(user_id=user.id, full_name=payload.full_name))
    else:
        if not payload.company_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="company_name is required for employer",
            )
        db.add(Company(user_id=user.id, company_name=payload.company_name))

    db.commit()
    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=UserRole(user.role))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is locked"
        )

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=UserRole(user.role))


@router.post("/change-password", response_model=Message)
def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect"
        )
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return Message(message="Password updated successfully")
