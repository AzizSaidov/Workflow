from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from users.schemas import UserCreate, LoginRequest, TokenResponse, UserResponse, UserUpdate
from users.views import register_user, login_user, get_all_users, get_user_by_id, update_user, delete_user
from users.permissions import get_current_user
from users.models import User, UserRole
from stats.schemas import UserStats
from stats.views import get_my_stats

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


@users_router.get("/me/stats", response_model=UserStats)
def my_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_stats(current_user, db)


@users_router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_user(data, current_user, db)


@users_router.delete("/me", status_code=204)
def delete_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_user(current_user, db)


@users_router.get("/", response_model=list[UserResponse])
def list_users(
    role: UserRole | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_all_users(db, role)


@users_router.get("/{user_id}", response_model=UserResponse)
def user_profile(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_user_by_id(user_id, db)
