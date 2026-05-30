from uuid import UUID
from sqlalchemy.orm import Session
from chats.models import Message


def get_history(project_id: UUID, db: Session) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.project_id == project_id)
        .order_by(Message.created_at.asc())
        .all()
    )


def save_message(project_id: UUID, sender_id: UUID, content: str, db: Session) -> Message:
    msg = Message(project_id=project_id, sender_id=sender_id, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
