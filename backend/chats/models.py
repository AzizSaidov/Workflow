import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    file_url = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)


class ChatHidden(Base):
    __tablename__ = "chat_hidden"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    hidden_at = Column(DateTime(timezone=True), default=get_dushanbe_time)

    __table_args__ = (UniqueConstraint("user_id", "project_id"),)
