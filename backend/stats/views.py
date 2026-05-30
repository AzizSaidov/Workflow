from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from users.models import User, UserRole
from projects.models import Project, ProjectStatus
from escrow.models import Transaction, EscrowStatus
from bids.models import Bid
from profiles.models import FreelancerProfile
from stats.schemas import GlobalStats, UserLocation, UserStats


def get_global_stats(db: Session) -> GlobalStats:
    total_freelancers = db.query(func.count(User.id)).filter(User.role == UserRole.freelancer).scalar() or 0
    total_clients = db.query(func.count(User.id)).filter(User.role == UserRole.client).scalar() or 0
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    completed_projects = db.query(func.count(Project.id)).filter(Project.status == ProjectStatus.completed).scalar() or 0
    total_paid_out = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.status == EscrowStatus.released
    ).scalar() or Decimal(0)

    return GlobalStats(
        total_freelancers=total_freelancers,
        total_clients=total_clients,
        total_projects=total_projects,
        completed_projects=completed_projects,
        total_paid_out=Decimal(str(total_paid_out)),
    )


def get_my_stats(user: User, db: Session) -> UserStats:
    active_statuses = (ProjectStatus.in_progress, ProjectStatus.delivered, ProjectStatus.disputed)

    if user.role == UserRole.client:
        total_projects = db.query(func.count(Project.id)).filter(Project.client_id == user.id).scalar() or 0
        active_projects = db.query(func.count(Project.id)).filter(
            Project.client_id == user.id, Project.status.in_(active_statuses)
        ).scalar() or 0
        completed_projects = db.query(func.count(Project.id)).filter(
            Project.client_id == user.id, Project.status == ProjectStatus.completed
        ).scalar() or 0
        total_spent = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.client_id == user.id, Transaction.status == EscrowStatus.released
        ).scalar() or Decimal(0)
        return UserStats(
            role=user.role,
            active_projects=active_projects,
            completed_projects=completed_projects,
            total_projects=total_projects,
            total_spent=Decimal(str(total_spent)),
        )

    # freelancer
    total_bids = db.query(func.count(Bid.id)).filter(Bid.freelancer_id == user.id).scalar() or 0
    active_projects = db.query(func.count(Project.id)).filter(
        Project.assigned_freelancer_id == user.id, Project.status.in_(active_statuses)
    ).scalar() or 0
    completed_projects = db.query(func.count(Project.id)).filter(
        Project.assigned_freelancer_id == user.id, Project.status == ProjectStatus.completed
    ).scalar() or 0
    total_earned = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.freelancer_id == user.id, Transaction.status == EscrowStatus.released
    ).scalar() or Decimal(0)
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == user.id).first()
    average_rating = Decimal(str(profile.rating)) if profile else Decimal(0)
    return UserStats(
        role=user.role,
        active_projects=active_projects,
        completed_projects=completed_projects,
        total_bids=total_bids,
        total_earned=Decimal(str(total_earned)),
        average_rating=average_rating,
    )


def get_user_locations(db: Session) -> list[UserLocation]:
    users = (
        db.query(User)
        .filter(User.latitude.isnot(None), User.longitude.isnot(None))
        .all()
    )
    return [UserLocation(lat=u.latitude, lng=u.longitude, role=u.role) for u in users]
