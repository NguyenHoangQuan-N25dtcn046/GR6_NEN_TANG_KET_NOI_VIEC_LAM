from datetime import datetime

from pydantic import BaseModel


class UserAdminResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminStats(BaseModel):
    total_jobs: int
    total_applications: int
    total_users: int
    new_users_this_month: int
