import uuid
import enum
from sqlalchemy import Column, Text, Enum, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class BidStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class Bid(Base):
    __tablename__ = "bids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    cover_letter = Column(Text, nullable=False)
    status = Column(Enum(BidStatus), nullable=False, default=BidStatus.pending)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
