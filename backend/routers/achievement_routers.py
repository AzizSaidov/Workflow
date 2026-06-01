from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from achievements.views import get_user_achievements, get_all_achievements, ensure_achievements_exist
from achievements.schemas import AchievementOut, UserAchievementOut
from users.permissions import get_current_user
from users.models import User

achievements_router = APIRouter(prefix="/api/achievements", tags=["achievements"])


@achievements_router.get("/", response_model=list[AchievementOut])
def all_achievements(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    ensure_achievements_exist(db)
    return get_all_achievements(db)


@achievements_router.get("/me", response_model=list[UserAchievementOut])
def my_achievements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_achievements(current_user.id, db)


@achievements_router.get("/{user_id}", response_model=list[UserAchievementOut])
def user_achievements(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_user_achievements(user_id, db)
