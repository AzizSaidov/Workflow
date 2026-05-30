from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from profiles.models import FreelancerProfile
from profiles.schemas import ProfileUpdate
from users.models import User, UserRole


def get_profile(user_id: UUID, db: Session) -> FreelancerProfile:
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


def update_my_profile(data: ProfileUpdate, current_user: User, db: Session) -> FreelancerProfile:
    if current_user.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers have profiles")

    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == current_user.id).first()
    if not profile:
        profile = FreelancerProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile
