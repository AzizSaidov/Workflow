from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from portfolio.schemas import PortfolioCreate, PortfolioUpdate, PortfolioResponse
from portfolio.views import get_user_portfolio, create_item, update_item, delete_item, like_item, unlike_item
from users.permissions import get_current_user
from users.models import User

portfolio_router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@portfolio_router.get("/{user_id}", response_model=list[PortfolioResponse])
def list_portfolio(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_user_portfolio(user_id, db)


@portfolio_router.post("/", response_model=PortfolioResponse, status_code=201)
def add_item(data: PortfolioCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_item(data, current_user, db)


@portfolio_router.put("/{item_id}", response_model=PortfolioResponse)
def edit_item(item_id: UUID, data: PortfolioUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_item(item_id, data, current_user, db)


@portfolio_router.delete("/{item_id}", status_code=204)
def remove_item(item_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_item(item_id, current_user, db)


@portfolio_router.post("/{item_id}/like", response_model=PortfolioResponse)
def like(item_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return like_item(item_id, current_user, db)


@portfolio_router.delete("/{item_id}/like", response_model=PortfolioResponse)
def unlike(item_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return unlike_item(item_id, current_user, db)
