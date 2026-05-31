import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from utils import get_dushanbe_time


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    project_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)


class PortfolioLike(Base):
    __tablename__ = "portfolio_likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_item_id = Column(UUID(as_uuid=True), ForeignKey("portfolio_items.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)

    __table_args__ = (UniqueConstraint("portfolio_item_id", "user_id", name="uq_portfolio_like"),)
