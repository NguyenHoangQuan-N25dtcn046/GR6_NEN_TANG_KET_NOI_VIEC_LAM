from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import JobStatus, WorkType


class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1)
    location: str = Field(min_length=1, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    work_type: WorkType = WorkType.onsite
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, min_length=1)
    location: str | None = Field(default=None, min_length=1, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    work_type: WorkType | None = None
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)


class CompanyBrief(BaseModel):
    id: int
    company_name: str
    logo_url: str | None = None

    class Config:
        from_attributes = True


class JobResponse(JobBase):
    id: int
    company_id: int
    status: JobStatus
    created_at: datetime
    company: CompanyBrief | None = None

    class Config:
        from_attributes = True


class JobStatusUpdate(BaseModel):
    status: JobStatus
