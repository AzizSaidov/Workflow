import uuid
from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy import String
from database import Base


class FreelancerProfile(Base):
    __tablename__ = "freelancer_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    skills = Column(ARRAY(String), nullable=False, default=list)
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    portfolio = Column(JSONB, nullable=True, default=list)
    rating = Column(Numeric(3, 2), nullable=False, default=0)
    total_jobs = Column(Integer, nullable=False, default=0)
