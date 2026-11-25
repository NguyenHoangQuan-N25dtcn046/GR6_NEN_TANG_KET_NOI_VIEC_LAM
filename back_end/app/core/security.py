from datetime import datetime, timedelta, timezone
from uuid import uuid4
import jwt
from pwdlib import PasswordHash
from app.core.config import settings

hasher = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return hasher.hash(password)

def verify_password(password: str, stored_hash: str) -> bool:
    return hasher.verify(password, stored_hash)

def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user_id), 'token_type': 'access', 'jti': str(uuid4()),
        'iat': now, 'exp': now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
