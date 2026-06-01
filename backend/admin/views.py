from uuid import UUID
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from users.models import User
from reports.models import Report, ReportStatus
from escrow.models import Transaction, EscrowStatus
from projects.models import Project, ProjectStatus
from wallet.models import Wallet
from notifications.models import NotificationType
from notifications.views import create_notification
from utils import get_dushanbe_time


def get_all_reports(db: Session) -> list[Report]:
    return db.query(Report).order_by(Report.created_at.desc()).all()


def resolve_report(report_id: UUID, db: Session) -> Report:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    report.status = ReportStatus.resolved
    db.commit()
    db.refresh(report)
    return report


def get_all_disputes(db: Session) -> list[Transaction]:
    return db.query(Transaction).filter(Transaction.status == EscrowStatus.disputed).order_by(Transaction.created_at.desc()).all()


def admin_release(tx_id: UUID, db: Session) -> Transaction:
    import os
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.status == EscrowStatus.disputed).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disputed transaction not found")

    commission_rate = Decimal(os.getenv("PLATFORM_COMMISSION_RATE", "0.01"))
    platform_fee = (tx.amount * commission_rate).quantize(Decimal("0.01"))
    freelancer_payout = tx.amount - platform_fee

    client_wallet = db.query(Wallet).filter(Wallet.user_id == tx.client_id).first()
    freelancer_wallet = db.query(Wallet).filter(Wallet.user_id == tx.freelancer_id).first()
    if not freelancer_wallet:
        freelancer_wallet = Wallet(user_id=tx.freelancer_id)
        db.add(freelancer_wallet)

    client_wallet.frozen = client_wallet.frozen - tx.amount
    freelancer_wallet.balance = freelancer_wallet.balance + freelancer_payout
    tx.status = EscrowStatus.released
    tx.released_at = get_dushanbe_time()

    project = db.query(Project).filter(Project.id == tx.project_id).first()
    if project:
        project.status = ProjectStatus.completed

    create_notification(user_id=tx.freelancer_id, type=NotificationType.payment_received,
                        title="Спор разрешён", message=f"Администратор выплатил вам {freelancer_payout}", db=db)
    create_notification(user_id=tx.client_id, type=NotificationType.project_disputed,
                        title="Спор разрешён", message="Администратор выплатил средства фрилансеру", db=db)
    db.commit()
    db.refresh(tx)
    return tx


def admin_refund(tx_id: UUID, db: Session) -> Transaction:
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.status == EscrowStatus.disputed).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disputed transaction not found")

    client_wallet = db.query(Wallet).filter(Wallet.user_id == tx.client_id).first()
    client_wallet.frozen = client_wallet.frozen - tx.amount
    client_wallet.balance = client_wallet.balance + tx.amount
    tx.status = EscrowStatus.refunded

    project = db.query(Project).filter(Project.id == tx.project_id).first()
    if project:
        project.status = ProjectStatus.cancelled

    create_notification(user_id=tx.client_id, type=NotificationType.payment_received,
                        title="Спор разрешён", message=f"Администратор вернул вам {tx.amount}", db=db)
    db.commit()
    db.refresh(tx)
    return tx


def get_all_users(db: Session) -> list[dict]:
    from profiles.models import FreelancerProfile
    from client_profiles.models import ClientProfile
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        fp = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == u.id).first()
        cp = db.query(ClientProfile).filter(ClientProfile.user_id == u.id).first()
        is_verified = bool((fp and fp.is_verified) or (cp and cp.is_verified))
        d = {c.key: getattr(u, c.key) for c in u.__table__.columns}
        d["is_verified"] = is_verified
        result.append(d)
    return result


def ban_user(user_id: UUID, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_banned = True
    db.commit()
    db.refresh(user)
    return user


def unban_user(user_id: UUID, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_banned = False
    db.commit()
    db.refresh(user)
    return user


def change_user_role(user_id: UUID, new_role: str, db: Session) -> User:
    from users.models import UserRole
    if new_role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {new_role}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = UserRole(new_role)
    db.commit()
    db.refresh(user)
    return user


def verify_user(user_id: UUID, db: Session) -> User:
    from profiles.models import FreelancerProfile
    from client_profiles.models import ClientProfile
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == user_id).first()
    if profile:
        profile.is_verified = True
    client_profile = db.query(ClientProfile).filter(ClientProfile.user_id == user_id).first()
    if client_profile:
        client_profile.is_verified = True
    db.commit()
    db.refresh(user)
    return user


def topup_wallet(user_id: UUID, amount: Decimal, reason: str, admin: User, db: Session) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id)
        db.add(wallet)
        db.flush()
    wallet.balance = wallet.balance + amount
    create_notification(user_id=user_id, type=NotificationType.payment_received,
                        title="Баланс пополнен", message=f"Администратор пополнил ваш баланс на {amount}. Причина: {reason}", db=db)
    db.commit()
    db.refresh(wallet)
    return wallet


def get_platform_stats(db: Session) -> dict:
    from projects.models import ProjectStatus
    from escrow.models import EscrowStatus
    from sqlalchemy import func
    total_users = db.query(User).count()
    total_projects = db.query(Project).count()
    completed_projects = db.query(Project).filter(Project.status == ProjectStatus.completed).count()
    active_disputes = db.query(Transaction).filter(Transaction.status == EscrowStatus.disputed).count()
    total_released = db.query(func.sum(Transaction.amount)).filter(Transaction.status == EscrowStatus.released).scalar() or 0
    return {
        "total_users": total_users,
        "total_projects": total_projects,
        "completed_projects": completed_projects,
        "active_disputes": active_disputes,
        "total_released": float(total_released),
    }
