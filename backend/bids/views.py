from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from bids.models import Bid, BidStatus
from bids.schemas import BidCreate
from projects.models import Project, ProjectStatus
from users.models import User, UserRole
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
    return bid


def get_project_bids(project_id: UUID, current_user: User, db: Session) -> list[Bid]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")
    return db.query(Bid).filter(Bid.project_id == project_id).order_by(Bid.created_at.desc()).all()


def get_my_bids(freelancer: User, db: Session) -> list[Bid]:
    return db.query(Bid).filter(Bid.freelancer_id == freelancer.id).order_by(Bid.created_at.desc()).all()


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
