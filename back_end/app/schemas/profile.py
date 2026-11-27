from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CandidateProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    skills: str | None = None


class CandidateProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    skills: Optional[str] = None
    cv_url: Optional[str] = None
