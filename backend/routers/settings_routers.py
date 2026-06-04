import os
import redis as redis_lib
from fastapi import APIRouter, Depends
from users.permissions import check_admin
from users.models import User

settings_router = APIRouter(prefix="/api/settings", tags=["settings"])
admin_settings_router = APIRouter(prefix="/api/admin/settings", tags=["admin-settings"])

_redis = redis_lib.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)

HOLIDAY_KEY = "site:holiday_mode"


@settings_router.get("/public")
def get_public_settings():
    return {"holiday_mode": _redis.get(HOLIDAY_KEY) == "1"}


@admin_settings_router.get("/")
def get_settings(_: User = Depends(check_admin)):
    return {"holiday_mode": _redis.get(HOLIDAY_KEY) == "1"}


@admin_settings_router.post("/holiday-mode/toggle")
def toggle_holiday(_: User = Depends(check_admin)):
    current = _redis.get(HOLIDAY_KEY) == "1"
    if current:
        _redis.delete(HOLIDAY_KEY)
    else:
        _redis.set(HOLIDAY_KEY, "1")
    return {"holiday_mode": not current}
