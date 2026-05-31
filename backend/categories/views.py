from sqlalchemy.orm import Session
from categories.models import Category
from categories.schemas import CategoryCreate


def get_all_categories(db: Session) -> list[Category]:
    return db.query(Category).filter(Category.is_active == True).order_by(Category.name).all()


def create_category(data: CategoryCreate, db: Session) -> Category:
    category = Category(**data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
