import os
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
from admin.models import AdminAuditLog


def log_admin_action(admin, action, db, target_type=None, target_id=None, target_name=None, detail=None):
    """Записать действие админа в журнал. Коммит — на стороне вызывающего (роутера)."""
    db.add(AdminAuditLog(
        admin_id=admin.id,
        admin_name=getattr(admin, "full_name", None),
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_name=target_name,
        detail=detail,
    ))


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
    if user.is_admin or user.role.value == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя заблокировать администратора")
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


def grant_admin(user_id: UUID, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user


def revoke_admin(user_id: UUID, db: Session) -> User:
    from sqlalchemy import or_
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    admin_count = db.query(User).filter(
        or_(User.is_admin == True, User.role == "admin")
    ).count()
    if admin_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя снять последнего администратора"
        )
    user.is_admin = False
    if user.role.value == "admin":
        from users.models import UserRole
        user.role = UserRole.client
    db.commit()
    db.refresh(user)
    return user


def change_user_role(user_id: UUID, new_role: str, db: Session) -> User:
    from users.models import UserRole
    from profiles.models import FreelancerProfile
    from client_profiles.models import ClientProfile
    if new_role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {new_role}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = UserRole(new_role)
    if new_role == "freelancer":
        exists = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == user_id).first()
        if not exists:
            db.add(FreelancerProfile(user_id=user_id))
    elif new_role == "client":
        exists = db.query(ClientProfile).filter(ClientProfile.user_id == user_id).first()
        if not exists:
            db.add(ClientProfile(user_id=user_id))
    db.commit()
    db.refresh(user)
    return user


def verify_user(user_id: UUID, db: Session) -> User:
    from profiles.models import FreelancerProfile
    from client_profiles.models import ClientProfile
    from achievements.views import check_and_grant
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == user_id).first()
    if profile:
        profile.is_verified = True
    client_profile = db.query(ClientProfile).filter(ClientProfile.user_id == user_id).first()
    if client_profile:
        client_profile.is_verified = True
    create_notification(
        user_id=user_id, type=NotificationType.system,
        title="Профиль верифицирован",
        message="Администратор верифицировал ваш профиль. Теперь вы отображаетесь как проверенный специалист.",
        db=db,
    )
    db.commit()
    db.refresh(user)
    check_and_grant(user, db)
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
    from users.models import UserRole
    from sqlalchemy import func
    from datetime import timedelta

    total_users = db.query(User).count()
    total_clients = db.query(User).filter(User.role == UserRole.client).count()
    total_freelancers = db.query(User).filter(User.role == UserRole.freelancer).count()
    banned_users = db.query(User).filter(User.is_banned == True).count()
    total_projects = db.query(Project).count()
    open_projects = db.query(Project).filter(Project.status == ProjectStatus.open).count()
    completed_projects = db.query(Project).filter(Project.status == ProjectStatus.completed).count()
    active_disputes = db.query(Transaction).filter(Transaction.status == EscrowStatus.disputed).count()
    total_released = db.query(func.sum(Transaction.amount)).filter(Transaction.status == EscrowStatus.released).scalar() or 0

    rate = Decimal(os.getenv("PLATFORM_COMMISSION_RATE", "0.01"))
    platform_revenue = float(Decimal(str(total_released)) * rate)

    # 14-дневная динамика (бакетим в Python — без диалект-зависимостей)
    now = get_dushanbe_time()
    start = (now - timedelta(days=13)).date()
    days = [start + timedelta(days=i) for i in range(14)]
    u_rows = db.query(User.created_at).filter(User.created_at.isnot(None)).all()
    p_rows = db.query(Project.created_at).filter(Project.created_at.isnot(None)).all()

    def bucket(rows):
        counts = {d: 0 for d in days}
        for (ts,) in rows:
            if not ts:
                continue
            d = ts.date()
            if d in counts:
                counts[d] += 1
        return counts

    u_counts = bucket(u_rows)
    p_counts = bucket(p_rows)
    timeseries = [
        {"date": d.isoformat(), "users": u_counts[d], "projects": p_counts[d]}
        for d in days
    ]

    return {
        "total_users": total_users,
        "total_clients": total_clients,
        "total_freelancers": total_freelancers,
        "banned_users": banned_users,
        "total_projects": total_projects,
        "open_projects": open_projects,
        "completed_projects": completed_projects,
        "active_disputes": active_disputes,
        "total_released": float(total_released),
        "platform_revenue": round(platform_revenue, 2),
        "timeseries": timeseries,
    }


# ─────────────────────────── ПРОЕКТЫ (модерация) ───────────────────────────

def get_all_projects(db: Session) -> list[dict]:
    from bids.models import Bid
    rows = db.query(Project).order_by(Project.created_at.desc()).all()
    result = []
    for p in rows:
        client = db.query(User).filter(User.id == p.client_id).first()
        bids_count = db.query(Bid).filter(Bid.project_id == p.id).count()
        result.append({
            "id": p.id,
            "title": p.title,
            "status": p.status.value if hasattr(p.status, "value") else p.status,
            "budget_min": float(p.budget_min) if p.budget_min is not None else None,
            "budget_max": float(p.budget_max) if p.budget_max is not None else None,
            "created_at": p.created_at,
            "client_id": p.client_id,
            "client_name": client.full_name if client else "—",
            "assigned_freelancer_id": p.assigned_freelancer_id,
            "bids_count": bids_count,
            "is_featured": p.is_featured,
        })
    return result


def hide_project(project_id: UUID, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project.status = ProjectStatus.cancelled
    db.commit()
    db.refresh(project)
    return project


def delete_project_admin(project_id: UUID, db: Session) -> dict:
    from bids.models import Bid
    from projects.models import ProjectSkill, ProjectRevision
    from contracts.models import Contract
    from reviews.models import Review
    from favorites.models import Favorite
    from media.models import ProjectFile

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    title = project.title

    # зачищаем зависимости (FK без каскада), затем сам проект
    db.query(Bid).filter(Bid.project_id == project_id).delete(synchronize_session=False)
    db.query(ProjectSkill).filter(ProjectSkill.project_id == project_id).delete(synchronize_session=False)
    db.query(ProjectRevision).filter(ProjectRevision.project_id == project_id).delete(synchronize_session=False)
    db.query(Contract).filter(Contract.project_id == project_id).delete(synchronize_session=False)
    db.query(Review).filter(Review.project_id == project_id).delete(synchronize_session=False)
    db.query(Favorite).filter(Favorite.project_id == project_id).delete(synchronize_session=False)
    db.query(ProjectFile).filter(ProjectFile.project_id == project_id).delete(synchronize_session=False)
    db.query(Transaction).filter(Transaction.project_id == project_id).delete(synchronize_session=False)
    db.query(Report).filter(Report.project_id == project_id).update({Report.project_id: None}, synchronize_session=False)

    db.delete(project)
    db.commit()
    return {"id": str(project_id), "title": title, "deleted": True}


# ─────────────────────────── ТРАНЗАКЦИИ / ЖУРНАЛ ───────────────────────────

def get_all_transactions(db: Session) -> list[dict]:
    from sqlalchemy.orm import aliased
    ClientUser = aliased(User, name="c_user")
    FreelancerUser = aliased(User, name="f_user")
    rows = (
        db.query(Transaction, Project, ClientUser, FreelancerUser)
        .outerjoin(Project, Transaction.project_id == Project.id)
        .outerjoin(ClientUser, Transaction.client_id == ClientUser.id)
        .outerjoin(FreelancerUser, Transaction.freelancer_id == FreelancerUser.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )
    result = []
    for tx, project, client, freelancer in rows:
        result.append({
            "id": tx.id,
            "project_id": tx.project_id,
            "project_title": project.title if project else "—",
            "client_name": client.full_name if client else "—",
            "freelancer_name": freelancer.full_name if freelancer else "—",
            "amount": float(tx.amount),
            "status": tx.status.value if hasattr(tx.status, "value") else tx.status,
            "created_at": tx.created_at,
            "released_at": tx.released_at,
        })
    return result


def get_audit_log(db: Session, limit: int = 200) -> list[dict]:
    rows = db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).limit(limit).all()
    return [{
        "id": r.id,
        "admin_name": r.admin_name,
        "action": r.action,
        "target_type": r.target_type,
        "target_id": r.target_id,
        "target_name": r.target_name,
        "detail": r.detail,
        "created_at": r.created_at,
    } for r in rows]
