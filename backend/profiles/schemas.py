from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from profiles.models import LanguageLevel


class ProfileUpdate(BaseModel):
    title: str | None = None
    hourly_rate: Decimal | None = None
    experience_years: int | None = None
    response_time: str | None = None


class SkillInProfile(BaseModel):
    id: UUID
    skill_id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class LanguageInProfile(BaseModel):
    id: UUID
    language_id: UUID
    name: str
    code: str
    level: LanguageLevel

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None
    hourly_rate: Decimal | None
    rating: Decimal
    total_jobs: int
    is_verified: bool
    experience_years: int
    response_time: str | None
    connects_balance: int
    skills: list[SkillInProfile]
    languages: list[LanguageInProfile]

    model_config = {"from_attributes": True}


class SkillAddRequest(BaseModel):
    skill_id: UUID


class LanguageAddRequest(BaseModel):
    language_id: UUID
    level: LanguageLevel
