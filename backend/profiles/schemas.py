from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal


class ProfileUpdate(BaseModel):
    skills: list[str] | None = None
    hourly_rate: Decimal | None = None
    portfolio: list[dict] | None = None


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    skills: list[str]
    hourly_rate: Decimal | None
    portfolio: list[dict] | None
    rating: Decimal
    total_jobs: int

    model_config = {"from_attributes": True}
