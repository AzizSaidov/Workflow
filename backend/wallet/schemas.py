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


class UserMini(BaseModel):
    id: UUID
    full_name: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class TransactionResponse(BaseModel):
    id: UUID
    project_id: UUID
    project_title: str
    client: UserMini
    freelancer: UserMini
    amount: Decimal
    status: EscrowStatus
    created_at: datetime
    released_at: datetime | None
