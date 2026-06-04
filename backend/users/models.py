import uuid
import enum
from sqlalchemy import Column, String, Text, Enum, DateTime, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class UserRole(str, enum.Enum):
    client = "client"
    freelancer = "freelancer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    full_name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_banned = Column(Boolean, nullable=False, default=False)
    is_admin  = Column(Boolean, nullable=False, server_default='false', default=False)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
