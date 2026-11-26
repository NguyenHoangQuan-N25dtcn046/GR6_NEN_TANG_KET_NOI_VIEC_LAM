from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ApplicationCreate(BaseModel):
    cover_letter: str | None = Field(default=None, max_length=5000)


class ApplicationStatusUpdate(BaseModel):
    status: Literal["reviewing", "accepted", "rejected"]


class ApplicationOut(BaseModel):
    """Góc nhìn của ứng viên: kèm tiêu đề tin và tên công ty."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    status: str
    applied_at: datetime
    cover_letter: Optional[str] = None
    cv_url: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None


class EmployerApplicationOut(BaseModel):
    """Góc nhìn của nhà tuyển dụng: kèm tên ứng viên."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    candidate_id: int
    status: str
    applied_at: datetime
    cover_letter: Optional[str] = None
    cv_url: Optional[str] = None
    candidate_name: Optional[str] = None
