from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from users.models import User, UserRole
from users.schemas import UserCreate, LoginRequest, UserUpdate
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
    db.flush()

    if data.role == UserRole.freelancer:
        from profiles.models import FreelancerProfile
        db.add(FreelancerProfile(user_id=user.id))
    elif data.role == UserRole.client:
        from client_profiles.models import ClientProfile
        db.add(ClientProfile(user_id=user.id))

    db.commit()
    db.refresh(user)
    return user, create_access_token(str(user.id)), create_refresh_token(str(user.id))


def login_user(data: LoginRequest, db: Session) -> tuple[User, str, str]:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user, create_access_token(str(user.id)), create_refresh_token(str(user.id))


def get_all_users(db: Session, role: UserRole | None) -> list[User]:
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.created_at.desc()).all()


def get_user_by_id(user_id: UUID, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def update_user(data: UserUpdate, current_user: User, db: Session) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


def delete_user(current_user: User, db: Session) -> None:
    db.delete(current_user)
    db.commit()
