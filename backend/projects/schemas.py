from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from projects.models import ProjectStatus


class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str | None = None
    category_id: UUID | None = None
    budget_min: Decimal
    budget_max: Decimal
    deadline: date | None = None
    project_type: Literal["fixed", "hourly"] = "fixed"
    experience_level: Literal["entry", "intermediate", "expert"] = "entry"
    duration: str | None = None
    skill_ids: list[UUID] = []


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    category_id: UUID | None = None
    budget_min: Decimal | None = None
    budget_max: Decimal | None = None
    deadline: date | None = None
    status: ProjectStatus | None = None


class DeliverySubmit(BaseModel):
    delivery_github_url: str | None = None
    delivery_pr_url: str | None = None
    delivery_demo_url: str | None = None
    delivery_description: str | None = None


class ClientFeedback(BaseModel):
    client_feedback: str


class ProgressUpdate(BaseModel):
    progress_percent: int


class ProjectRevisionResponse(BaseModel):
    id: UUID
    project_id: UUID
    requested_by: UUID
    comment: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: UUID
    client_id: UUID
    category: str | None
    category_id: UUID | None
    title: str
    description: str
    budget_min: Decimal
    budget_max: Decimal
    deadline: date | None
    status: ProjectStatus
    assigned_freelancer_id: UUID | None
    project_type: str
    experience_level: str
    duration: str | None
    is_featured: bool
    delivery_github_url: str | None
    delivery_pr_url: str | None
    delivery_demo_url: str | None
    delivery_file_url: str | None
    delivery_description: str | None
    delivery_submitted_at: datetime | None
    client_feedback: str | None
    progress_percent: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
