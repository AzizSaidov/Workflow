from sqlalchemy.orm import Session
from reports.models import Report
from reports.schemas import ReportCreate
from users.models import User


def create_report(data: ReportCreate, reporter: User, db: Session) -> Report:
    report = Report(reporter_id=reporter.id, **data.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_my_reports(user: User, db: Session) -> list[Report]:
    return db.query(Report).filter(Report.reporter_id == user.id).order_by(Report.created_at.desc()).all()
