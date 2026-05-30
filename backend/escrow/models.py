import uuid
import enum
from sqlalchemy import Column, Numeric, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class EscrowStatus(str, enum.Enum):
    frozen = "frozen"
    released = "released"
    refunded = "refunded"
    disputed = "disputed"


class Transaction(Base):
    __tablename__ = "escrow_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(EscrowStatus), nullable=False, default=EscrowStatus.frozen)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
    released_at = Column(DateTime(timezone=True), nullable=True)
