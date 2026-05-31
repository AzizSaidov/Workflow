from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from projects.models import Project, ProjectStatus, ProjectSkill
from projects.schemas import ProjectCreate, ProjectUpdate, DeliverySubmit, ClientFeedback
from users.models import User, UserRole
from notifications.models import NotificationType
from notifications.views import create_notification
from utils import get_dushanbe_time


def get_projects(
    db: Session,
    category: str | None = None,
    category_id: UUID | None = None,
    budget_min: float | None = None,
    budget_max: float | None = None,
    project_type: str | None = None,
    experience_level: str | None = None,
    skill_id: UUID | None = None,
    search: str | None = None,
) -> list[Project]:
    q = db.query(Project).filter(Project.status == ProjectStatus.open)
    if category:
        q = q.filter(Project.category == category)
    if category_id:
        q = q.filter(Project.category_id == category_id)
    if budget_min is not None:
        q = q.filter(Project.budget_max >= budget_min)
    if budget_max is not None:
        q = q.filter(Project.budget_min <= budget_max)
    if project_type:
        q = q.filter(Project.project_type == project_type)
    if experience_level:
        q = q.filter(Project.experience_level == experience_level)
    if skill_id:
        project_ids = [ps.project_id for ps in db.query(ProjectSkill).filter(ProjectSkill.skill_id == skill_id).all()]
        q = q.filter(Project.id.in_(project_ids))
    if search:
        q = q.filter(or_(Project.title.ilike(f"%{search}%"), Project.description.ilike(f"%{search}%")))
    return q.order_by(Project.created_at.desc()).all()


def get_featured_projects(db: Session) -> list[Project]:
    return db.query(Project).filter(Project.is_featured == True, Project.status == ProjectStatus.open).order_by(Project.created_at.desc()).all()


def get_projects_by_category(slug: str, db: Session) -> list[Project]:
    from categories.models import Category
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return db.query(Project).filter(Project.category_id == category.id, Project.status == ProjectStatus.open).order_by(Project.created_at.desc()).all()


def create_project(data: ProjectCreate, client: User, db: Session) -> Project:
    if client.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can create projects")
    skill_ids = data.skill_ids
    project_data = data.model_dump(exclude={"skill_ids"})
    project = Project(client_id=client.id, **project_data)
    db.add(project)
    db.flush()
    for sid in skill_ids:
        db.add(ProjectSkill(project_id=project.id, skill_id=sid))
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


def deliver_project(project_id: UUID, data: DeliverySubmit, freelancer: User, db: Session) -> Project:
    project = get_project(project_id, db)
    if project.assigned_freelancer_id != freelancer.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this project")
    if project.status != ProjectStatus.in_progress:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project is not in progress")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    project.delivery_submitted_at = get_dushanbe_time()
    project.status = ProjectStatus.delivered
    create_notification(
        user_id=project.client_id,
        type=NotificationType.project_delivered,
        title="Работа сдана",
        message=f"Фрилансер сдал работу по проекту «{project.title}»",
        db=db,
    )
    db.commit()
    db.refresh(project)
    return project


def request_revision(project_id: UUID, data: ClientFeedback, client: User, db: Session) -> Project:
    project = get_project(project_id, db)
    if project.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")
    if project.status != ProjectStatus.delivered:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project is not in delivered status")
    project.client_feedback = data.client_feedback
    db.commit()
    db.refresh(project)
    return project
