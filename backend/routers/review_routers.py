from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from reviews.schemas import ReviewCreate, ReviewResponse
from reviews.views import create_review, get_user_reviews
from users.permissions import get_current_user, get_optional_user
from users.models import User
from achievements.views import check_and_grant

reviews_router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@reviews_router.post("/", response_model=ReviewResponse, status_code=201)
def post_review(data: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = create_review(data, current_user, db)
    check_and_grant(current_user, db)
    reviewee = db.query(User).filter(User.id == data.reviewee_id).first()
    if reviewee:
        check_and_grant(reviewee, db)
    return review


@reviews_router.get("/user/{user_id}", response_model=list[ReviewResponse])
def user_reviews(user_id: UUID, db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    return get_user_reviews(user_id, db)
