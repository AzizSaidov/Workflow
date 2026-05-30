from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from stats.schemas import GlobalStats, UserLocation
from stats.views import get_global_stats, get_user_locations

stats_router = APIRouter(prefix="/api/stats", tags=["stats"])


@stats_router.get("/global", response_model=GlobalStats)
def global_stats(db: Session = Depends(get_db)):
    return get_global_stats(db)


@stats_router.get("/users-locations", response_model=list[UserLocation])
def users_locations(db: Session = Depends(get_db)):
    return get_user_locations(db)
