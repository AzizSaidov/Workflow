"""
Async background tasks for notifications and emails.
Run worker:      celery -A tasks.celery_app worker --loglevel=info
Run scheduler:   celery -A tasks.celery_app beat --loglevel=info
"""
from tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def send_email_notification(self, to_email: str, subject: str, body: str):
    """Placeholder for email sending. Wire up SMTP/SendGrid here."""
    try:
        print(f"[EMAIL] To: {to_email} | Subject: {subject}")
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def send_bid_accepted_email(freelancer_email: str, project_title: str):
    send_email_notification.delay(
        freelancer_email,
        f"Ваша заявка принята: {project_title}",
        f"Поздравляем! Заказчик принял вашу заявку на проект «{project_title}».",
    )


@celery_app.task
def send_payment_received_email(freelancer_email: str, project_title: str, amount: str):
    send_email_notification.delay(
        freelancer_email,
        f"Оплата получена: {project_title}",
        f"Заказчик принял работу по проекту «{project_title}». Начислено: {amount} TJS.",
    )


@celery_app.task
def check_deadlines():
    """
    Runs daily. Sends deadline warning notifications to freelancers
    and overdue alerts to clients.
    """
    import os
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    from datetime import date, timedelta
    from database import SessionLocal
    from projects.models import Project, ProjectStatus
    from notifications.models import NotificationType
    from notifications.views import create_notification

    db = SessionLocal()
    try:
        today = date.today()
        in_progress = db.query(Project).filter(
            Project.status == ProjectStatus.in_progress,
            Project.deadline.isnot(None),
            Project.assigned_freelancer_id.isnot(None),
        ).all()

        for project in in_progress:
            days_left = (project.deadline - today).days

            if days_left == 3:
                create_notification(
                    user_id=project.assigned_freelancer_id,
                    type=NotificationType.system,
                    title="Дедлайн через 3 дня",
                    message=f"До дедлайна по проекту «{project.title}» осталось 3 дня.",
                    db=db,
                )
                db.commit()

            elif days_left == 1:
                create_notification(
                    user_id=project.assigned_freelancer_id,
                    type=NotificationType.system,
                    title="Дедлайн завтра!",
                    message=f"Завтра последний день для сдачи работы по проекту «{project.title}».",
                    db=db,
                )
                db.commit()

            elif days_left < 0:
                create_notification(
                    user_id=project.assigned_freelancer_id,
                    type=NotificationType.system,
                    title="Дедлайн просрочен",
                    message=f"Дедлайн по проекту «{project.title}» истёк {abs(days_left)} дн. назад.",
                    db=db,
                )
                create_notification(
                    user_id=project.client_id,
                    type=NotificationType.system,
                    title="Фрилансер просрочил дедлайн",
                    message=f"Дедлайн по проекту «{project.title}» истёк {abs(days_left)} дн. назад. Рассмотрите открытие спора.",
                    db=db,
                )
                db.commit()

    finally:
        db.close()
