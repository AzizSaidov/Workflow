import json
from uuid import UUID
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from chats.schemas import MessageResponse, MessageEdit
from chats.views import get_history, save_message, edit_message, delete_message, hide_chat, get_hidden_project_ids, delete_chat, get_last_messages
from chats.manager import manager
from projects.models import Project
from users.models import User
from users.permissions import get_current_user
from users.auth import decode_token

chats_router = APIRouter(tags=["chats"])


@chats_router.get("/api/chats/hidden")
def hidden_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ids = get_hidden_project_ids(current_user.id, db)
    return [str(i) for i in ids]


@chats_router.post("/api/chats/{project_id}/hide", status_code=204)
def hide_chat_route(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hide_chat(project_id, current_user.id, db)


@chats_router.put("/api/chats/{project_id}/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    project_id: UUID,
    message_id: UUID,
    body: MessageEdit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = edit_message(message_id, body.content, current_user.id, db)
    await manager.broadcast(str(project_id), {
        "type": "message_updated",
        "id": str(msg.id),
        "content": msg.content,
        "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
    })
    return msg


@chats_router.delete("/api/chats/{project_id}/messages/{message_id}", status_code=204)
async def remove_message(
    project_id: UUID,
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_message(message_id, current_user.id, db)
    await manager.broadcast(str(project_id), {
        "type": "message_deleted",
        "id": str(message_id),
    })


@chats_router.delete("/api/chats/{project_id}", status_code=204)
def delete_chat_route(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_chat(project_id, current_user.id, db)


@chats_router.get("/api/chats/last-messages")
def last_messages_route(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = get_last_messages(current_user.id, db)
    return {
        pid: {
            "id": str(msg.id),
            "sender_id": str(msg.sender_id),
            "content": msg.content,
            "file_url": msg.file_url,
            "file_type": msg.file_type,
            "created_at": msg.created_at.isoformat(),
        } if msg else None
        for pid, msg in data.items()
    }


@chats_router.get("/api/chats/{project_id}", response_model=list[MessageResponse])
def chat_history(project_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_history(project_id, db)


@chats_router.websocket("/ws/chat/{project_id}")
async def websocket_chat(project_id: UUID, ws: WebSocket, token: str = Query(...)):
    user_id = decode_token(token)
    if not user_id:
        await ws.close(code=4001)
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await ws.close(code=4001)
            return

        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            await ws.close(code=4004)
            return

        participants = {str(project.client_id), str(project.assigned_freelancer_id)}
        if str(user.id) not in participants:
            await ws.close(code=4003)
            return

        stored_user_id = user.id
    finally:
        db.close()

    room_key = str(project_id)
    await manager.connect(room_key, ws)
    try:
        while True:
            data = await ws.receive_text()
            try:
                payload = json.loads(data)
            except (json.JSONDecodeError, ValueError):
                payload = {"content": data}
            content = payload.get("content", "")
            file_url = payload.get("file_url")
            file_type = payload.get("file_type")
            if not content.strip() and not file_url:
                continue
            msg_db = SessionLocal()
            try:
                msg = save_message(project_id, stored_user_id, content, msg_db, file_url, file_type)
                msg_data = {
                    "type": "message",
                    "id": str(msg.id),
                    "sender_id": str(msg.sender_id),
                    "content": msg.content,
                    "file_url": msg.file_url,
                    "file_type": msg.file_type,
                    "edited_at": None,
                    "created_at": msg.created_at.isoformat(),
                }
            finally:
                msg_db.close()
            await manager.broadcast(room_key, msg_data)
    except WebSocketDisconnect:
        manager.disconnect(room_key, ws)
