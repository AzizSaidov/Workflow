from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class DisputeMessageCreate(BaseModel):
    content: str


class DisputeMessageResponse(BaseModel):
    id: UUID
    transaction_id: UUID
    sender_id: UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
