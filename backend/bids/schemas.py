from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from bids.models import BidStatus


class BidCreate(BaseModel):
    price: Decimal
    cover_letter: str


class BidResponse(BaseModel):
    id: UUID
    project_id: UUID
    freelancer_id: UUID
    price: Decimal
    cover_letter: str
    status: BidStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class BidEnrichedResponse(BaseModel):
    id: UUID
    project_id: UUID
    freelancer_id: UUID
    price: Decimal
    cover_letter: str
    status: BidStatus
    created_at: datetime
    freelancer_name: str | None = None
    freelancer_avatar: str | None = None
    rating: float | None = None
    reviews_count: int = 0
    project_title: str | None = None

    model_config = {"from_attributes": True}
