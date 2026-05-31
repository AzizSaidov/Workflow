from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from contracts.schemas import ContractResponse
from contracts.views import get_my_contracts, get_contract, complete_contract
from users.permissions import get_current_user
from users.models import User

contracts_router = APIRouter(prefix="/api/contracts", tags=["contracts"])


@contracts_router.get("/", response_model=list[ContractResponse])
def my_contracts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_contracts(current_user, db)


@contracts_router.get("/{contract_id}", response_model=ContractResponse)
def contract_detail(contract_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_contract(contract_id, current_user, db)


@contracts_router.put("/{contract_id}/complete", response_model=ContractResponse)
def mark_complete(contract_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return complete_contract(contract_id, current_user, db)
