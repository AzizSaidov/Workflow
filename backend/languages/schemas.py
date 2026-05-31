from pydantic import BaseModel
from uuid import UUID


class LanguageCreate(BaseModel):
    name: str
    code: str


class LanguageResponse(BaseModel):
    id: UUID
    name: str
    code: str

    model_config = {"from_attributes": True}
