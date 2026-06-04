import uuid
import enum
from sqlalchemy import Column, String, Text, Boolean, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class NotificationType(str, enum.Enum):
    new_bid = "new_bid"
    bid_accepted = "bid_accepted"
    project_delivered = "project_delivered"
    payment_received = "payment_received"
    new_review = "new_review"
    project_disputed = "project_disputed"
    revision_requested = "revision_requested"
    achievement = "achievement"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
