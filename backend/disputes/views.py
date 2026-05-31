from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from disputes.models import DisputeMessage
from disputes.schemas import DisputeMessageCreate
from escrow.models import Transaction, EscrowStatus
from users.models import User


def _check_dispute_access(tx: Transaction, current_user: User) -> None:
    is_participant = tx.client_id == current_user.id or tx.freelancer_id == current_user.id
    is_admin = current_user.role.value == "admin"
    if not is_participant and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def get_dispute_messages(tx_id: UUID, current_user: User, db: Session) -> list[DisputeMessage]:
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    _check_dispute_access(tx, current_user)
    return db.query(DisputeMessage).filter(DisputeMessage.transaction_id == tx_id).order_by(DisputeMessage.created_at).all()


def create_dispute_message(tx_id: UUID, data: DisputeMessageCreate, current_user: User, db: Session) -> DisputeMessage:
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if tx.status != EscrowStatus.disputed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction is not disputed")
    _check_dispute_access(tx, current_user)
    msg = DisputeMessage(transaction_id=tx_id, sender_id=current_user.id, content=data.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
