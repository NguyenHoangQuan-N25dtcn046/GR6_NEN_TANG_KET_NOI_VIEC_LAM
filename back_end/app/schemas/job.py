from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

class JobPublic(BaseModel):
    id: int
    title: str
    description: str
    location: str
    salary_min: Decimal | None
    salary_max: Decimal | None
    deadline: date | None
    model_config = ConfigDict(from_attributes=True)

class JobUpdateRequest(BaseModel):
    title: str | None = Field(
        default=None, min_length=3, max_length=200
    )
    description: str | None = Field(
        default=None, min_length=10
    )

    model_config = ConfigDict(extra="forbid")


class JobStatusRequest(BaseModel):
    job_status: Literal["open", "closed"]

    model_config = ConfigDict(extra="forbid")


class RejectJobRequest(BaseModel):
    reason: str = Field(
        min_length=5,
        max_length=1000
    )

    model_config = ConfigDict(extra="forbid")


class JobResponse(JobPublic):
    employer_id: int
    approval_status: Literal["pending", "approved", "rejected"]
    job_status: Literal["open", "closed"]
    rejection_reason: str | None
