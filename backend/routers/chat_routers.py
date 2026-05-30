from uuid import UUID
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from chats.schemas import MessageResponse
from chats.views import get_history, save_message
from chats.manager import manager
from projects.models import Project
from users.models import User
from users.permissions import get_current_user
from users.auth import decode_token

chats_router = APIRouter(tags=["chats"])


@chats_router.get("/api/chats/{project_id}", response_model=list[MessageResponse])
def chat_history(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_history(project_id, db)


@chats_router.websocket("/ws/chat/{project_id}")
async def websocket_chat(project_id: UUID, ws: WebSocket, token: str = Query(...)):
    db: Session = SessionLocal()
    try:
        user_id = decode_token(token)
        if not user_id:
            await ws.close(code=4001)
            return

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

        room_key = str(project_id)
        await manager.connect(room_key, ws)
        try:
            while True:
                data = await ws.receive_text()
                if not data.strip():
                    continue
                msg = save_message(project_id, user.id, data, db)
                await manager.broadcast(room_key, {
                    "id": str(msg.id),
                    "sender_id": str(msg.sender_id),
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat(),
                })
        except WebSocketDisconnect:
            manager.disconnect(room_key, ws)
    finally:
        db.close()
