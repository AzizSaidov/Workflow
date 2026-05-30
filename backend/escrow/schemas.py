from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from escrow.models import EscrowStatus


class EscrowFreezeRequest(BaseModel):
    project_id: UUID


class TransactionResponse(BaseModel):
    id: UUID
    project_id: UUID
    client_id: UUID
    freelancer_id: UUID
    amount: Decimal
    status: EscrowStatus
    created_at: datetime
    released_at: datetime | None

    model_config = {"from_attributes": True}
