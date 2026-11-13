from typing import Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal['candidate', 'employer']
    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    company_name: str | None = Field(default=None, min_length=1, max_length=200)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    role: str
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
