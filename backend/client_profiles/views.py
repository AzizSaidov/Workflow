from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from client_profiles.models import ClientProfile
from client_profiles.schemas import ClientProfileUpdate
from users.models import User, UserRole


def get_client_profile(user_id: UUID, db: Session) -> ClientProfile:
    profile = db.query(ClientProfile).filter(ClientProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client profile not found")
    return profile


def update_my_client_profile(data: ClientProfileUpdate, current_user: User, db: Session) -> ClientProfile:
    if current_user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients have client profiles")
    profile = db.query(ClientProfile).filter(ClientProfile.user_id == current_user.id).first()
    if not profile:
        profile = ClientProfile(user_id=current_user.id)
        db.add(profile)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
