from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ExperienceBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company: str = Field(min_length=1, max_length=200)
    position: str = Field(min_length=1, max_length=200)
    start_date: date
    end_date: date | None = None
    description: str | None = Field(default=None, max_length=10000)


class ExperienceCreate(ExperienceBase):
    @model_validator(mode="after")
    def _check_dates(self):
        if self.end_date is not None and self.start_date > self.end_date:
            raise ValueError("Ngày bắt đầu phải trước ngày kết thúc")
        return self


class ExperienceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    company: str | None = Field(default=None, min_length=1, max_length=200)
    position: str | None = Field(default=None, min_length=1, max_length=200)
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = Field(default=None, max_length=10000)


class ExperienceOut(ExperienceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
