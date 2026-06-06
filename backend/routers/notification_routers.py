import asyncio
from uuid import UUID
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from notifications.schemas import NotificationResponse, UnreadCount
from notifications.views import get_my_notifications, get_unread_count, mark_read, mark_all_read, delete_notification
from notifications.models import Notification
from notifications.manager import notif_manager
from users.permissions import get_current_user
from users.models import User
from users.auth import decode_token
from utils import get_dushanbe_time

notifications_router = APIRouter(prefix="/api/notifications", tags=["notifications"])

notifications_ws_router = APIRouter()


@notifications_router.get("/", response_model=list[NotificationResponse])
def my_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_notifications(current_user, db)


@notifications_router.get("/unread-count", response_model=UnreadCount)
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return UnreadCount(count=get_unread_count(current_user, db))


@notifications_router.put("/{notif_id}/read", response_model=NotificationResponse)
def read_one(notif_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return mark_read(notif_id, current_user, db)


@notifications_router.put("/read-all", status_code=204)
def read_all(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mark_all_read(current_user, db)


@notifications_router.delete("/{notif_id}", status_code=204)
def delete_one(notif_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_notification(notif_id, current_user, db)


@notifications_ws_router.websocket("/ws/notifications/{user_id}")
async def notification_ws(user_id: UUID, ws: WebSocket, token: str = Query(...)):
    token_user_id = decode_token(token)
    if not token_user_id or token_user_id != str(user_id):
        await ws.close(code=4001)
        return

    await notif_manager.connect(str(user_id), ws)

    db = SessionLocal()
    try:
        unread = db.query(Notification).filter(
            Notification.user_id == user_id, Notification.is_read == False
        ).order_by(Notification.created_at.asc()).all()
        notifs_to_send = [
            {"id": str(n.id), "type": n.type, "title": n.title,
             "message": n.message, "is_read": n.is_read,
             "created_at": n.created_at.isoformat(),
             "icon": n.icon, "color": n.color, "points": n.points}
            for n in unread
        ]
    finally:
        db.close()

    try:
        for payload in notifs_to_send:
            await ws.send_json(payload)
        await ws.send_json({"type": "init_done"})
    except (WebSocketDisconnect, Exception):
        notif_manager.disconnect(str(user_id), ws)
        return

    last_check = get_dushanbe_time()
    try:
        while True:
            try:
                await asyncio.sleep(5)
            except asyncio.CancelledError:
                break
            poll_db = SessionLocal()
            try:
                new = poll_db.query(Notification).filter(
                    Notification.user_id == user_id,
                    Notification.created_at > last_check,
                ).all()
                new_payloads = [
                    {"id": str(n.id), "type": n.type, "title": n.title,
                     "message": n.message, "is_read": n.is_read,
                     "created_at": n.created_at.isoformat(),
                     "icon": n.icon, "color": n.color, "points": n.points}
                    for n in new
                ]
            finally:
                poll_db.close()
            for payload in new_payloads:
                try:
                    await ws.send_json(payload)
                except Exception:
                    break
            last_check = get_dushanbe_time()
    except WebSocketDisconnect:
        pass
    finally:
        notif_manager.disconnect(str(user_id), ws)
