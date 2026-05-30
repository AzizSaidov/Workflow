from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from projects.models import Project, ProjectStatus
from profiles.models import FreelancerProfile
from users.models import User, UserRole
from bids.models import Bid


def search_projects(
    db: Session,
    q: str | None,
    category: str | None,
    budget_min: float | None,
    budget_max: float | None,
    deadline: str | None,
    sort_by: str | None,
) -> list[Project]:
    query = db.query(Project).filter(Project.status == ProjectStatus.open)

    if q:
        query = query.filter(
            or_(Project.title.ilike(f"%{q}%"), Project.description.ilike(f"%{q}%"))
        )
    if category:
        query = query.filter(Project.category.ilike(f"%{category}%"))
    if budget_min is not None:
        query = query.filter(Project.budget_max >= budget_min)
    if budget_max is not None:
        query = query.filter(Project.budget_min <= budget_max)
    if deadline:
        query = query.filter(Project.deadline <= deadline)

    if sort_by == "budget":
        query = query.order_by(Project.budget_max.desc())
    elif sort_by == "bids":
        bid_count = (
            db.query(func.count(Bid.id))
            .filter(Bid.project_id == Project.id)
            .correlate(Project)
            .scalar_subquery()
        )
        query = query.order_by(bid_count.desc())
    else:
        query = query.order_by(Project.created_at.desc())

    return query.all()


def search_freelancers(
    db: Session,
    q: str | None,
    skills: str | None,
    min_rate: float | None,
    max_rate: float | None,
    min_rating: float | None,
) -> list[FreelancerProfile]:
    query = db.query(FreelancerProfile).join(User, User.id == FreelancerProfile.user_id)

    if q:
        query = query.filter(User.full_name.ilike(f"%{q}%"))
    if skills:
        for skill in (s.strip() for s in skills.split(",") if s.strip()):
            query = query.filter(
                func.array_to_string(FreelancerProfile.skills, ",").ilike(f"%{skill}%")
            )
    if min_rate is not None:
        query = query.filter(FreelancerProfile.hourly_rate >= min_rate)
    if max_rate is not None:
        query = query.filter(FreelancerProfile.hourly_rate <= max_rate)
    if min_rating is not None:
        query = query.filter(FreelancerProfile.rating >= min_rating)

    return query.order_by(FreelancerProfile.rating.desc()).all()
