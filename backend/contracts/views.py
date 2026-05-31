from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from contracts.models import Contract, ContractStatus
from users.models import User
from utils import get_dushanbe_time


def get_my_contracts(current_user: User, db: Session) -> list[Contract]:
    return db.query(Contract).filter(
        (Contract.client_id == current_user.id) | (Contract.freelancer_id == current_user.id)
    ).order_by(Contract.started_at.desc()).all()


def get_contract(contract_id: UUID, current_user: User, db: Session) -> Contract:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    if contract.client_id != current_user.id and contract.freelancer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return contract


def complete_contract(contract_id: UUID, current_user: User, db: Session) -> Contract:
    contract = get_contract(contract_id, current_user, db)
    if contract.status != ContractStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contract is not active")
    contract.status = ContractStatus.completed
    contract.completed_at = get_dushanbe_time()
    db.commit()
    db.refresh(contract)
    return contract
