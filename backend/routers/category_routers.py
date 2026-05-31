from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from categories.schemas import CategoryCreate, CategoryResponse
from categories.views import get_all_categories, create_category
from skills.schemas import SkillCreate, SkillResponse
from skills.views import get_skills_by_category, create_skill
from users.permissions import check_admin
from users.models import User

categories_router = APIRouter(prefix="/api/categories", tags=["categories"])


@categories_router.get("/", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return get_all_categories(db)


@categories_router.get("/{slug}/skills", response_model=list[SkillResponse])
def list_skills_by_category(slug: str, db: Session = Depends(get_db)):
    return get_skills_by_category(slug, db)


@categories_router.post("/", response_model=CategoryResponse, status_code=201)
def add_category(data: CategoryCreate, db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return create_category(data, db)


@categories_router.post("/skills", response_model=SkillResponse, status_code=201)
def add_skill(data: SkillCreate, db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return create_skill(data, db)
