import uuid
from sqlalchemy import Column, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
