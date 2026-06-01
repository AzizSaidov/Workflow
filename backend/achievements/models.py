import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String, nullable=False)      # Tabler icon name, e.g. "star"
    color = Column(String, nullable=False, default="#7F77DD")
    points = Column(Integer, nullable=False, default=10)
    category = Column(String, nullable=False, default="general")  # general, client, freelancer


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    achievement_id = Column(UUID(as_uuid=True), ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime(timezone=True), default=get_dushanbe_time)

    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)
