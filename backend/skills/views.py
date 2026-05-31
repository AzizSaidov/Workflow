from sqlalchemy.orm import Session
from skills.models import Skill
from skills.schemas import SkillCreate
from categories.models import Category
from fastapi import HTTPException


def get_skills_by_category(slug: str, db: Session) -> list[Skill]:
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return db.query(Skill).filter(Skill.category_id == category.id).order_by(Skill.name).all()


def create_skill(data: SkillCreate, db: Session) -> Skill:
    skill = Skill(**data.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill
