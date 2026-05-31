"""
Run once: python seed.py
Populates categories, skills, languages, and creates admin user.
"""
from database import SessionLocal
from categories.models import Category
from skills.models import Skill
from languages.models import Language
from users.models import User, UserRole
from users.auth import hash_password


def seed():
    db = SessionLocal()
    try:
        if db.query(Category).count() > 0:
            print("Already seeded. Skipping.")
            return

        categories_data = [
            {"name": "Разработка", "slug": "development", "icon": "ti-code"},
            {"name": "Дизайн", "slug": "design", "icon": "ti-palette"},
            {"name": "Маркетинг", "slug": "marketing", "icon": "ti-chart-bar"},
            {"name": "Копирайтинг", "slug": "copywriting", "icon": "ti-writing"},
            {"name": "Data & AI", "slug": "data-ai", "icon": "ti-brain"},
            {"name": "Бухгалтерия", "slug": "accounting", "icon": "ti-calculator"},
            {"name": "Поддержка", "slug": "support", "icon": "ti-headset"},
        ]
        categories = {}
        for c in categories_data:
            cat = Category(**c)
            db.add(cat)
            db.flush()
            categories[c["slug"]] = cat

        skills_data = {
            "development": ["Web разработка", "Mobile разработка", "Backend", "AI/ML", "DevOps", "Blockchain"],
            "design": ["UI/UX дизайн", "Графический дизайн", "Логотипы", "Видео монтаж", "3D моделирование"],
            "marketing": ["SMM", "SEO", "Контекстная реклама", "Email маркетинг"],
            "copywriting": ["Тексты", "Переводы", "Сценарии"],
            "data-ai": ["Аналитика данных", "Machine Learning", "Data Science"],
            "accounting": ["Финансы", "Налоги", "Аудит"],
            "support": ["Customer Support", "Virtual Assistant"],
        }
        for slug, skill_names in skills_data.items():
            cat = categories[slug]
            for name in skill_names:
                skill_slug = name.lower().replace(" ", "-").replace("/", "-")
                db.add(Skill(name=name, slug=skill_slug, category_id=cat.id))

        languages_data = [
            ("Русский", "ru"), ("Английский", "en"), ("Таджикский", "tg"),
            ("Узбекский", "uz"), ("Немецкий", "de"), ("Французский", "fr"),
            ("Китайский", "zh"), ("Испанский", "es"),
        ]
        for name, code in languages_data:
            db.add(Language(name=name, code=code))

        if not db.query(User).filter(User.email == "admin@workflow.com").first():
            admin = User(
                email="admin@workflow.com",
                password=hash_password("admin123"),
                role=UserRole.admin,
                full_name="Admin",
            )
            db.add(admin)

        db.commit()
        print("Seed complete.")
        print(f"  Categories: {len(categories_data)}")
        print(f"  Languages: {len(languages_data)}")
        print("  Admin: admin@workflow.com / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
