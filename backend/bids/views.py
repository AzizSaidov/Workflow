from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from bids.models import Bid, BidStatus
from bids.schemas import BidCreate
from projects.models import Project, ProjectStatus
from users.models import User, UserRole
from profiles.models import FreelancerProfile
from notifications.models import NotificationType
from notifications.views import create_notification


def create_bid(project_id: UUID, data: BidCreate, freelancer: User, db: Session) -> Bid:
    if freelancer.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers can bid")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.status != ProjectStatus.open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project is not open for bids")
    if float(data.price) <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ставка должна быть больше нуля")
    if float(data.price) < float(project.budget_min):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ставка не может быть ниже минимального бюджета (${project.budget_min})")
    if float(data.price) > float(project.budget_max):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ставка не может превышать максимальный бюджет (${project.budget_max})")
    existing = db.query(Bid).filter(Bid.project_id == project_id, Bid.freelancer_id == freelancer.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already bid on this project")
    bid = Bid(project_id=project_id, freelancer_id=freelancer.id, **data.model_dump())
    db.add(bid)
    create_notification(
        user_id=project.client_id,
        type=NotificationType.new_bid,
        title="Новая заявка",
        message=f"{freelancer.full_name} подал заявку на проект «{project.title}»",
        db=db,
    )
    db.commit()
    db.refresh(bid)
    from achievements.views import check_and_grant
    check_and_grant(freelancer, db)
    return bid


def get_project_bids(project_id: UUID, current_user: User, db: Session) -> list[dict]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")
    bids = db.query(Bid).filter(Bid.project_id == project_id).order_by(Bid.created_at.desc()).all()
    result = []
    for bid in bids:
        freelancer = db.query(User).filter(User.id == bid.freelancer_id).first()
        fp = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == bid.freelancer_id).first()
        result.append({
            "id": bid.id, "project_id": bid.project_id, "freelancer_id": bid.freelancer_id,
            "price": bid.price, "cover_letter": bid.cover_letter,
            "status": bid.status, "created_at": bid.created_at,
            "freelancer_name": freelancer.full_name if freelancer else None,
            "freelancer_avatar": freelancer.avatar_url if freelancer else None,
            "rating": float(fp.rating) if fp and fp.rating else None,
            "reviews_count": fp.total_jobs if fp else 0,
        })
    return result


def get_my_bids(freelancer: User, db: Session) -> list[dict]:
    bids = db.query(Bid).filter(Bid.freelancer_id == freelancer.id).order_by(Bid.created_at.desc()).all()
    result = []
    for bid in bids:
        project = db.query(Project).filter(Project.id == bid.project_id).first()
        result.append({
            "id": bid.id, "project_id": bid.project_id, "freelancer_id": bid.freelancer_id,
            "price": bid.price, "cover_letter": bid.cover_letter,
            "status": bid.status, "created_at": bid.created_at,
            "project_title": project.title if project else None,
        })
    return result


def accept_bid(bid_id: UUID, current_user: User, db: Session) -> Bid:
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bid not found")
    project = db.query(Project).filter(Project.id == bid.project_id).first()
    if project.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")
    if project.status != ProjectStatus.open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project is not open")
    bid.status = BidStatus.accepted
    project.assigned_freelancer_id = bid.freelancer_id
    db.query(Bid).filter(
        Bid.project_id == bid.project_id,
        Bid.id != bid_id,
        Bid.status == BidStatus.pending,
    ).update({"status": BidStatus.rejected})

    from contracts.models import Contract
    contract = Contract(
        project_id=project.id,
        client_id=current_user.id,
        freelancer_id=bid.freelancer_id,
        bid_id=bid.id,
        amount=bid.price,
        deadline=project.deadline,
    )
    db.add(contract)

    create_notification(
        user_id=bid.freelancer_id,
        type=NotificationType.bid_accepted,
        title="Заявка принята",
        message=f"Ваша заявка на проект «{project.title}» принята!",
        db=db,
    )
    db.commit()
    db.refresh(bid)
    return bid


def get_my_bid_for_project(project_id: UUID, user: User, db: Session):
    return db.query(Bid).filter(Bid.project_id == project_id, Bid.freelancer_id == user.id).first()


def reject_bid(bid_id: UUID, current_user: User, db: Session) -> Bid:
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bid not found")
    project = db.query(Project).filter(Project.id == bid.project_id).first()
    if project.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")
    bid.status = BidStatus.rejected
    db.commit()
    db.refresh(bid)
    return bid
