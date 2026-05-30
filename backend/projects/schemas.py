from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from projects.models import ProjectStatus


class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str
    budget_min: Decimal
    budget_max: Decimal
    deadline: date


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    budget_min: Decimal | None = None
    budget_max: Decimal | None = None
    deadline: date | None = None
    status: ProjectStatus | None = None


class ProjectResponse(BaseModel):
    id: UUID
    client_id: UUID
    title: str
    description: str
    category: str
    budget_min: Decimal
    budget_max: Decimal
    deadline: date
    status: ProjectStatus
    assigned_freelancer_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
