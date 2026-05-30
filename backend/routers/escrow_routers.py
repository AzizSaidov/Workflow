from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from escrow.schemas import EscrowFreezeRequest, TransactionResponse
from escrow.views import freeze, release, dispute, refund
from users.permissions import get_current_user
from users.models import User

escrow_router = APIRouter(prefix="/api/escrow", tags=["escrow"])


@escrow_router.post("/freeze", response_model=TransactionResponse, status_code=201)
def freeze_funds(data: EscrowFreezeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return freeze(data, current_user, db)


@escrow_router.post("/{tx_id}/release", response_model=TransactionResponse)
def release_funds(tx_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return release(tx_id, current_user, db)


@escrow_router.post("/{tx_id}/dispute", response_model=TransactionResponse)
def open_dispute(tx_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return dispute(tx_id, current_user, db)


@escrow_router.post("/{tx_id}/refund", response_model=TransactionResponse)
def refund_funds(tx_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return refund(tx_id, current_user, db)
