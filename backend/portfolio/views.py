from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from portfolio.models import PortfolioItem, PortfolioLike
from portfolio.schemas import PortfolioCreate, PortfolioUpdate
from users.models import User


def _to_response(item: PortfolioItem, db: Session) -> dict:
    likes_count = db.query(PortfolioLike).filter(PortfolioLike.portfolio_item_id == item.id).count()
    return {
        "id": item.id, "user_id": item.user_id, "category_id": item.category_id,
        "title": item.title, "description": item.description,
        "image_url": item.image_url, "project_url": item.project_url,
        "likes_count": likes_count, "created_at": item.created_at,
    }


def get_user_portfolio(user_id: UUID, db: Session) -> list[dict]:
    items = db.query(PortfolioItem).filter(PortfolioItem.user_id == user_id).order_by(PortfolioItem.created_at.desc()).all()
    return [_to_response(i, db) for i in items]


def create_item(data: PortfolioCreate, current_user: User, db: Session) -> dict:
    item = PortfolioItem(user_id=current_user.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    from achievements.views import check_and_grant
    check_and_grant(current_user, db)
    return _to_response(item, db)


def update_item(item_id: UUID, data: PortfolioUpdate, current_user: User, db: Session) -> dict:
    item = db.query(PortfolioItem).filter(PortfolioItem.id == item_id, PortfolioItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return _to_response(item, db)


def delete_item(item_id: UUID, current_user: User, db: Session) -> None:
    item = db.query(PortfolioItem).filter(PortfolioItem.id == item_id, PortfolioItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found")
    db.delete(item)
    db.commit()


def like_item(item_id: UUID, current_user: User, db: Session) -> dict:
    item = db.query(PortfolioItem).filter(PortfolioItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found")
    exists = db.query(PortfolioLike).filter(PortfolioLike.portfolio_item_id == item_id, PortfolioLike.user_id == current_user.id).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already liked")
    db.add(PortfolioLike(portfolio_item_id=item_id, user_id=current_user.id))
    db.commit()
    return _to_response(item, db)


def unlike_item(item_id: UUID, current_user: User, db: Session) -> dict:
    item = db.query(PortfolioItem).filter(PortfolioItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found")
    like = db.query(PortfolioLike).filter(PortfolioLike.portfolio_item_id == item_id, PortfolioLike.user_id == current_user.id).first()
    if not like:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Like not found")
    db.delete(like)
    db.commit()
    return _to_response(item, db)
