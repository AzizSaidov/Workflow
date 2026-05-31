from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class PortfolioCreate(BaseModel):
    title: str
    description: str | None = None
    image_url: str | None = None
    project_url: str | None = None
    category_id: UUID | None = None


class PortfolioUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
    project_url: str | None = None
    category_id: UUID | None = None


class PortfolioResponse(BaseModel):
    id: UUID
    user_id: UUID
    category_id: UUID | None
    title: str
    description: str | None
    image_url: str | None
    project_url: str | None
    likes_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
