from uuid import UUID
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from decimal import Decimal
from database import get_db
from wallet.schemas import WalletResponse, DepositRequest, TransactionResponse
from wallet.views import get_or_create_wallet, deposit, get_transactions, admin_topup
from users.permissions import get_current_user, check_admin
from users.models import User

wallet_router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@wallet_router.get("/", response_model=WalletResponse)
def my_wallet(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_or_create_wallet(current_user, db)


@wallet_router.post("/deposit", response_model=WalletResponse)
def make_deposit(data: DepositRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return deposit(data.amount, current_user, db)


@wallet_router.post("/admin/topup", response_model=WalletResponse)
def topup_user(
    user_id: UUID = Body(...),
    amount: Decimal = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    return admin_topup(user_id, amount, db)


@wallet_router.get("/transactions", response_model=list[TransactionResponse])
def transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_transactions(current_user, db)
