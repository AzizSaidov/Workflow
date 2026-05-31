from sqlalchemy.orm import Session
from languages.models import Language
from languages.schemas import LanguageCreate


def get_all_languages(db: Session) -> list[Language]:
    return db.query(Language).order_by(Language.name).all()


def create_language(data: LanguageCreate, db: Session) -> Language:
    language = Language(**data.model_dump())
    db.add(language)
    db.commit()
    db.refresh(language)
    return language
