import uuid
from sqlalchemy import Column, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Numeric(10, 2), nullable=False, default=0)
    frozen = Column(Numeric(10, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
