from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class AchievementOut(BaseModel):
    id: UUID
    key: str
    name: str
    description: str
    icon: str
    color: str
    points: int
    category: str

    model_config = {"from_attributes": True}


class UserAchievementOut(BaseModel):
    id: UUID
    achievement: AchievementOut
    earned_at: datetime

    model_config = {"from_attributes": True}
