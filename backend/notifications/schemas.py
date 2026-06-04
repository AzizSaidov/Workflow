from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from notifications.models import NotificationType


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime
    icon: Optional[str] = None
    color: Optional[str] = None
    points: Optional[int] = None

    model_config = {"from_attributes": True}


class UnreadCount(BaseModel):
    count: int
