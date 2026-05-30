from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class MessageResponse(BaseModel):
    id: UUID
    project_id: UUID
    sender_id: UUID
    content: str
    file_url: str | None
    file_type: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
