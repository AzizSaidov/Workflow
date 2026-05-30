from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from users.models import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole


class UserResponse(BaseModel):
    id: UUID
    email: str
    role: UserRole
    full_name: str
    avatar_url: str | None
    bio: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
