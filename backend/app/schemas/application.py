from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ApplicationStatus


class ApplicationCreate(BaseModel):
    cover_letter: str | None = Field(default=None)


class CandidateBrief(BaseModel):
    id: int
    full_name: str
    phone: str | None = None
    email: str | None = None
    cv_url: str | None = None
    skills: list[str] = []

    class Config:
        from_attributes = True


class JobBrief(BaseModel):
    id: int
    title: str
    location: str
    company_name: str | None = None

    class Config:
        from_attributes = True


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    cover_letter: str | None = None
    status: ApplicationStatus
    applied_at: datetime
    candidate: CandidateBrief | None = None
    job: JobBrief | None = None

    class Config:
        from_attributes = True


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
