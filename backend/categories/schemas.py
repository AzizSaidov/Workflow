from pydantic import BaseModel
from uuid import UUID


class CategoryCreate(BaseModel):
    name: str
    slug: str
    icon: str | None = None
    description: str | None = None
    is_active: bool = True


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    icon: str | None
    description: str | None
    is_active: bool

    model_config = {"from_attributes": True}
