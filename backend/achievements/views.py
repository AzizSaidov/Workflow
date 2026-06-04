from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from achievements.models import Achievement, UserAchievement
from users.models import User, UserRole
from profiles.models import FreelancerProfile
from client_profiles.models import ClientProfile
from projects.models import Project, ProjectStatus
from bids.models import Bid, BidStatus
from escrow.models import Transaction, EscrowStatus
from reviews.models import Review
from portfolio.models import PortfolioItem
from certifications.models import Certification
from profiles.models import SkillToProfile
from notifications.models import Notification, NotificationType


ACHIEVEMENT_DEFINITIONS = [
    # ── Freelancer: первые шаги ───────────────────────────────────────────────
    dict(key="first_bid",        name="Первый шаг",          description="Подал первую заявку на проект",
         icon="send",             color="#7F77DD", points=10,  category="freelancer"),
    dict(key="first_win",        name="Первая победа",        description="Заявка принята впервые",
         icon="trophy",           color="#EF9F27", points=25,  category="freelancer"),
    dict(key="ten_bids",         name="Настойчивый",          description="Подал 10 заявок",
         icon="list-check",       color="#AFA9EC", points=20,  category="freelancer"),
    dict(key="fifty_bids",       name="Охотник за проектами", description="Подал 50 заявок",
         icon="layers",           color="#7F77DD", points=40,  category="freelancer"),

    # ── Freelancer: проекты ───────────────────────────────────────────────────
    dict(key="three_jobs",       name="На старте",            description="Завершил 3 проекта",
         icon="flag",             color="#5DCAA5", points=30,  category="freelancer"),
    dict(key="five_jobs",        name="Профессионал",         description="Завершил 5 проектов",
         icon="briefcase",        color="#5DCAA5", points=50,  category="freelancer"),
    dict(key="ten_jobs",         name="Десятка",              description="Завершил 10 проектов",
         icon="hash",             color="#5DCAA5", points=75,  category="freelancer"),
    dict(key="twenty_jobs",      name="Эксперт",              description="Завершил 20 проектов",
         icon="award",            color="#1D9E75", points=100, category="freelancer"),
    dict(key="fifty_jobs",       name="Ветеран",              description="Завершил 50 проектов",
         icon="medal",            color="#EF9F27", points=200, category="freelancer"),
    dict(key="hundred_jobs",     name="Легенда",              description="Завершил 100 проектов",
         icon="crown",            color="#EF9F27", points=500, category="freelancer"),

    # ── Freelancer: рейтинг и отзывы ─────────────────────────────────────────
    dict(key="top_rated",        name="Высокий рейтинг",      description="Рейтинг 4.8 и выше",
         icon="star",             color="#EF9F27", points=75,  category="freelancer"),
    dict(key="perfect_score",    name="Перфекционист",        description="Рейтинг ровно 5.0",
         icon="sparkles",         color="#EF9F27", points=100, category="freelancer"),
    dict(key="five_reviews",     name="Популярный",           description="Получил 5 отзывов",
         icon="message-star",     color="#EF9F27", points=40,  category="freelancer"),
    dict(key="twenty_reviews",   name="Авторитет",            description="Получил 20 отзывов",
         icon="message-star",     color="#EF9F27", points=80,  category="freelancer"),

    # ── Freelancer: заработок ─────────────────────────────────────────────────
    dict(key="earner_1k",        name="Первая тысяча",        description="Заработал $1,000",
         icon="pig-money",        color="#1D9E75", points=15,  category="freelancer"),
    dict(key="earner_10k",       name="Первые 10K",           description="Заработал $10,000",
         icon="coin",             color="#1D9E75", points=50,  category="freelancer"),
    dict(key="earner_50k",       name="Полтинник",            description="Заработал $50,000",
         icon="cash",             color="#1D9E75", points=100, category="freelancer"),
    dict(key="earner_100k",      name="Большие деньги",       description="Заработал $100,000",
         icon="currency-dollar",  color="#1D9E75", points=200, category="freelancer"),

    # ── Freelancer: профиль ───────────────────────────────────────────────────
    dict(key="verified_pro",     name="Верифицирован",        description="Профиль прошёл верификацию администратором",
         icon="rosette-discount-check", color="#5DCAA5", points=30, category="freelancer"),
    dict(key="portfolio_started",name="Портфолио создано",    description="Добавил первую работу в портфолио",
         icon="photo",            color="#AFA9EC", points=15,  category="freelancer"),
    dict(key="portfolio_rich",   name="Богатое портфолио",    description="5 и более работ в портфолио",
         icon="layout-grid",      color="#7F77DD", points=35,  category="freelancer"),
    dict(key="certified",        name="Сертифицирован",       description="Добавил первый сертификат",
         icon="certificate",      color="#EF9F27", points=20,  category="freelancer"),
    dict(key="skill_master",     name="Мастер навыков",       description="10 и более навыков в профиле",
         icon="tools",            color="#7F77DD", points=25,  category="freelancer"),

    # ── Client: проекты ───────────────────────────────────────────────────────
    dict(key="first_project",    name="Работодатель",         description="Опубликовал первый проект",
         icon="plus",             color="#7F77DD", points=10,  category="client"),
    dict(key="first_complete",   name="Первый успех",         description="Первый завершённый проект",
         icon="circle-check",     color="#5DCAA5", points=25,  category="client"),
    dict(key="five_projects",    name="Серийный",             description="Завершил 5 проектов",
         icon="briefcase",        color="#5DCAA5", points=75,  category="client"),
    dict(key="ten_projects",     name="Активный заказчик",    description="Завершил 10 проектов",
         icon="building",         color="#1D9E75", points=150, category="client"),

    # ── Client: расходы ───────────────────────────────────────────────────────
    dict(key="spender_1k",       name="Первая инвестиция",    description="Потратил $1,000 через эскроу",
         icon="wallet",           color="#AFA9EC", points=15,  category="client"),
    dict(key="spender_10k",      name="Инвестор",             description="Потратил $10,000 через эскроу",
         icon="wallet",           color="#7F77DD", points=50,  category="client"),
    dict(key="big_spender",      name="Крупный игрок",        description="Потратил $100,000 через эскроу",
         icon="diamond",          color="#1D9E75", points=150, category="client"),

    # ── Client: команда ───────────────────────────────────────────────────────
    dict(key="loyal_client",     name="Постоянный клиент",    description="Работал с 3 и более разными фрилансерами",
         icon="thumb-up",         color="#F87171", points=50,  category="client"),
    dict(key="team_builder",     name="Строитель команды",    description="Работал с 10 разными фрилансерами",
         icon="users",            color="#F87171", points=100, category="client"),
    dict(key="good_reviewer",    name="Честный отзыв",        description="Оставил первый отзыв о фрилансере",
         icon="message-star",     color="#EF9F27", points=15,  category="client"),

    # ── General ──────────────────────────────────────────────────────────────
    dict(key="profile_filled",   name="Полный профиль",       description="Заполнил аватар, имя и описание",
         icon="user-check",       color="#7F77DD", points=20,  category="general"),
    dict(key="rising_star",      name="Восходящая звезда",    description="Заполнил профиль в первые 30 дней",
         icon="rocket",           color="#AFA9EC", points=15,  category="general"),
    dict(key="year_member",      name="Годовщина",            description="1 год на платформе",
         icon="calendar-event",   color="#7F77DD", points=50,  category="general"),
]


def ensure_achievements_exist(db: Session):
    for d in ACHIEVEMENT_DEFINITIONS:
        existing = db.query(Achievement).filter(Achievement.key == d["key"]).first()
        if existing:
            existing.icon = d["icon"]
            existing.color = d["color"]
            existing.name = d["name"]
            existing.points = d["points"]
        else:
            db.add(Achievement(**d))
    db.commit()


def _grant(user_id, key: str, db: Session) -> bool:
    ach = db.query(Achievement).filter(Achievement.key == key).first()
    if not ach:
        return False
    try:
        db.add(UserAchievement(user_id=user_id, achievement_id=ach.id))
        db.flush()
        db.add(Notification(
            user_id=user_id,
            type=NotificationType.achievement,
            title=f"Новое достижение: {ach.name}",
            message=ach.description,
            icon=ach.icon,
            color=ach.color,
            points=ach.points,
        ))
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

    # ── Заявки ──────────────────────────────────────────────────────────────
    total_bids = db.query(Bid).filter(Bid.freelancer_id == user.id).count()
    if total_bids >= 1:
        _grant(user.id, "first_bid", db)
    if total_bids >= 10:
        _grant(user.id, "ten_bids", db)
    if total_bids >= 50:
        _grant(user.id, "fifty_bids", db)

    accepted_bids = db.query(Bid).filter(
        Bid.freelancer_id == user.id, Bid.status == BidStatus.accepted
    ).count()
    if accepted_bids >= 1:
        _grant(user.id, "first_win", db)

    # ── Проекты ──────────────────────────────────────────────────────────────
    completed = db.query(Project).filter(
        Project.assigned_freelancer_id == user.id,
        Project.status == ProjectStatus.completed,
    ).count()
    if completed >= 3:
        _grant(user.id, "three_jobs", db)
    if completed >= 5:
        _grant(user.id, "five_jobs", db)
    if completed >= 10:
        _grant(user.id, "ten_jobs", db)
    if completed >= 20:
        _grant(user.id, "twenty_jobs", db)
    if completed >= 50:
        _grant(user.id, "fifty_jobs", db)
    if completed >= 100:
        _grant(user.id, "hundred_jobs", db)

    # ── Рейтинг ──────────────────────────────────────────────────────────────
    if float(profile.rating) >= 4.8:
        _grant(user.id, "top_rated", db)
    if float(profile.rating) >= 5.0:
        _grant(user.id, "perfect_score", db)

    # ── Отзывы ───────────────────────────────────────────────────────────────
    review_count = db.query(Review).filter(Review.reviewee_id == user.id).count()
    if review_count >= 5:
        _grant(user.id, "five_reviews", db)
    if review_count >= 20:
        _grant(user.id, "twenty_reviews", db)

    # ── Верификация ───────────────────────────────────────────────────────────
    if profile.is_verified:
        _grant(user.id, "verified_pro", db)

    # ── Заработок ────────────────────────────────────────────────────────────
    earned = db.query(Transaction).filter(
        Transaction.freelancer_id == user.id, Transaction.status == EscrowStatus.released,
    ).all()
    total = sum(float(t.amount) for t in earned)
    if total >= 1000:
        _grant(user.id, "earner_1k", db)
    if total >= 10000:
        _grant(user.id, "earner_10k", db)
    if total >= 50000:
        _grant(user.id, "earner_50k", db)
    if total >= 100000:
        _grant(user.id, "earner_100k", db)

    # ── Портфолио ────────────────────────────────────────────────────────────
    portfolio_count = db.query(PortfolioItem).filter(PortfolioItem.user_id == user.id).count()
    if portfolio_count >= 1:
        _grant(user.id, "portfolio_started", db)
    if portfolio_count >= 5:
        _grant(user.id, "portfolio_rich", db)

    # ── Сертификаты ──────────────────────────────────────────────────────────
    cert_count = db.query(Certification).filter(Certification.profile_id == profile.id).count()
    if cert_count >= 1:
        _grant(user.id, "certified", db)

    # ── Навыки ───────────────────────────────────────────────────────────────
    skill_count = db.query(SkillToProfile).filter(SkillToProfile.profile_id == profile.id).count()
    if skill_count >= 10:
        _grant(user.id, "skill_master", db)


def _check_client(user: User, db: Session):
    # ── Проекты ──────────────────────────────────────────────────────────────
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
    if completed >= 10:
        _grant(user.id, "ten_projects", db)

    # ── Расходы ──────────────────────────────────────────────────────────────
    spent_txns = db.query(Transaction).filter(
        Transaction.client_id == user.id, Transaction.status == EscrowStatus.released,
    ).all()
    total_spent = sum(float(t.amount) for t in spent_txns)
    if total_spent >= 1000:
        _grant(user.id, "spender_1k", db)
    if total_spent >= 10000:
        _grant(user.id, "spender_10k", db)
    if total_spent >= 100000:
        _grant(user.id, "big_spender", db)

    # ── Команда фрилансеров ───────────────────────────────────────────────────
    freelancer_ids = db.query(Project.assigned_freelancer_id).filter(
        Project.client_id == user.id,
        Project.status == ProjectStatus.completed,
        Project.assigned_freelancer_id.isnot(None),
    ).distinct().count()
    if freelancer_ids >= 3:
        _grant(user.id, "loyal_client", db)
    if freelancer_ids >= 10:
        _grant(user.id, "team_builder", db)

    # ── Отзывы ───────────────────────────────────────────────────────────────
    given_reviews = db.query(Review).filter(Review.reviewer_id == user.id).count()
    if given_reviews >= 1:
        _grant(user.id, "good_reviewer", db)


def _check_general(user: User, db: Session):
    from datetime import timezone, timedelta
    from utils import get_dushanbe_time

    # ── Профиль заполнен ─────────────────────────────────────────────────────
    if user.avatar_url and user.bio and user.full_name:
        _grant(user.id, "profile_filled", db)

    # ── Дни на платформе ─────────────────────────────────────────────────────
    if user.created_at:
        now = get_dushanbe_time()
        created = user.created_at if user.created_at.tzinfo else user.created_at.replace(tzinfo=timezone.utc)
        days_on_platform = (now - created).days
        if user.avatar_url and user.bio and user.full_name and days_on_platform <= 30:
            _grant(user.id, "rising_star", db)
        if days_on_platform >= 365:
            _grant(user.id, "year_member", db)


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
