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
    action = Column(String, nullable=False)        # ban_user, unban_user, verify, topup, release_dispute, hide_project, ...
    target_type = Column(String, nullable=True)    # user | project | transaction | report
    target_id = Column(UUID(as_uuid=True), nullable=True)
    target_name = Column(String, nullable=True)
    detail = Column(Text, nullable=True)           # причина / сумма / роль и т.п.
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
