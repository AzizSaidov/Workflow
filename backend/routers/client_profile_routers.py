from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from client_profiles.schemas import ClientProfileUpdate, ClientProfileResponse
from client_profiles.views import get_client_profile, update_my_client_profile, get_client_projects
from users.permissions import get_current_user, get_optional_user
from users.models import User
from projects.schemas import ProjectResponse

client_profiles_router = APIRouter(prefix="/api/client-profiles", tags=["client-profiles"])


@client_profiles_router.get("/{user_id}", response_model=ClientProfileResponse)
def get_profile(user_id: UUID, db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    return get_client_profile(user_id, db)


@client_profiles_router.get("/{user_id}/projects", response_model=list[ProjectResponse])
def client_projects(user_id: UUID, db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    return get_client_projects(user_id, db)


@client_profiles_router.put("/me", response_model=ClientProfileResponse)
def update_profile(data: ClientProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_my_client_profile(data, current_user, db)
