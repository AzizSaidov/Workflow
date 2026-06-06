import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class AdminAuditLog(Base):
    """Журнал действий администраторов — кто, что и над кем сделал."""
    __tablename__ = "admin_audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    admin_name = Column(String, nullable=True)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=True)
    target_id = Column(UUID(as_uuid=True), nullable=True)
    target_name = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
