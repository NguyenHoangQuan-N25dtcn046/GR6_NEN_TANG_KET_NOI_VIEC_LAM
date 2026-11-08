from datetime import datetime

from pydantic import BaseModel, Field


class CompanyProfileBase(BaseModel):
    company_name: str = Field(min_length=1, max_length=150)
    website: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=255)
    size: str | None = Field(default=None, max_length=50)


class CompanyProfileUpdate(CompanyProfileBase):
    pass


class CompanyProfileResponse(CompanyProfileBase):
    id: int
    user_id: int
    email: str
    logo_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
