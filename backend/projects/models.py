import uuid
import enum
from sqlalchemy import Column, String, Text, Enum, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class ProjectStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    delivered = "delivered"
    completed = "completed"
    disputed = "disputed"
    cancelled = "cancelled"


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    budget_min = Column(Numeric(10, 2), nullable=False)
    budget_max = Column(Numeric(10, 2), nullable=False)
    deadline = Column(Date, nullable=False)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.open)
    assigned_freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
