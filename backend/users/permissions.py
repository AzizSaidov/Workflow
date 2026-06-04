import os
import redis as redis_lib
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from users.models import User
from users.auth import decode_token

bearer = HTTPBearer()
_optional_bearer = HTTPBearer(auto_error=False)

_redis = redis_lib.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    _is_admin = user.is_admin or user.role.value == "admin"
    if user.is_banned and not _is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Аккаунт заблокирован")
    try:
        _redis.setex(f"online:{user.id}", 300, 1)
    except Exception:
        pass
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Security(_optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except Exception:
        return None


def check_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin and current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
