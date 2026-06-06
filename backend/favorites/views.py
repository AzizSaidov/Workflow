from uuid import UUID
from sqlalchemy.orm import Session
from favorites.models import Favorite
from users.models import User


def get_favorites(current_user: User, db: Session) -> list[Favorite]:
    return db.query(Favorite).filter(Favorite.user_id == current_user.id).all()


def add_project(project_id: UUID, current_user: User, db: Session) -> Favorite:
    exists = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.project_id == project_id,
    ).first()
    if exists:
        return exists
    fav = Favorite(user_id=current_user.id, project_id=project_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


def remove_project(project_id: UUID, current_user: User, db: Session) -> None:
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.project_id == project_id,
    ).first()
    if fav:
        db.delete(fav)
        db.commit()


def add_freelancer(freelancer_id: UUID, current_user: User, db: Session) -> Favorite:
    exists = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.freelancer_id == freelancer_id,
    ).first()
    if exists:
        return exists
    fav = Favorite(user_id=current_user.id, freelancer_id=freelancer_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


def remove_freelancer(freelancer_id: UUID, current_user: User, db: Session) -> None:
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.freelancer_id == freelancer_id,
    ).first()
    if fav:
        db.delete(fav)
        db.commit()
