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
