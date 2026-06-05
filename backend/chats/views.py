from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import Session
from chats.models import Message, ChatHidden
from projects.models import Project
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


def delete_chat(project_id: UUID, user_id: UUID, db: Session) -> None:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    participants = {str(project.client_id), str(project.assigned_freelancer_id)}
    if str(user_id) not in participants:
        raise HTTPException(status_code=403, detail="Not a participant")
    db.query(Message).filter(Message.project_id == project_id).delete()
    db.commit()


def get_hidden_project_ids(user_id: UUID, db: Session) -> list[UUID]:
    rows = db.query(ChatHidden.project_id).filter(ChatHidden.user_id == user_id).all()
    return [r[0] for r in rows]


def get_last_messages(user_id: UUID, db: Session) -> dict:
    from projects.models import Project
    from sqlalchemy import or_
    active = db.query(Project).filter(
        or_(Project.client_id == user_id, Project.assigned_freelancer_id == user_id),
        Project.status.in_(['in_progress', 'delivered', 'completed'])
    ).all()
    result = {}
    for proj in active:
        msg = db.query(Message).filter(
            Message.project_id == proj.id
        ).order_by(Message.created_at.desc()).first()
        result[str(proj.id)] = msg
    return result
