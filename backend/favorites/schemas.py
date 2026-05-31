from pydantic import BaseModel
from uuid import UUID


class FavoriteResponse(BaseModel):
    id: UUID
    user_id: UUID
    project_id: UUID | None
    freelancer_id: UUID | None

    model_config = {"from_attributes": True}
