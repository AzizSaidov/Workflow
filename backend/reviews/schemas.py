from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime


class ReviewCreate(BaseModel):
    project_id: UUID
    reviewee_id: UUID
    rating: int
    comment: str

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewResponse(BaseModel):
    id: UUID
    project_id: UUID
    reviewer_id: UUID
    reviewee_id: UUID
    rating: int
    comment: str
    created_at: datetime
    reviewer_name: str = 'Аноним'
    reviewer_avatar_url: str | None = None

    model_config = {"from_attributes": True}
