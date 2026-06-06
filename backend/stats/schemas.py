from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from users.models import UserRole


class GlobalStats(BaseModel):
    total_freelancers: int
    total_clients: int
    total_projects: int
    completed_projects: int
    total_paid_out: Decimal


class UserLocation(BaseModel):
    lat: float
    lng: float
    role: UserRole


class TopFreelancerResponse(BaseModel):
    user_id: UUID
    full_name: str
    avatar_url: str | None
    rating: Decimal
    total_jobs: int
    is_online: bool = False

    model_config = {"from_attributes": True}


class CategoryStats(BaseModel):
    category: str
    count: int


class UserStats(BaseModel):
    role: UserRole
    active_projects: int
    completed_projects: int
    total_projects: int | None = None
    total_spent: Decimal | None = None
    total_bids: int | None = None
    total_earned: Decimal | None = None
    average_rating: Decimal | None = None
