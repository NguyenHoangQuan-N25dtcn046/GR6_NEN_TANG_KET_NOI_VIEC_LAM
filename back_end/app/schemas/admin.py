from datetime import datetime
from pydantic import BaseModel, ConfigDict, StrictBool


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime


class AdminUserPage(BaseModel):
    items: list[AdminUserResponse]
    total: int
    limit: int
    offset: int


class AccountStatusUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    is_active: StrictBool
