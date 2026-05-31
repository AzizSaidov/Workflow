from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class ClientProfileUpdate(BaseModel):
    company_name: str | None = None
    website: str | None = None
    description: str | None = None
    location: str | None = None


class ClientProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_name: str | None
    website: str | None
    description: str | None
    location: str | None
    total_spent: Decimal
    total_projects: int
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}
