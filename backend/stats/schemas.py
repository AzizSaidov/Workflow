from pydantic import BaseModel
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


class UserStats(BaseModel):
    role: UserRole
    active_projects: int
    completed_projects: int
    # client fields
    total_projects: int | None = None
    total_spent: Decimal | None = None
    # freelancer fields
    total_bids: int | None = None
    total_earned: Decimal | None = None
    average_rating: Decimal | None = None
