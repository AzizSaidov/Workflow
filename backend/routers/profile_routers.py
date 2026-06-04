from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from profiles.schemas import ProfileUpdate, ProfileResponse, SkillAddRequest, LanguageAddRequest, CategoryAddRequest
from profiles.views import (
    get_profile, update_my_profile, get_top_freelancers,
    add_skill, remove_skill, add_language, remove_language,
    add_category, remove_category,
    toggle_like, get_likes,
)
from users.permissions import get_current_user, get_optional_user
from users.models import User

profiles_router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@profiles_router.get("/top", response_model=list[ProfileResponse])
def top_freelancers(
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User | None = Depends(get_optional_user),
):
    return get_top_freelancers(db, category_slug=category)


@profiles_router.get("/{user_id}", response_model=ProfileResponse)
def profile(user_id: UUID, db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    return get_profile(user_id, db)


@profiles_router.put("/me", response_model=ProfileResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_my_profile(data, current_user, db)


@profiles_router.post("/me/skills", response_model=ProfileResponse)
def add_skill_to_profile(data: SkillAddRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return add_skill(data, current_user, db)


@profiles_router.delete("/me/skills/{skill_id}", response_model=ProfileResponse)
def remove_skill_from_profile(skill_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return remove_skill(skill_id, current_user, db)


@profiles_router.post("/me/languages", response_model=ProfileResponse)
def add_language_to_profile(data: LanguageAddRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return add_language(data, current_user, db)


@profiles_router.delete("/me/languages/{language_id}", response_model=ProfileResponse)
def remove_language_from_profile(language_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return remove_language(language_id, current_user, db)


@profiles_router.post("/me/categories", response_model=ProfileResponse)
def add_category_to_profile(data: CategoryAddRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return add_category(data, current_user, db)


@profiles_router.delete("/me/categories/{category_id}", response_model=ProfileResponse)
def remove_category_from_profile(category_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return remove_category(category_id, current_user, db)


@profiles_router.post("/{user_id}/like")
def like_profile(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return toggle_like(user_id, current_user, db)


@profiles_router.get("/{user_id}/likes")
def profile_likes(user_id: UUID, db: Session = Depends(get_db), current_user: User | None = Depends(get_optional_user)):
    return get_likes(user_id, current_user.id if current_user else None, db)
