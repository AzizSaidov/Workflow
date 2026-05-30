from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from notifications.models import Notification, NotificationType
from users.models import User


def create_notification(
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    db: Session,
) -> Notification:
    notif = Notification(user_id=user_id, type=type, title=title, message=message)
    db.add(notif)
    return notif


def get_my_notifications(user: User, db: Session) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def get_unread_count(user: User, db: Session) -> int:
    return db.query(Notification).filter(
        Notification.user_id == user.id, Notification.is_read == False
    ).count()


def mark_read(notif_id: UUID, user: User, db: Session) -> Notification:
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


def mark_all_read(user: User, db: Session) -> None:
    db.query(Notification).filter(
        Notification.user_id == user.id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()


def delete_notification(notif_id: UUID, user: User, db: Session) -> None:
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    db.delete(notif)
    db.commit()
