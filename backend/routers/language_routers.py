from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from languages.schemas import LanguageResponse
from languages.views import get_all_languages

languages_router = APIRouter(prefix="/api/languages", tags=["languages"])


@languages_router.get("/", response_model=list[LanguageResponse])
def list_languages(db: Session = Depends(get_db)):
    return get_all_languages(db)
