from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import get_db
from admin.views import (
    get_all_reports, resolve_report, get_all_disputes,
    admin_release, admin_refund, get_all_users, ban_user, unban_user,
    verify_user, topup_wallet, get_platform_stats, change_user_role,
    grant_admin, revoke_admin,
    get_all_projects, hide_project, delete_project_admin,
    get_all_transactions, get_audit_log, log_admin_action,
)
from reports.schemas import ReportResponse
from escrow.schemas import TransactionResponse
from users.schemas import UserResponse, AdminUserResponse
from users.permissions import check_admin
from users.models import User

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])


@admin_router.get("/reports", response_model=list[ReportResponse])
def list_reports(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_all_reports(db)


@admin_router.put("/reports/{report_id}/resolve", response_model=ReportResponse)
def resolve(report_id: UUID, db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    report = resolve_report(report_id, db)
    log_admin_action(admin, "resolve_report", db, target_type="report", target_id=report_id)
    db.commit()
    return report


@admin_router.get("/disputes", response_model=list[TransactionResponse])
def list_disputes(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_all_disputes(db)


@admin_router.put("/disputes/{tx_id}/release", response_model=TransactionResponse)
def release_dispute(tx_id: UUID, db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    tx = admin_release(tx_id, db)
    log_admin_action(admin, "release_dispute", db, target_type="transaction", target_id=tx_id, detail=f"${tx.amount}")
    db.commit()
    return tx


@admin_router.put("/disputes/{tx_id}/refund", response_model=TransactionResponse)
def refund_dispute(tx_id: UUID, db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    tx = admin_refund(tx_id, db)
    log_admin_action(admin, "refund_dispute", db, target_type="transaction", target_id=tx_id, detail=f"${tx.amount}")
    db.commit()
    return tx


@admin_router.get("/users", response_model=list[AdminUserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_all_users(db)


@admin_router.put("/users/{user_id}/ban", response_model=UserResponse)
def ban(user_id: UUID, reason: str = Body(default="", embed=True), db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    user = ban_user(user_id, db)
    log_admin_action(admin, "ban_user", db, target_type="user", target_id=user_id, target_name=user.full_name, detail=reason or None)
    db.commit()
    return user


@admin_router.put("/users/{user_id}/unban", response_model=UserResponse)
def unban(user_id: UUID, db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    user = unban_user(user_id, db)
    log_admin_action(admin, "unban_user", db, target_type="user", target_id=user_id, target_name=user.full_name)
    db.commit()
    return user


@admin_router.put("/users/{user_id}/verify", response_model=UserResponse)
def verify(user_id: UUID, db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    user = verify_user(user_id, db)
    log_admin_action(admin, "verify_user", db, target_type="user", target_id=user_id, target_name=user.full_name)
    db.commit()
    return user


@admin_router.put("/users/{user_id}/role", response_model=UserResponse)
def set_role(user_id: UUID, new_role: str = Body(..., embed=True), db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    user = change_user_role(user_id, new_role, db)
    log_admin_action(admin, "change_role", db, target_type="user", target_id=user_id, target_name=user.full_name, detail=new_role)
    db.commit()
    return user


@admin_router.put("/users/{user_id}/grant-admin", response_model=UserResponse)
def make_admin(user_id: UUID, db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    user = grant_admin(user_id, db)
    log_admin_action(admin, "grant_admin", db, target_type="user", target_id=user_id, target_name=user.full_name)
    db.commit()
    return user


@admin_router.put("/users/{user_id}/revoke-admin", response_model=UserResponse)
def remove_admin(user_id: UUID, db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    user = revoke_admin(user_id, db)
    log_admin_action(admin, "revoke_admin", db, target_type="user", target_id=user_id, target_name=user.full_name)
    db.commit()
    return user


@admin_router.post("/wallet/topup")
def wallet_topup(
    user_id: UUID = Body(...),
    amount: Decimal = Body(...),
    reason: str = Body(...),
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin),
):
    wallet = topup_wallet(user_id, amount, reason, admin, db)
    log_admin_action(admin, "topup", db, target_type="user", target_id=user_id, detail=f"${amount} — {reason}")
    db.commit()
    return wallet


@admin_router.get("/stats")
def platform_stats(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_platform_stats(db)


# ─────────────────────────── Проекты (модерация) ───────────────────────────

@admin_router.get("/projects")
def list_all_projects(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_all_projects(db)


@admin_router.put("/projects/{project_id}/hide")
def hide(project_id: UUID, db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    project = hide_project(project_id, db)
    log_admin_action(admin, "hide_project", db, target_type="project", target_id=project_id, target_name=project.title)
    db.commit()
    return {"id": str(project.id), "status": project.status.value}


@admin_router.delete("/projects/{project_id}")
def delete_proj(project_id: UUID, db: Session = Depends(get_db), admin: User = Depends(check_admin)):
    result = delete_project_admin(project_id, db)
    log_admin_action(admin, "delete_project", db, target_type="project", target_id=project_id, target_name=result.get("title"))
    db.commit()
    return result


# ─────────────────────────── Транзакции / журнал ───────────────────────────

@admin_router.get("/transactions")
def list_transactions(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_all_transactions(db)


@admin_router.get("/audit-log")
def audit_log(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_audit_log(db)
