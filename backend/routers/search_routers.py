from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from search.views import search_projects, search_freelancers
from projects.schemas import ProjectResponse
from profiles.schemas import ProfileResponse
from users.permissions import get_current_user
from users.models import User

search_router = APIRouter(prefix="/api/search", tags=["search"])


@search_router.get("/projects", response_model=list[ProjectResponse])
def projects(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    budget_min: float | None = Query(default=None),
    budget_max: float | None = Query(default=None),
    deadline: str | None = Query(default=None),
    sort_by: str | None = Query(default=None, description="date | budget | bids"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return search_projects(db, q, category, budget_min, budget_max, deadline, sort_by)


@search_router.get("/freelancers", response_model=list[ProfileResponse])
def freelancers(
    q: str | None = Query(default=None),
    skills: str | None = Query(default=None, description="comma-separated"),
    min_rate: float | None = Query(default=None),
    max_rate: float | None = Query(default=None),
    min_rating: float | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return search_freelancers(db, q, skills, min_rate, max_rate, min_rating)
