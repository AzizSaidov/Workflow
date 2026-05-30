from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from profiles.schemas import ProfileUpdate, ProfileResponse
from profiles.views import get_profile, update_my_profile
from users.permissions import get_current_user
from users.models import User

profiles_router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@profiles_router.put("/me", response_model=ProfileResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_my_profile(data, current_user, db)


@profiles_router.get("/{user_id}", response_model=ProfileResponse)
def profile(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_profile(user_id, db)
