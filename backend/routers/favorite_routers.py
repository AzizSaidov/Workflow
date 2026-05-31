from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from favorites.schemas import FavoriteResponse
from favorites.views import get_favorites, add_project, remove_project, add_freelancer, remove_freelancer
from users.permissions import get_current_user
from users.models import User

favorites_router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@favorites_router.get("/", response_model=list[FavoriteResponse])
def my_favorites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_favorites(current_user, db)


@favorites_router.post("/project/{project_id}", response_model=FavoriteResponse, status_code=201)
def fav_project(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return add_project(project_id, current_user, db)


@favorites_router.delete("/project/{project_id}", status_code=204)
def unfav_project(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    remove_project(project_id, current_user, db)


@favorites_router.post("/freelancer/{freelancer_id}", response_model=FavoriteResponse, status_code=201)
def fav_freelancer(freelancer_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return add_freelancer(freelancer_id, current_user, db)


@favorites_router.delete("/freelancer/{freelancer_id}", status_code=204)
def unfav_freelancer(freelancer_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    remove_freelancer(freelancer_id, current_user, db)
