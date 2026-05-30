from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from projects.models import Project, ProjectStatus
from projects.schemas import ProjectCreate, ProjectUpdate
from users.models import User, UserRole


def get_projects(
    db: Session,
    category: str | None,
    budget_min: float | None,
    budget_max: float | None,
    search: str | None,
) -> list[Project]:
    q = db.query(Project).filter(Project.status == ProjectStatus.open)
    if category:
        q = q.filter(Project.category == category)
    if budget_min is not None:
        q = q.filter(Project.budget_max >= budget_min)
    if budget_max is not None:
        q = q.filter(Project.budget_min <= budget_max)
    if search:
        q = q.filter(or_(
            Project.title.ilike(f"%{search}%"),
            Project.description.ilike(f"%{search}%"),
        ))
    return q.order_by(Project.created_at.desc()).all()


def create_project(data: ProjectCreate, client: User, db: Session) -> Project:
    if client.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can create projects")
    project = Project(client_id=client.id, **data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_my_projects(client: User, db: Session) -> list[Project]:
    return db.query(Project).filter(Project.client_id == client.id).order_by(Project.created_at.desc()).all()


def get_project(project_id: UUID, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def update_project(project_id: UUID, data: ProjectUpdate, current_user: User, db: Session) -> Project:
    project = get_project(project_id, db)
    if project.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(project_id: UUID, current_user: User, db: Session) -> None:
    project = get_project(project_id, db)
    if project.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")
    db.delete(project)
    db.commit()
