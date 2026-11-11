from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class JobPublic(BaseModel):
    id: int
    title: str
    description: str
    location: str
    salary_min: Decimal | None
    salary_max: Decimal | None
    deadline: date | None
    model_config = ConfigDict(from_attributes=True)
