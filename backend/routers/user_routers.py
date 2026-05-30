from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from users.schemas import UserCreate, LoginRequest, TokenResponse, UserResponse
from users.views import register_user, login_user
from users.permissions import get_current_user
from users.models import User

users_router = APIRouter(prefix="/api/users", tags=["users"])


@users_router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    user, access_token, refresh_token = register_user(data, db)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@users_router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user, access_token, refresh_token = login_user(data, db)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@users_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
