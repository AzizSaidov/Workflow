import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

celery_app = Celery(
    "workflow",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    include=["tasks.notification_tasks"],
)

from celery.schedules import crontab

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Dushanbe",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "check-deadlines-daily": {
            "task": "tasks.notification_tasks.check_deadlines",
            "schedule": crontab(hour=9, minute=0),
        },
    },
)
