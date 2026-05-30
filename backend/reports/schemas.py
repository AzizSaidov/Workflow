from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from reports.models import ReportStatus


class ReportCreate(BaseModel):
    reported_user_id: UUID
    project_id: UUID | None = None
    reason: str
    description: str


class ReportResponse(BaseModel):
    id: UUID
    reporter_id: UUID
    reported_user_id: UUID
    project_id: UUID | None
    reason: str
    description: str
    status: ReportStatus
    created_at: datetime

    model_config = {"from_attributes": True}
