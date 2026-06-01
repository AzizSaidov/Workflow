from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import get_db
from admin.views import (
    get_all_reports, resolve_report, get_all_disputes,
    admin_release, admin_refund, get_all_users, ban_user, unban_user,
    verify_user, topup_wallet, get_platform_stats,
)
from reports.schemas import ReportResponse
from escrow.schemas import TransactionResponse
from users.schemas import UserResponse, AdminUserResponse
from wallet.schemas import WalletResponse
from users.permissions import check_admin
from users.models import User

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])


@admin_router.get("/reports", response_model=list[ReportResponse])
def list_reports(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_all_reports(db)


@admin_router.put("/reports/{report_id}/resolve", response_model=ReportResponse)
def resolve(report_id: UUID, db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return resolve_report(report_id, db)


@admin_router.get("/disputes", response_model=list[TransactionResponse])
def list_disputes(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_all_disputes(db)


@admin_router.put("/disputes/{tx_id}/release", response_model=TransactionResponse)
def release_dispute(tx_id: UUID, db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return admin_release(tx_id, db)


@admin_router.put("/disputes/{tx_id}/refund", response_model=TransactionResponse)
def refund_dispute(tx_id: UUID, db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return admin_refund(tx_id, db)


@admin_router.get("/users", response_model=list[AdminUserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_all_users(db)


@admin_router.put("/users/{user_id}/ban", response_model=UserResponse)
def ban(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return ban_user(user_id, db)


@admin_router.put("/users/{user_id}/unban", response_model=UserResponse)
def unban(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return unban_user(user_id, db)


@admin_router.put("/users/{user_id}/verify", response_model=UserResponse)
def verify(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return verify_user(user_id, db)


@admin_router.post("/wallet/topup")
def wallet_topup(
    user_id: UUID = Body(...),
    amount: Decimal = Body(...),
    reason: str = Body(...),
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin),
):
    return topup_wallet(user_id, amount, reason, admin, db)


@admin_router.get("/stats")
def platform_stats(db: Session = Depends(get_db), _: User = Depends(check_admin)):
    return get_platform_stats(db)
