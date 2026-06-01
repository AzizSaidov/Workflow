from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import Session
from chats.models import Message, ChatHidden
from utils import get_dushanbe_time


def get_history(project_id: UUID, db: Session) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.project_id == project_id)
        .order_by(Message.created_at.asc())
        .all()
    )


def save_message(project_id: UUID, sender_id: UUID, content: str, db: Session, file_url: str | None = None, file_type: str | None = None) -> Message:
    msg = Message(project_id=project_id, sender_id=sender_id, content=content, file_url=file_url, file_type=file_type)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def edit_message(message_id: UUID, content: str, user_id: UUID, db: Session) -> Message:
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if str(msg.sender_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not your message")
    msg.content = content
    msg.edited_at = get_dushanbe_time()
    db.commit()
    db.refresh(msg)
    return msg


def delete_message(message_id: UUID, user_id: UUID, db: Session) -> UUID:
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if str(msg.sender_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not your message")
    project_id = msg.project_id
    db.delete(msg)
    db.commit()
    return project_id


def hide_chat(project_id: UUID, user_id: UUID, db: Session) -> None:
    existing = db.query(ChatHidden).filter(
        ChatHidden.project_id == project_id,
        ChatHidden.user_id == user_id,
    ).first()
    if not existing:
        db.add(ChatHidden(user_id=user_id, project_id=project_id))
        db.commit()


def get_hidden_project_ids(user_id: UUID, db: Session) -> list[UUID]:
    rows = db.query(ChatHidden.project_id).filter(ChatHidden.user_id == user_id).all()
    return [r[0] for r in rows]
