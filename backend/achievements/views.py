from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from achievements.models import Achievement, UserAchievement
from users.models import User, UserRole
from profiles.models import FreelancerProfile
from client_profiles.models import ClientProfile
from projects.models import Project, ProjectStatus
from bids.models import Bid
from escrow.models import Transaction, EscrowStatus


ACHIEVEMENT_DEFINITIONS = [
    # ── Freelancer achievements ───────────────────────────────────────────────
    dict(key="first_bid",      name="Первый шаг",       description="Подал первую заявку",
         icon="send",          color="#7F77DD", points=10, category="freelancer"),
    dict(key="first_win",      name="Первая победа",    description="Первая принятая заявка",
         icon="trophy",        color="#EF9F27", points=25, category="freelancer"),
    dict(key="five_jobs",      name="Профессионал",     description="Завершил 5 проектов",
         icon="briefcase",     color="#5DCAA5", points=50, category="freelancer"),
    dict(key="twenty_jobs",    name="Эксперт",          description="Завершил 20 проектов",
         icon="award",         color="#5DCAA5", points=100, category="freelancer"),
    dict(key="fifty_jobs",     name="Ветеран",          description="Завершил 50 проектов",
         icon="medal",         color="#EF9F27", points=200, category="freelancer"),
    dict(key="top_rated",      name="Высокий рейтинг",  description="Рейтинг 4.8 и выше",
         icon="star-filled",   color="#EF9F27", points=75, category="freelancer"),
    dict(key="perfect_score",  name="Перфекционист",    description="Рейтинг 5.0",
         icon="star",          color="#EF9F27", points=100, category="freelancer"),
    dict(key="earner_10k",     name="Первые 10K",       description="Заработал 10,000 TJS",
         icon="coin",          color="#1D9E75", points=50, category="freelancer"),
    dict(key="earner_100k",    name="Большие деньги",   description="Заработал 100,000 TJS",
         icon="currency-dollar", color="#1D9E75", points=150, category="freelancer"),
    dict(key="verified_pro",   name="Верифицирован",    description="Профиль прошёл верификацию",
         icon="rosette-discount-check", color="#5DCAA5", points=30, category="freelancer"),
    # ── Client achievements ───────────────────────────────────────────────────
    dict(key="first_project",  name="Работодатель",     description="Опубликовал первый проект",
         icon="plus",          color="#7F77DD", points=10, category="client"),
    dict(key="first_complete", name="Первый успех",     description="Первый завершённый проект",
         icon="circle-check",  color="#5DCAA5", points=25, category="client"),
    dict(key="five_projects",  name="Серийный",         description="Завершил 5 проектов",
         icon="briefcase",     color="#5DCAA5", points=75, category="client"),
    dict(key="big_spender",    name="Инвестор",         description="Потратил 100,000 TJS",
         icon="wallet",        color="#1D9E75", points=100, category="client"),
    dict(key="loyal_client",   name="Постоянный клиент", description="Работал с 3+ фрилансерами",
         icon="heart",         color="#F87171", points=50, category="client"),
    # ── General achievements ──────────────────────────────────────────────────
    dict(key="profile_filled", name="Полный профиль",   description="Заполнил все данные профиля",
         icon="user-check",    color="#7F77DD", points=20, category="general"),
    dict(key="rising_star",    name="Восходящая звезда", description="Первые 30 дней на платформе",
         icon="rocket",        color="#AFA9EC", points=15, category="general"),
]


def ensure_achievements_exist(db: Session):
    for d in ACHIEVEMENT_DEFINITIONS:
        if not db.query(Achievement).filter(Achievement.key == d["key"]).first():
            db.add(Achievement(**d))
    db.commit()


def _grant(user_id, key: str, db: Session) -> bool:
    ach = db.query(Achievement).filter(Achievement.key == key).first()
    if not ach:
        return False
    try:
        db.add(UserAchievement(user_id=user_id, achievement_id=ach.id))
        db.flush()
        return True
    except IntegrityError:
        db.rollback()
        return False


def check_and_grant(user: User, db: Session):
    """Call after any significant action to grant earned achievements."""
    try:
        if user.role == UserRole.freelancer:
            _check_freelancer(user, db)
        elif user.role == UserRole.client:
            _check_client(user, db)
        _check_general(user, db)
        db.commit()
    except Exception:
        db.rollback()


def _check_freelancer(user: User, db: Session):
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == user.id).first()
    if not profile:
        return

    total_bids = db.query(Bid).filter(Bid.freelancer_id == user.id).count()
    if total_bids >= 1:
        _grant(user.id, "first_bid", db)

    accepted_bids = db.query(Bid).filter(Bid.freelancer_id == user.id, Bid.status == "accepted").count()
    if accepted_bids >= 1:
        _grant(user.id, "first_win", db)

    completed = db.query(Project).filter(
        Project.assigned_freelancer_id == user.id,
        Project.status == ProjectStatus.completed,
    ).count()
    if completed >= 5:
        _grant(user.id, "five_jobs", db)
    if completed >= 20:
        _grant(user.id, "twenty_jobs", db)
    if completed >= 50:
        _grant(user.id, "fifty_jobs", db)

    if float(profile.rating) >= 4.8:
        _grant(user.id, "top_rated", db)
    if float(profile.rating) >= 5.0:
        _grant(user.id, "perfect_score", db)

    if profile.is_verified:
        _grant(user.id, "verified_pro", db)

    earned = db.query(Transaction).filter(
        Transaction.freelancer_id == user.id, Transaction.status == EscrowStatus.released,
    ).all()
    total = sum(float(t.amount) for t in earned)
    if total >= 10000:
        _grant(user.id, "earner_10k", db)
    if total >= 100000:
        _grant(user.id, "earner_100k", db)


def _check_client(user: User, db: Session):
    total_proj = db.query(Project).filter(Project.client_id == user.id).count()
    if total_proj >= 1:
        _grant(user.id, "first_project", db)

    completed = db.query(Project).filter(
        Project.client_id == user.id, Project.status == ProjectStatus.completed,
    ).count()
    if completed >= 1:
        _grant(user.id, "first_complete", db)
    if completed >= 5:
        _grant(user.id, "five_projects", db)

    spent = db.query(Transaction).filter(
        Transaction.client_id == user.id, Transaction.status == EscrowStatus.released,
    ).all()
    total = sum(float(t.amount) for t in spent)
    if total >= 100000:
        _grant(user.id, "big_spender", db)

    # worked with 3+ different freelancers
    freelancer_ids = db.query(Project.assigned_freelancer_id).filter(
        Project.client_id == user.id,
        Project.status == ProjectStatus.completed,
        Project.assigned_freelancer_id.isnot(None),
    ).distinct().count()
    if freelancer_ids >= 3:
        _grant(user.id, "loyal_client", db)


def _check_general(user: User, db: Session):
    if user.avatar_url and user.bio and user.full_name:
        _grant(user.id, "profile_filled", db)


def get_user_achievements(user_id: UUID, db: Session) -> list[dict]:
    rows = (
        db.query(UserAchievement, Achievement)
        .join(Achievement, Achievement.id == UserAchievement.achievement_id)
        .filter(UserAchievement.user_id == user_id)
        .order_by(UserAchievement.earned_at.desc())
        .all()
    )
    result = []
    for ua, ach in rows:
        result.append({
            "id": ua.id,
            "earned_at": ua.earned_at,
            "achievement": {
                "id": ach.id, "key": ach.key, "name": ach.name,
                "description": ach.description, "icon": ach.icon,
                "color": ach.color, "points": ach.points, "category": ach.category,
            },
        })
    return result


def get_all_achievements(db: Session) -> list[Achievement]:
    return db.query(Achievement).order_by(Achievement.category, Achievement.points).all()
