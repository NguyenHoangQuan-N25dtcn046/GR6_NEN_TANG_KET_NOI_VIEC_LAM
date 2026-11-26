from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class CandidateProfileUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    skills: str | None = None

    @field_validator("full_name", mode="before", json_schema_input_type=str)
    @classmethod
    def validate_full_name(cls, value):
        if value is None:
            raise ValueError("Họ tên không được để trống")
        return value


class CandidateProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    skills: Optional[str] = None
    cv_url: Optional[str] = None


class EmployerProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    company_name: str | None = Field(default=None, min_length=1, max_length=200)
    company_website: HttpUrl | None = None
    description: str | None = Field(default=None, max_length=10000)

    @field_validator("company_name", mode="before", json_schema_input_type=str)
    @classmethod
    def validate_company_name(cls, value):
        if value is None:
            raise ValueError("Tên công ty không được để trống")
        return value

    @field_validator("company_website")
    @classmethod
    def validate_website_length(cls, value):
        if value is not None and len(str(value)) > 255:
            raise ValueError("Website công ty tối đa 255 ký tự")
        return value


class EmployerProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    company_website: str | None
    description: str | None
