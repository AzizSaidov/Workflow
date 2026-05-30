from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from reviews.schemas import ReviewCreate, ReviewResponse
from reviews.views import create_review, get_user_reviews
from users.permissions import get_current_user
from users.models import User

reviews_router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@reviews_router.post("/", response_model=ReviewResponse, status_code=201)
def post_review(data: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_review(data, current_user, db)


@reviews_router.get("/user/{user_id}", response_model=list[ReviewResponse])
def user_reviews(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_user_reviews(user_id, db)
