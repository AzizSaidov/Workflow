from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from reports.schemas import ReportCreate, ReportResponse
from reports.views import create_report, get_my_reports
from users.permissions import get_current_user
from users.models import User

reports_router = APIRouter(prefix="/api/reports", tags=["reports"])


@reports_router.post("/", response_model=ReportResponse, status_code=201)
def submit_report(data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_report(data, current_user, db)


@reports_router.get("/", response_model=list[ReportResponse])
def my_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_reports(current_user, db)
