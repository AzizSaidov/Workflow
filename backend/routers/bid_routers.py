from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from bids.schemas import BidCreate, BidResponse, BidEnrichedResponse
from bids.views import create_bid, get_project_bids, get_my_bids, accept_bid, reject_bid
from users.permissions import get_current_user
from users.models import User

bids_router = APIRouter(prefix="/api/bids", tags=["bids"])


@bids_router.post("/project/{project_id}", response_model=BidResponse, status_code=201)
def submit_bid(project_id: UUID, data: BidCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_bid(project_id, data, current_user, db)


@bids_router.get("/project/{project_id}", response_model=list[BidEnrichedResponse])
def project_bids(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_project_bids(project_id, current_user, db)


@bids_router.get("/my", response_model=list[BidEnrichedResponse])
def my_bids(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_bids(current_user, db)


@bids_router.put("/{bid_id}/accept", response_model=BidResponse)
def accept(bid_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return accept_bid(bid_id, current_user, db)


@bids_router.put("/{bid_id}/reject", response_model=BidResponse)
def reject(bid_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return reject_bid(bid_id, current_user, db)
