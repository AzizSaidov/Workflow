from pydantic import BaseModel
from uuid import UUID


class SkillCreate(BaseModel):
    name: str
    slug: str
    category_id: UUID


class SkillResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    category_id: UUID

    model_config = {"from_attributes": True}
