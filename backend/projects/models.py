import uuid
import enum
from sqlalchemy import Column, String, Text, Enum, DateTime, Date, Numeric, ForeignKey, Boolean, Integer
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
    # legacy field kept for backward compat
    category = Column(String, nullable=True)
    # new category FK (stage 5)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    budget_min = Column(Numeric(10, 2), nullable=False)
    budget_max = Column(Numeric(10, 2), nullable=False)
    deadline = Column(Date, nullable=True)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.open)
    assigned_freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    # new fields (stage 5) — VARCHAR to avoid ENUM ALTER complications
    project_type = Column(String, nullable=False, default="fixed")
    experience_level = Column(String, nullable=False, default="entry")
    duration = Column(String, nullable=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    # delivery fields (from master TZ)
    delivery_github_url = Column(String, nullable=True)
    delivery_pr_url = Column(String, nullable=True)
    delivery_demo_url = Column(String, nullable=True)
    delivery_file_url = Column(String, nullable=True)
    delivery_description = Column(Text, nullable=True)
    delivery_submitted_at = Column(DateTime(timezone=True), nullable=True)
    client_feedback = Column(Text, nullable=True)
    progress_percent = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)


class ProjectSkill(Base):
    __tablename__ = "project_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)
