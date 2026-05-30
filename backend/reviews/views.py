from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from reviews.models import Review
from reviews.schemas import ReviewCreate
from projects.models import Project, ProjectStatus
from profiles.models import FreelancerProfile
from users.models import User, UserRole


def create_review(data: ReviewCreate, reviewer: User, db: Session) -> Review:
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.status != ProjectStatus.completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project must be completed to leave a review")

    participants = {project.client_id, project.assigned_freelancer_id}
    if reviewer.id not in participants:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant of this project")
    if data.reviewee_id not in participants:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reviewee is not a project participant")
    if data.reviewee_id == reviewer.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot review yourself")

    existing = db.query(Review).filter(
        Review.project_id == data.project_id,
        Review.reviewer_id == reviewer.id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already reviewed this project")

    review = Review(
        project_id=data.project_id,
        reviewer_id=reviewer.id,
        reviewee_id=data.reviewee_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.flush()

    # update freelancer profile rating
    reviewee = db.query(User).filter(User.id == data.reviewee_id).first()
    if reviewee and reviewee.role == UserRole.freelancer:
        profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == data.reviewee_id).first()
        if profile:
            avg = db.query(func.avg(Review.rating)).filter(Review.reviewee_id == data.reviewee_id).scalar()
            count = db.query(func.count(Review.id)).filter(Review.reviewee_id == data.reviewee_id).scalar()
            profile.rating = round(float(avg), 2)
            profile.total_jobs = count

    db.commit()
    db.refresh(review)
    return review


def get_user_reviews(user_id: UUID, db: Session) -> list[Review]:
    return (
        db.query(Review)
        .filter(Review.reviewee_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )
