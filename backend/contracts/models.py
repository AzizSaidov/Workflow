import uuid
import enum
from sqlalchemy import Column, String, Numeric, Date, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class ContractStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    disputed = "disputed"
    cancelled = "cancelled"


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(ContractStatus), nullable=False, default=ContractStatus.active)
    started_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
    deadline = Column(Date, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
