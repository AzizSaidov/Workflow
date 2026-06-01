"""
Async background tasks for notifications and emails.
Run worker: celery -A tasks.celery_app worker --loglevel=info
"""
from tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def send_email_notification(self, to_email: str, subject: str, body: str):
    """Placeholder for email sending. Wire up SMTP/SendGrid here."""
    try:
        # TODO: integrate SMTP or SendGrid
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
