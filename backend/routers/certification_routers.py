from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from certifications.schemas import CertificationCreate, CertificationUpdate, CertificationResponse
from certifications.views import get_profile_certifications, create_certification, update_certification, delete_certification
from users.permissions import get_current_user
from users.models import User

certifications_router = APIRouter(prefix="/api/certifications", tags=["certifications"])


@certifications_router.get("/profile/{profile_id}", response_model=list[CertificationResponse])
def list_certifications(profile_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_profile_certifications(profile_id, db)


@certifications_router.post("/", response_model=CertificationResponse, status_code=201)
def add_certification(data: CertificationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_certification(data, current_user, db)


@certifications_router.put("/{cert_id}", response_model=CertificationResponse)
def edit_certification(cert_id: UUID, data: CertificationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_certification(cert_id, data, current_user, db)


@certifications_router.delete("/{cert_id}", status_code=204)
def remove_certification(cert_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_certification(cert_id, current_user, db)
