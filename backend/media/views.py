import uuid as uuid_lib
from pathlib import Path
from uuid import UUID
from fastapi import HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from media.models import ProjectFile
from projects.models import Project, ProjectStatus
from users.models import User, UserRole
from notifications.models import NotificationType
from notifications.views import create_notification

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp",   # images
    ".pdf", ".docx", ".doc", ".txt", ".md",      # documents
    ".zip", ".rar", ".7z",                        # archives
    ".fig", ".sketch", ".psd",                    # design
    ".mp4",                                        # video
}
MAX_SIZE = 50 * 1024 * 1024  # 50 MB


def _validate_and_save(file: UploadFile) -> tuple[str, str, str]:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported file type: {ext}")
    content = file.file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds 10 MB limit")
    stored_name = f"{uuid_lib.uuid4()}{ext}"
    (UPLOAD_DIR / stored_name).write_bytes(content)
    return stored_name, file.filename or stored_name, ext.lstrip(".")


def upload_avatar(file: UploadFile, user: User, db: Session) -> str:
    stored_name, _, _ = _validate_and_save(file)
    user.avatar_url = f"/api/media/{stored_name}"
    db.commit()
    return user.avatar_url


def upload_file(file: UploadFile) -> str:
    stored_name, _, _ = _validate_and_save(file)
    return f"/api/media/{stored_name}"


def upload_delivery(project_id: UUID, file: UploadFile, uploader: User, db: Session) -> ProjectFile:
    if uploader.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers can deliver")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.assigned_freelancer_id != uploader.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this project")
    if project.status != ProjectStatus.in_progress:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project is not in progress")

    stored_name, original_name, file_type = _validate_and_save(file)
    pf = ProjectFile(
        project_id=project_id,
        uploader_id=uploader.id,
        original_name=original_name,
        stored_name=stored_name,
        file_type=file_type,
    )
    db.add(pf)
    project.status = ProjectStatus.delivered
    create_notification(
        user_id=project.client_id,
        type=NotificationType.project_delivered,
        title="Работа сдана",
        message=f"Фрилансер сдал работу по проекту «{project.title}»",
        db=db,
    )
    db.commit()
    db.refresh(pf)
    return pf


def get_project_files(project_id: UUID, db: Session) -> list[ProjectFile]:
    return db.query(ProjectFile).filter(ProjectFile.project_id == project_id).order_by(ProjectFile.created_at.desc()).all()


def serve_file(filename: str) -> FileResponse:
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileResponse(str(path))
