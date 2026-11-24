from datetime import date
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    location: str = Field(min_length=1, max_length=200)
    salary_min: Decimal | None = Field(default=None, ge=0)
    salary_max: Decimal | None = Field(default=None, ge=0)
    category_id: int | None = None
    deadline: date | None = None


class JobCreate(JobBase):
    @model_validator(mode="after")
    def _check_salary_range(self):
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            raise ValueError("salary_min khong duoc lon hon salary_max")
        return self


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    salary_min: Decimal | None = Field(default=None, ge=0)
    salary_max: Decimal | None = Field(default=None, ge=0)
    category_id: int | None = None
    deadline: date | None = None
    # Employer chỉ được đóng tin (closed) hoặc mở lại để chờ duyệt (pending);
    # việc duyệt published/rejected thuộc về Admin.
    status: Literal["pending", "closed"] | None = None

    @model_validator(mode="after")
    def _check_salary_range(self):
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            raise ValueError("salary_min khong duoc lon hon salary_max")
        return self


class JobOut(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    employer_id: int
    company_name: Optional[str] = None
