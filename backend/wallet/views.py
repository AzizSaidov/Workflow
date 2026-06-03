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
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return deposit(amount, target, db)


def get_transactions(user: User, db: Session) -> list[dict]:
    from projects.models import Project
    from sqlalchemy.orm import aliased

    ClientUser = aliased(User, name="client_user")
    FreelancerUser = aliased(User, name="freelancer_user")

    rows = (
        db.query(Transaction, Project, ClientUser, FreelancerUser)
        .outerjoin(Project, Transaction.project_id == Project.id)
        .join(ClientUser, Transaction.client_id == ClientUser.id)
        .join(FreelancerUser, Transaction.freelancer_id == FreelancerUser.id)
        .filter(or_(Transaction.client_id == user.id, Transaction.freelancer_id == user.id))
        .order_by(Transaction.created_at.desc())
        .all()
    )

    results = []
    for tx, project, client, freelancer in rows:
        results.append({
            "id": tx.id,
            "project_id": tx.project_id,
            "project_title": project.title if project else "Проект удалён",
            "client": {
                "id": client.id,
                "full_name": client.full_name,
                "avatar_url": client.avatar_url,
            },
            "freelancer": {
                "id": freelancer.id,
                "full_name": freelancer.full_name,
                "avatar_url": freelancer.avatar_url,
            },
            "amount": tx.amount,
            "status": tx.status,
            "created_at": tx.created_at,
            "released_at": tx.released_at,
        })

    return results
