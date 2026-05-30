from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from projects.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from projects.views import get_projects, create_project, get_my_projects, get_project, update_project, delete_project, deliver_project
from media.views import get_project_files
from users.permissions import get_current_user
from users.models import User
from pydantic import BaseModel


class ProjectFileResponse(BaseModel):
    id: UUID
    project_id: UUID
    uploader_id: UUID
    original_name: str
    stored_name: str
    file_type: str

    model_config = {"from_attributes": True}


projects_router = APIRouter(prefix="/api/projects", tags=["projects"])


@projects_router.get("/", response_model=list[ProjectResponse])
def list_projects(
    category: str | None = Query(default=None),
    budget_min: float | None = Query(default=None),
    budget_max: float | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_projects(db, category, budget_min, budget_max, search)


@projects_router.post("/", response_model=ProjectResponse, status_code=201)
def create(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_project(data, current_user, db)


@projects_router.get("/my", response_model=list[ProjectResponse])
def my_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_projects(current_user, db)


@projects_router.get("/{project_id}", response_model=ProjectResponse)
def project_detail(project_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_project(project_id, db)


@projects_router.put("/{project_id}", response_model=ProjectResponse)
def update(project_id: UUID, data: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_project(project_id, data, current_user, db)


@projects_router.delete("/{project_id}", status_code=204)
def delete(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_project(project_id, current_user, db)


@projects_router.put("/{project_id}/deliver", response_model=ProjectResponse)
def deliver(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return deliver_project(project_id, current_user, db)


@projects_router.get("/{project_id}/files", response_model=list[ProjectFileResponse])
def files(project_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_project_files(project_id, db)
