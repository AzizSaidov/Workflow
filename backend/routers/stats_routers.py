from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from stats.schemas import GlobalStats, UserLocation, TopFreelancerResponse, CategoryStats
from stats.views import get_global_stats, get_user_locations, get_top_freelancers, get_recent_projects, get_category_stats, get_online_count
from projects.schemas import ProjectResponse

stats_router = APIRouter(prefix="/api/stats", tags=["stats"])


@stats_router.get("/global", response_model=GlobalStats)
def global_stats(db: Session = Depends(get_db)):
    return get_global_stats(db)


@stats_router.get("/users-locations", response_model=list[UserLocation])
def users_locations(db: Session = Depends(get_db)):
    return get_user_locations(db)


@stats_router.get("/top-freelancers", response_model=list[TopFreelancerResponse])
def top_freelancers(db: Session = Depends(get_db)):
    return get_top_freelancers(db)


@stats_router.get("/recent-projects", response_model=list[ProjectResponse])
def recent_projects(db: Session = Depends(get_db)):
    return get_recent_projects(db)


@stats_router.get("/categories", response_model=list[CategoryStats])
def category_stats(db: Session = Depends(get_db)):
    return get_category_stats(db)


@stats_router.get("/online-count")
def online_count():
    return {"count": get_online_count()}
