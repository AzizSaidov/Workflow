import os
import redis as redis_lib
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from users.models import User, UserRole
from projects.models import Project, ProjectStatus
from escrow.models import Transaction, EscrowStatus
from bids.models import Bid
from profiles.models import FreelancerProfile
from stats.schemas import GlobalStats, UserLocation, UserStats, TopFreelancerResponse, CategoryStats

_redis = redis_lib.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)


def get_online_count() -> int:
    try:
        return len(_redis.keys("online:*"))
    except Exception:
        return 0


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
    commission_rate = Decimal(os.getenv("PLATFORM_COMMISSION_RATE", "0.01"))
    total_earned_raw = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.freelancer_id == user.id, Transaction.status == EscrowStatus.released
    ).scalar() or Decimal(0)
    total_earned = Decimal(str(total_earned_raw)) * (1 - commission_rate)
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


def get_top_freelancers(db: Session) -> list[TopFreelancerResponse]:
    rows = (
        db.query(FreelancerProfile, User)
        .join(User, User.id == FreelancerProfile.user_id)
        .filter(FreelancerProfile.rating > 0)
        .order_by(
            (FreelancerProfile.rating * func.ln(func.greatest(FreelancerProfile.total_jobs, 0) + 2)).desc()
        )
        .limit(10)
        .all()
    )
    return [
        TopFreelancerResponse(
            user_id=profile.user_id,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            rating=Decimal(str(profile.rating)),
            total_jobs=profile.total_jobs,
            is_online=bool(_redis.exists(f"online:{profile.user_id}")),
        )
        for profile, user in rows
    ]


def get_recent_projects(db: Session) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.status == ProjectStatus.open)
        .order_by(Project.created_at.desc())
        .limit(10)
        .all()
    )


def get_category_stats(db: Session) -> list[CategoryStats]:
    rows = (
        db.query(Project.category, func.count(Project.id).label("count"))
        .group_by(Project.category)
        .order_by(func.count(Project.id).desc())
        .all()
    )
    return [CategoryStats(category=row.category, count=row.count) for row in rows]


def get_user_locations(db: Session) -> list[UserLocation]:
    users = (
        db.query(User)
        .filter(User.latitude.isnot(None), User.longitude.isnot(None))
        .all()
    )
    return [UserLocation(lat=u.latitude, lng=u.longitude, role=u.role) for u in users]
