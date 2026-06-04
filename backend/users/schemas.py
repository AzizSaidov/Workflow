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
    is_banned: bool
    is_admin: bool = False
    created_at: datetime
    latitude: float | None = None
    longitude: float | None = None

    model_config = {"from_attributes": True}


class AdminUserResponse(UserResponse):
    is_verified: bool = False


class UserUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
