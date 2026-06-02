from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from skills.models import Skill
from skills.schemas import SkillResponse

skills_router = APIRouter(prefix="/api/skills", tags=["skills"])


@skills_router.get("/", response_model=list[SkillResponse])
def list_all_skills(db: Session = Depends(get_db)):
    return db.query(Skill).order_by(Skill.name).all()
