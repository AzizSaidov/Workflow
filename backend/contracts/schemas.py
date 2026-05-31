from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from contracts.models import ContractStatus


class ContractResponse(BaseModel):
    id: UUID
    project_id: UUID
    client_id: UUID
    freelancer_id: UUID
    bid_id: UUID
    amount: Decimal
    status: ContractStatus
    started_at: datetime
    deadline: date | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}
