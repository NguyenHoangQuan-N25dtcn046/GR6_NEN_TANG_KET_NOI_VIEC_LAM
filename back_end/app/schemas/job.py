from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Annotated, Literal

WorkMode = Literal["onsite", "remote", "hybrid"]
JobType = Literal["full-time", "part-time", "contract", "internship"]
ExperienceBand = Literal["0-1", "2-3", "4+"]
ApprovalStatus = Literal["pending", "approved", "rejected"]
Salary = Annotated[Decimal, Field(ge=0, max_digits=14, decimal_places=2)]
ExperienceYears = Annotated[int, Field(ge=0, le=50)]


class JobCategoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=100)


class JobCategoryOut(JobCategoryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class JobPublic(BaseModel):
    """Tin công khai (danh sách/chi tiết)."""
    id: int
    title: str
    description: str
    location: str
    salary_min: Decimal | None
    salary_max: Decimal | None
    deadline: date | None
    work_mode: WorkMode | None = None
    job_type: JobType | None = None
    experience_years: ExperienceYears | None = None
    category_id: int | None
    category_name: str | None = None
    employer_id: int
    company_name: str | None = None
    model_config = ConfigDict(from_attributes=True)


class JobCreate(BaseModel):
    """Employer tạo tin mới."""
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=10000)
    location: str = Field(min_length=1, max_length=200)
    salary_min: Salary | None = None
    salary_max: Salary | None = None
    category_id: int | None = None
    deadline: date | None = None
    work_mode: WorkMode | None = None
    job_type: JobType | None = None
    experience_years: ExperienceYears | None = None

    @model_validator(mode="after")
    def _check_salary_range(self):
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            raise ValueError("salary_min khong duoc lon hon salary_max")
        return self


class JobUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10, max_length=10000)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    salary_min: Salary | None = None
    salary_max: Salary | None = None
    category_id: int | None = None
    deadline: date | None = None
    work_mode: WorkMode | None = None
    job_type: JobType | None = None
    experience_years: ExperienceYears | None = None
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class JobStatusRequest(BaseModel):
    job_status: Literal["open", "closed"]
    model_config = ConfigDict(extra="forbid")


class RejectJobRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=1000)
    model_config = ConfigDict(extra="forbid")


class JobResponse(JobPublic):
    employer_id: int
    approval_status: ApprovalStatus
    job_status: Literal["open", "closed"]
    rejection_reason: str | None


class PublicJobDetail(JobResponse):
    is_expired: bool
