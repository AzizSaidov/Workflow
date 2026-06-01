from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from wallet.models import Wallet
from escrow.models import Transaction
from users.models import User


def get_or_create_wallet(user: User, db: Session) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not wallet:
        wallet = Wallet(user_id=user.id)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def deposit(amount: Decimal, user: User, db: Session) -> Wallet:
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")
    wallet = get_or_create_wallet(user, db)
    wallet.balance = wallet.balance + amount
    db.commit()
    db.refresh(wallet)
    return wallet


def admin_topup(user_id, amount: Decimal, db: Session) -> Wallet:
    from uuid import UUID
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return deposit(amount, target, db)


def get_transactions(user: User, db: Session) -> list[Transaction]:
    return (
        db.query(Transaction)
        .filter(or_(Transaction.client_id == user.id, Transaction.freelancer_id == user.id))
        .order_by(Transaction.created_at.desc())
        .all()
    )
