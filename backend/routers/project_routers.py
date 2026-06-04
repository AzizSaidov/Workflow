from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from projects.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, DeliverySubmit, ClientFeedback, ProgressUpdate
from projects.views import (
    get_projects, create_project, get_my_projects, get_project,
    update_project, delete_project, deliver_project, request_revision,
    accept_delivery, get_featured_projects, get_projects_by_category, open_dispute,
    update_project_progress,
)
from media.views import get_project_files
from users.permissions import get_current_user, get_optional_user
from users.models import User
from achievements.views import check_and_grant
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


@projects_router.get("/featured", response_model=list[ProjectResponse])
def featured(db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    return get_featured_projects(db)


@projects_router.get("/my", response_model=list[ProjectResponse])
def my_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_projects(current_user, db)


@projects_router.get("/by-category/{slug}", response_model=list[ProjectResponse])
def by_category(slug: str, db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    return get_projects_by_category(slug, db)


@projects_router.get("/", response_model=list[ProjectResponse])
def list_projects(
    category: str | None = Query(default=None),
    category_id: UUID | None = Query(default=None),
    budget_min: float | None = Query(default=None),
    budget_max: float | None = Query(default=None),
    project_type: str | None = Query(default=None),
    experience_level: str | None = Query(default=None),
    skill_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User | None = Depends(get_optional_user),
):
    return get_projects(db, category, category_id, budget_min, budget_max, project_type, experience_level, skill_id, search)


@projects_router.post("/", response_model=ProjectResponse, status_code=201)
def create(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_project(data, current_user, db)


@projects_router.get("/{project_id}", response_model=ProjectResponse)
def project_detail(project_id: UUID, db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    return get_project(project_id, db)


@projects_router.put("/{project_id}", response_model=ProjectResponse)
def update(project_id: UUID, data: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_project(project_id, data, current_user, db)


@projects_router.delete("/{project_id}", status_code=204)
def delete(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_project(project_id, current_user, db)


@projects_router.put("/{project_id}/deliver", response_model=ProjectResponse)
def deliver(project_id: UUID, data: DeliverySubmit, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return deliver_project(project_id, data, current_user, db)


@projects_router.put("/{project_id}/revision", response_model=ProjectResponse)
def revision(project_id: UUID, data: ClientFeedback, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return request_revision(project_id, data, current_user, db)


@projects_router.put("/{project_id}/accept-delivery", response_model=ProjectResponse)
def accept(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = accept_delivery(project_id, current_user, db)
    check_and_grant(current_user, db)
    if project.assigned_freelancer_id:
        freelancer = db.query(User).filter(User.id == project.assigned_freelancer_id).first()
        if freelancer:
            check_and_grant(freelancer, db)
    return project


@projects_router.patch("/{project_id}/progress", response_model=ProjectResponse)
def progress(project_id: UUID, data: ProgressUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_project_progress(project_id, data, current_user, db)


@projects_router.post("/{project_id}/dispute", response_model=ProjectResponse)
def dispute(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return open_dispute(project_id, current_user, db)


@projects_router.get("/{project_id}/files", response_model=list[ProjectFileResponse])
def files(project_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_project_files(project_id, db)
