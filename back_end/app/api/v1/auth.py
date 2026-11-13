from datetime import datetime, timezone
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db
from app.models.entities import User, CandidateProfile, EmployerProfile, RevokedToken
from app.schemas.auth import RegisterRequest, LoginRequest, UserResponse, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

router = APIRouter(prefix='/auth', tags=['auth'])
bearer = HTTPBearer(auto_error=False)

def authenticated_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> tuple[User, dict]:
    error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token không hợp lệ hoặc đã hết hạn', headers={'WWW-Authenticate': 'Bearer'})
    if not credentials or credentials.scheme.lower() != 'bearer':
        raise error
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM], options={'require': ['sub','exp','iat','jti','token_type']})
        if payload.get('token_type') != 'access':
            raise error
        user_id = int(payload['sub'])
        jti = payload['jti']
        if not isinstance(jti, str) or not jti:
            raise error
    except (jwt.PyJWTError, ValueError, TypeError):
        raise error
    if db.scalar(select(RevokedToken).where(RevokedToken.jti == jti)):
        raise error
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise error
    return user, payload

def get_current_user(context: tuple[User, dict] = Depends(authenticated_context)) -> User:
    return context[0]

@router.post('/register', response_model=UserResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if data.role == 'candidate' and not (data.full_name and data.full_name.strip()):
        raise HTTPException(422, 'Candidate cần full_name')
    if data.role == 'employer' and not (data.company_name and data.company_name.strip()):
        raise HTTPException(422, 'Employer cần company_name')
    email = str(data.email).lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(409, 'Email đã được sử dụng')
    user = User(email=email, password_hash=hash_password(data.password), role=data.role)
    db.add(user)
    try:
        db.flush()
        if data.role == 'candidate':
            db.add(CandidateProfile(user_id=user.id, full_name=data.full_name.strip()))
        else:
            db.add(EmployerProfile(user_id=user.id, company_name=data.company_name.strip()))
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Email đã được sử dụng')
    return user

@router.post('/login', response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(data.email).lower()))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, 'Email hoặc mật khẩu không đúng')
    if not user.is_active:
        raise HTTPException(403, 'Tài khoản đã bị vô hiệu hóa')
    return TokenResponse(access_token=create_access_token(user.id))

@router.get('/me', response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user

@router.post('/logout')
def logout(context: tuple[User, dict] = Depends(authenticated_context), db: Session = Depends(get_db)):
    _, payload = context
    expires_at = datetime.fromtimestamp(payload['exp'], tz=timezone.utc).replace(tzinfo=None)
    db.add(RevokedToken(jti=payload['jti'], expires_at=expires_at))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(401, 'Token đã bị thu hồi')
    return {'message': 'Đăng xuất thành công'}
