from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from users.models import User
from users.schemas import UserCreate, LoginRequest
from users.auth import hash_password, verify_password, create_access_token, create_refresh_token


def register_user(data: UserCreate, db: Session) -> tuple[User, str, str]:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        full_name=data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, create_access_token(str(user.id)), create_refresh_token(str(user.id))


def login_user(data: LoginRequest, db: Session) -> tuple[User, str, str]:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user, create_access_token(str(user.id)), create_refresh_token(str(user.id))
