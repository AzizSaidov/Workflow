from pydantic import BaseModel
from uuid import UUID
from datetime import date


class CertificationCreate(BaseModel):
    title: str
    issuer: str
    issue_date: date
    credential_url: str | None = None


class CertificationUpdate(BaseModel):
    title: str | None = None
    issuer: str | None = None
    issue_date: date | None = None
    credential_url: str | None = None


class CertificationResponse(BaseModel):
    id: UUID
    profile_id: UUID
    title: str
    issuer: str
    issue_date: date
    credential_url: str | None

    model_config = {"from_attributes": True}
