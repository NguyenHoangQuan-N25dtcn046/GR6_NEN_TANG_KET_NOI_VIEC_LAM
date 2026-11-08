from datetime import datetime

from pydantic import BaseModel, Field


class CandidateProfileBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    skills: list[str] = Field(default_factory=list)


class CandidateProfileUpdate(CandidateProfileBase):
    pass


class CandidateProfileResponse(CandidateProfileBase):
    id: int
    user_id: int
    email: str
    cv_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
