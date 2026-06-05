from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from escrow.models import Transaction, EscrowStatus
from escrow.schemas import EscrowFreezeRequest
from wallet.models import Wallet
from bids.models import Bid, BidStatus
from projects.models import Project, ProjectStatus
from users.models import User
from notifications.models import NotificationType
from notifications.views import create_notification
from utils import get_dushanbe_time


def _get_wallet(user_id: UUID, db: Session) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wallet not found — deposit first")
    return wallet


def freeze(data: EscrowFreezeRequest, client: User, db: Session) -> Transaction:
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")
    if project.status != ProjectStatus.open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project is not in open status")
    if not project.assigned_freelancer_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No freelancer assigned — accept a bid first")

    bid = (
        db.query(Bid)
        .filter(
            Bid.project_id == project.id,
            Bid.freelancer_id == project.assigned_freelancer_id,
            Bid.status == BidStatus.accepted,
        )
        .first()
    )
    if not bid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Accepted bid not found")

    client_wallet = _get_wallet(client.id, db)
    if client_wallet.balance < bid.price:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")

    client_wallet.balance = client_wallet.balance - bid.price
    client_wallet.frozen = client_wallet.frozen + bid.price
    project.status = ProjectStatus.in_progress

    tx = Transaction(
        project_id=project.id,
        client_id=client.id,
        freelancer_id=project.assigned_freelancer_id,
        amount=bid.price,
        status=EscrowStatus.frozen,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def release(tx_id: UUID, client: User, db: Session) -> Transaction:
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if tx.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your transaction")
    if tx.status != EscrowStatus.frozen:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction is not frozen")

    project = db.query(Project).filter(Project.id == tx.project_id).first()
    if project.status != ProjectStatus.delivered:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Freelancer has not delivered yet")

    client_wallet = _get_wallet(tx.client_id, db)
    freelancer_wallet = db.query(Wallet).filter(Wallet.user_id == tx.freelancer_id).first()
    if not freelancer_wallet:
        freelancer_wallet = Wallet(user_id=tx.freelancer_id)
        db.add(freelancer_wallet)

    import os
    from decimal import Decimal
    commission_rate = Decimal(os.getenv("PLATFORM_COMMISSION_RATE", "0.01"))
    platform_fee = (tx.amount * commission_rate).quantize(Decimal("0.01"))
    freelancer_payout = tx.amount - platform_fee

    client_wallet.frozen = client_wallet.frozen - tx.amount
    freelancer_wallet.balance = freelancer_wallet.balance + freelancer_payout
    tx.status = EscrowStatus.released
    tx.released_at = get_dushanbe_time()
    project.status = ProjectStatus.completed

    # держим total_jobs согласованным с accept_delivery (C2 в ТЗ)
    from profiles.models import FreelancerProfile
    fp = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == tx.freelancer_id).first()
    if fp:
        fp.total_jobs = (fp.total_jobs or 0) + 1

    create_notification(
        user_id=tx.freelancer_id,
        type=NotificationType.payment_received,
        title="Оплата получена",
        message=f"Вам выплачено {freelancer_payout} за проект «{project.title}» (комиссия: {platform_fee})",
        db=db,
    )
    db.commit()
    db.refresh(tx)
    from achievements.views import check_and_grant
    from users.models import User as UserModel
    freelancer_user = db.query(UserModel).filter(UserModel.id == tx.freelancer_id).first()
    client_user = db.query(UserModel).filter(UserModel.id == tx.client_id).first()
    if freelancer_user:
        check_and_grant(freelancer_user, db)
    if client_user:
        check_and_grant(client_user, db)
    return tx


def dispute(tx_id: UUID, client: User, db: Session) -> Transaction:
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if tx.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your transaction")
    if tx.status != EscrowStatus.frozen:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only dispute a frozen transaction")

    project = db.query(Project).filter(Project.id == tx.project_id).first()
    tx.status = EscrowStatus.disputed
    project.status = ProjectStatus.disputed

    create_notification(
        user_id=tx.freelancer_id,
        type=NotificationType.project_disputed,
        title="Открыт спор",
        message=f"Заказчик открыл спор по проекту «{project.title}»",
        db=db,
    )
    db.commit()
    db.refresh(tx)
    return tx


def refund(tx_id: UUID, client: User, db: Session) -> Transaction:
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if tx.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your transaction")
    if tx.status not in (EscrowStatus.frozen, EscrowStatus.disputed):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction cannot be refunded")

    client_wallet = _get_wallet(tx.client_id, db)
    project = db.query(Project).filter(Project.id == tx.project_id).first()

    client_wallet.frozen = client_wallet.frozen - tx.amount
    client_wallet.balance = client_wallet.balance + tx.amount
    tx.status = EscrowStatus.refunded
    project.status = ProjectStatus.cancelled

    db.commit()
    db.refresh(tx)
    return tx
