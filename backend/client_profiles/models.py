import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey
from database import Base
from utils import get_dushanbe_time


class ClientProfile(Base):
    __tablename__ = "client_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String, nullable=True)
    website = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    total_spent = Column(Numeric(12, 2), nullable=False, default=0)
    total_projects = Column(Integer, nullable=False, default=0)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
