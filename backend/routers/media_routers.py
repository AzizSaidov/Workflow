from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from database import get_db
from media.views import upload_avatar, upload_file, upload_delivery, get_project_files, serve_file
from media.models import ProjectFile
from users.permissions import get_current_user
from users.models import User
from profiles.schemas import ProfileResponse
from pydantic import BaseModel


class UploadResponse(BaseModel):
    url: str


class ProjectFileResponse(BaseModel):
    id: UUID
    project_id: UUID
    uploader_id: UUID
    original_name: str
    stored_name: str
    file_type: str

    model_config = {"from_attributes": True}


media_router = APIRouter(prefix="/api/media", tags=["media"])


@media_router.post("/avatar", response_model=UploadResponse)
def avatar_upload(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    url = upload_avatar(file, current_user, db)
    return UploadResponse(url=url)


@media_router.post("/upload", response_model=UploadResponse)
def file_upload(file: UploadFile = File(...), _: User = Depends(get_current_user)):
    url = upload_file(file)
    return UploadResponse(url=url)


@media_router.post("/project/{project_id}/delivery", response_model=ProjectFileResponse, status_code=201)
def deliver_project(project_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return upload_delivery(project_id, file, current_user, db)


@media_router.get("/project/{project_id}/files", response_model=list[ProjectFileResponse])
def project_files(project_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_project_files(project_id, db)


@media_router.get("/{filename}")
def get_file(filename: str):
    return serve_file(filename)
