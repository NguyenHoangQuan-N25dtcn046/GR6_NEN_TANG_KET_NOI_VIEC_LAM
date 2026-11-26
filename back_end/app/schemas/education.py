from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator


class EducationBase(BaseModel):
    school: str = Field(min_length=1, max_length=200)
    major: str = Field(min_length=1, max_length=200)
    degree: str = Field(min_length=1, max_length=100)
    start_date: date
    end_date: date | None = None


class EducationCreate(EducationBase):
    @model_validator(mode="after")
    def _check_dates(self):
        if self.end_date is not None and self.start_date > self.end_date:
            raise ValueError("Ngày bắt đầu phải trước ngày kết thúc")
        return self


class EducationUpdate(BaseModel):
    school: str | None = Field(default=None, min_length=1, max_length=200)
    major: str | None = Field(default=None, min_length=1, max_length=200)
    degree: str | None = Field(default=None, min_length=1, max_length=100)
    start_date: date | None = None
    end_date: date | None = None


class EducationOut(EducationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
