from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from disputes.schemas import DisputeMessageCreate, DisputeMessageResponse
from disputes.views import get_dispute_messages, create_dispute_message
from users.permissions import get_current_user
from users.models import User

disputes_router = APIRouter(prefix="/api/disputes", tags=["disputes"])


@disputes_router.get("/{transaction_id}/messages", response_model=list[DisputeMessageResponse])
def list_messages(transaction_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_dispute_messages(transaction_id, current_user, db)


@disputes_router.post("/{transaction_id}/messages", response_model=DisputeMessageResponse, status_code=201)
def send_message(transaction_id: UUID, data: DisputeMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_dispute_message(transaction_id, data, current_user, db)
