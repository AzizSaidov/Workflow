from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from wallet.schemas import WalletResponse, DepositRequest, TransactionResponse
from wallet.views import get_or_create_wallet, deposit, get_transactions
from users.permissions import get_current_user
from users.models import User

wallet_router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@wallet_router.get("/", response_model=WalletResponse)
def my_wallet(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_or_create_wallet(current_user, db)


@wallet_router.post("/deposit", response_model=WalletResponse)
def make_deposit(data: DepositRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return deposit(data.amount, current_user, db)


@wallet_router.get("/transactions", response_model=list[TransactionResponse])
def transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_transactions(current_user, db)
