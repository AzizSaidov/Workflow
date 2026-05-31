from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from certifications.models import Certification
from certifications.schemas import CertificationCreate, CertificationUpdate
from profiles.models import FreelancerProfile
from users.models import User, UserRole


def _get_my_profile(user: User, db: Session) -> FreelancerProfile:
    if user.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers have certifications")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


def get_profile_certifications(profile_id: UUID, db: Session) -> list[Certification]:
    return db.query(Certification).filter(Certification.profile_id == profile_id).all()


def create_certification(data: CertificationCreate, current_user: User, db: Session) -> Certification:
    profile = _get_my_profile(current_user, db)
    cert = Certification(profile_id=profile.id, **data.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


def update_certification(cert_id: UUID, data: CertificationUpdate, current_user: User, db: Session) -> Certification:
    profile = _get_my_profile(current_user, db)
    cert = db.query(Certification).filter(Certification.id == cert_id, Certification.profile_id == profile.id).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cert, field, value)
    db.commit()
    db.refresh(cert)
    return cert


def delete_certification(cert_id: UUID, current_user: User, db: Session) -> None:
    profile = _get_my_profile(current_user, db)
    cert = db.query(Certification).filter(Certification.id == cert_id, Certification.profile_id == profile.id).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")
    db.delete(cert)
    db.commit()
