from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Literal, Optional


class JobPublic(BaseModel):
    """Tin công khai (danh sách/chi tiết)."""
    id: int
    title: str
    description: str
    location: str
    salary_min: Decimal | None
    salary_max: Decimal | None
    deadline: date | None
    category_id: int | None
    employer_id: int
    company_name: str | None = None
    model_config = ConfigDict(from_attributes=True)


class JobCreate(BaseModel):
    """Employer tạo tin mới."""
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    location: str = Field(min_length=1, max_length=200)
    salary_min: Decimal | None = Field(default=None, ge=0)
    salary_max: Decimal | None = Field(default=None, ge=0)
    category_id: int | None = None
    deadline: date | None = None

    @model_validator(mode="after")
    def _check_salary_range(self):
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            raise ValueError("salary_min khong duoc lon hon salary_max")
        return self


class JobUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10)
    model_config = ConfigDict(extra="forbid")


class JobStatusRequest(BaseModel):
    job_status: Literal["open", "closed"]
    model_config = ConfigDict(extra="forbid")


class RejectJobRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=1000)
    model_config = ConfigDict(extra="forbid")


class JobResponse(JobPublic):
    employer_id: int
    approval_status: Literal["pending", "approved", "rejected"]
    job_status: Literal["open", "closed"]
    rejection_reason: str | None
