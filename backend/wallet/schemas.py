from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from escrow.models import EscrowStatus


class WalletResponse(BaseModel):
    id: UUID
    user_id: UUID
    balance: Decimal
    frozen: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class DepositRequest(BaseModel):
    amount: Decimal


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
