"""
Unified seed script — resets and populates the database with demo data.

Usage (from backend/ directory):
    python seed.py           — add data if not exists
    python seed.py --force   — DROP schema, recreate, seed fresh
"""
import sys
import os
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from users.auth import hash_password
from utils import get_dushanbe_time

from users.models import User, UserRole
from wallet.models import Wallet
from categories.models import Category
from skills.models import Skill
from languages.models import Language
from profiles.models import FreelancerProfile, SkillToProfile, ProfileLanguage, LanguageLevel
from client_profiles.models import ClientProfile
from projects.models import Project, ProjectStatus
from bids.models import Bid, BidStatus
from contracts.models import Contract, ContractStatus
from escrow.models import Transaction, EscrowStatus
from reviews.models import Review
from certifications.models import Certification
from portfolio.models import PortfolioItem
from achievements.models import Achievement, UserAchievement
from favorites.models import Favorite
from notifications.models import Notification
from disputes.models import DisputeMessage
from reports.models import Report

Base.metadata.create_all(bind=engine)


def dt(days_ago: int = 0) -> datetime:
    return get_dushanbe_time() - timedelta(days=days_ago)


ALL_SKILLS = {
    "web-dev": [
        ("React", "react"), ("Vue.js", "vuejs"), ("FastAPI", "fastapi"),
        ("Node.js", "nodejs"), ("PostgreSQL", "postgresql"), ("TypeScript", "typescript"),
        ("JavaScript", "javascript"), ("Python", "python-web"), ("C#", "csharp"),
        ("C++", "cpp"), ("C", "c"), ("Java", "java"), ("Go", "go"),
        ("Rust", "rust"), ("PHP", "php"), ("Ruby", "ruby"),
        ("Next.js", "nextjs"), ("Nuxt.js", "nuxtjs"), ("Django", "django"),
        ("Laravel", "laravel"), ("Spring", "spring"), (".NET", "dotnet"),
        ("MongoDB", "mongodb"), ("Redis", "redis"), ("GraphQL", "graphql"),
        ("REST API", "rest-api"), ("Bash", "bash"), ("Svelte", "svelte"),
        ("Angular", "angular"), ("Express.js", "expressjs"),
    ],
    "mobile-dev": [
        ("Flutter", "flutter"), ("React Native", "react-native"),
        ("Swift", "swift"), ("Kotlin", "kotlin"),
        ("Objective-C", "objc"), ("Xamarin", "xamarin"), ("Ionic", "ionic"),
    ],
    "design": [
        ("Figma", "figma"), ("Adobe XD", "adobe-xd"), ("Illustrator", "illustrator"),
        ("Photoshop", "photoshop"), ("Blender 3D", "blender"), ("Sketch", "sketch"),
        ("InDesign", "indesign"), ("Canva", "canva"),
    ],
    "data-ai": [
        ("Python", "python"), ("TensorFlow", "tensorflow"), ("PyTorch", "pytorch"),
        ("Pandas", "pandas"), ("SQL", "sql"), ("R", "r-lang"), ("Scala", "scala"),
        ("Jupyter", "jupyter"), ("NumPy", "numpy"), ("Scikit-learn", "sklearn"),
        ("OpenCV", "opencv"), ("LangChain", "langchain"), ("OpenAI API", "openai-api"),
        ("Hugging Face", "huggingface"), ("Apache Spark", "spark"),
    ],
    "marketing": [
        ("Google Ads", "google-ads"), ("Facebook Ads", "facebook-ads"),
        ("SEO", "seo"), ("Email Marketing", "email-marketing"),
        ("TikTok Ads", "tiktok-ads"), ("Analytics", "analytics"),
        ("Copywriting", "copywriting-marketing"),
    ],
    "writing": [
        ("Копирайтинг", "copywriting"), ("Технический текст", "tech-writing"),
        ("Перевод RU-EN", "translation-ru-en"), ("Сценарии", "scripts"),
        ("Перевод EN-ZH", "translation-en-zh"), ("Редактура", "editing"),
    ],
    "devops": [
        ("Docker", "docker"), ("Kubernetes", "kubernetes"), ("AWS", "aws"),
        ("GitHub Actions", "github-actions"), ("Terraform", "terraform"),
        ("Linux", "linux"), ("Nginx", "nginx"), ("CI/CD", "cicd"),
        ("Ansible", "ansible"), ("GCP", "gcp"), ("Azure", "azure"),
        ("Prometheus", "prometheus"), ("Grafana", "grafana"),
    ],
    "security": [
        ("Penetration Testing", "pentest"), ("OWASP", "owasp"),
        ("Bug Bounty", "bug-bounty"), ("Burp Suite", "burp-suite"),
        ("Metasploit", "metasploit"), ("Wireshark", "wireshark"),
        ("Network Security", "network-security"),
    ],
    "video": [
        ("Premiere Pro", "premiere"), ("After Effects", "after-effects"),
        ("DaVinci Resolve", "davinci"), ("Cinema 4D", "cinema4d"),
        ("Final Cut Pro", "final-cut"), ("Motion Graphics", "motion-graphics"),
    ],
    "finance": [
        ("1С:Бухгалтерия", "1c"), ("Excel / VBA", "excel-vba"),
        ("МСФО", "ifrs"), ("Финансовый анализ", "financial-analysis"),
        ("QuickBooks", "quickbooks"), ("GAAP", "gaap"),
    ],
}


def _sync_skills(db):
    added = 0
    for cat_slug, skill_list in ALL_SKILLS.items():
        cat = db.query(Category).filter(Category.slug == cat_slug).first()
        if not cat:
            continue
        for name, slug in skill_list:
            if not db.query(Skill).filter(Skill.slug == slug).first():
                db.add(Skill(name=name, slug=slug, category_id=cat.id))
                added += 1
    if added:
        db.commit()
        print(f"  + {added} new skills synced.")
    else:
        print("  Skills already up to date.")


def seed():
    force = "--force" in sys.argv

    if force:
        print("Force mode: resetting database...")
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
            conn.commit()
        Base.metadata.create_all(bind=engine)
        print("Database reset complete.")

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "timur@techcorp.tj").first():
            print("Already seeded — syncing skills only...")
            _sync_skills(db)
            print("Done.")
            return

        print("Seeding database...")

        # ── CATEGORIES ──────────────────────────────────────────────────────
        cats_data = [
            ("Веб-разработка",       "web-dev",      "ti-code",          "Сайты, веб-приложения, API"),
            ("Мобильная разработка", "mobile-dev",   "ti-device-mobile", "iOS, Android, Flutter"),
            ("Дизайн и UI/UX",       "design",       "ti-palette",       "Логотипы, интерфейсы, графика"),
            ("Data Science и AI",    "data-ai",      "ti-brain",         "ML, аналитика, нейросети"),
            ("Маркетинг и SEO",      "marketing",    "ti-speakerphone",  "Реклама, SMM, SEO"),
            ("Копирайтинг",          "writing",      "ti-pencil",        "Тексты, переводы, контент"),
            ("DevOps и облако",      "devops",       "ti-cloud",         "CI/CD, Docker, AWS, Kubernetes"),
            ("Кибербезопасность",    "security",     "ti-shield-lock",   "Pentest, аудит безопасности"),
            ("Видео и анимация",     "video",        "ti-video",         "Монтаж, 2D/3D анимация, motion"),
            ("Финансы и бухучёт",    "finance",      "ti-calculator",    "1С, бухгалтерия, финанализ"),
        ]
        cats = {}
        for name, slug, icon, desc in cats_data:
            c = Category(name=name, slug=slug, icon=icon, description=desc, is_active=True)
            db.add(c)
            cats[slug] = c
        db.flush()

        # ── SKILLS ──────────────────────────────────────────────────────────
        skills = {}
        for cat_slug, skill_list in ALL_SKILLS.items():
            for skill_name, skill_slug in skill_list:
                s = Skill(name=skill_name, slug=skill_slug, category_id=cats[cat_slug].id)
                db.add(s)
                skills[skill_slug] = s
        db.flush()

        # ── LANGUAGES ───────────────────────────────────────────────────────
        langs_raw = [
            ("Русский", "ru"), ("Английский", "en"), ("Таджикский", "tg"),
            ("Узбекский", "uz"), ("Казахский", "kk"), ("Немецкий", "de"),
            ("Китайский", "zh"), ("Испанский", "es"), ("Французский", "fr"),
            ("Арабский", "ar"),
        ]
        langs = {}
        for name, code in langs_raw:
            la = Language(name=name, code=code)
            db.add(la)
            langs[code] = la
        db.flush()

        # ── HELPER ──────────────────────────────────────────────────────────
        def make_user(email, pw, role, full_name, bio, lat, lng, avatar=None):
            u = User(
                email=email, password=hash_password(pw), role=role,
                full_name=full_name, bio=bio, latitude=lat, longitude=lng,
                avatar_url=avatar,
            )
            db.add(u)
            db.flush()
            w = Wallet(user_id=u.id, balance=Decimal("0"), frozen=Decimal("0"))
            db.add(w)
            return u, w

        # ── ADMIN ───────────────────────────────────────────────────────────
        admin, admin_w = make_user(
            "admin@workflow.com", "admin123", UserRole.admin,
            "Admin", "Workflow platform administrator.", 38.56, 68.77,
            "https://i.pravatar.cc/150?u=admin@workflow.com",
        )
        admin_w.balance = Decimal("50000")

        # ── CLIENTS (6) ─────────────────────────────────────────────────────
        clients_raw = [
            {
                "email": "timur@techcorp.tj", "pw": "pass123",
                "name": "Timur Rashidov",
                "bio": "Founder of TechCorp. Building IT products for emerging markets in Central Asia.",
                "lat": 38.56, "lng": 68.77,
                "avatar": "https://i.pravatar.cc/150?u=timur@techcorp.tj",
                "company": "TechCorp", "website": "https://techcorp.tj",
                "location": "Dushanbe, Tajikistan", "balance": Decimal("9500"),
            },
            {
                "email": "amina@greenleaf.com", "pw": "pass123",
                "name": "Amina Usupova",
                "bio": "Owner of GreenLeaf Digital. We help regional businesses grow online.",
                "lat": 41.30, "lng": 69.24,
                "avatar": "https://i.pravatar.cc/150?u=amina@greenleaf.com",
                "company": "GreenLeaf Digital", "website": "https://greenleaf.com",
                "location": "Tashkent, Uzbekistan", "balance": Decimal("4200"),
            },
            {
                "email": "damir@fintech.kz", "pw": "pass123",
                "name": "Damir Seitkali",
                "bio": "CTO of PayEasy — building next-gen payment infrastructure for Kazakhstan.",
                "lat": 43.22, "lng": 76.85,
                "avatar": "https://i.pravatar.cc/150?u=damir@fintech.kz",
                "company": "PayEasy", "website": "https://payeasy.kz",
                "location": "Almaty, Kazakhstan", "balance": Decimal("11000"),
            },
            {
                "email": "sofia@designstudio.de", "pw": "pass123",
                "name": "Sofia Muller",
                "bio": "Art Director at Muller Design Studio. Partnering with European SaaS brands.",
                "lat": 52.52, "lng": 13.40,
                "avatar": "https://i.pravatar.cc/150?u=sofia@designstudio.de",
                "company": "Muller Design Studio", "website": "https://muller.design",
                "location": "Berlin, Germany", "balance": Decimal("7800"),
            },
            {
                "email": "chen@aiventures.cn", "pw": "pass123",
                "name": "Chen Wei",
                "bio": "CEO of AI Ventures. Investing in and building AI-first products for Asian markets.",
                "lat": 31.23, "lng": 121.47,
                "avatar": "https://i.pravatar.cc/150?u=chen@aiventures.cn",
                "company": "AI Ventures", "website": "https://aiventures.cn",
                "location": "Shanghai, China", "balance": Decimal("15000"),
            },
            {
                "email": "carlos@agencia.mx", "pw": "pass123",
                "name": "Carlos Mendez",
                "bio": "Founder of Agencia Digital. Full-service digital agency serving Latin American brands.",
                "lat": 19.43, "lng": -99.13,
                "avatar": "https://i.pravatar.cc/150?u=carlos@agencia.mx",
                "company": "Agencia Digital", "website": "https://agencia.mx",
                "location": "Mexico City, Mexico", "balance": Decimal("6300"),
            },
        ]

        clients = []
        for cd in clients_raw:
            u, w = make_user(cd["email"], cd["pw"], UserRole.client,
                             cd["name"], cd["bio"], cd["lat"], cd["lng"], cd["avatar"])
            w.balance = cd["balance"]
            db.add(ClientProfile(
                user_id=u.id, company_name=cd["company"], website=cd["website"],
                description=cd["bio"], location=cd["location"],
                total_spent=Decimal("0"), total_projects=0, is_verified=True,
            ))
            clients.append(u)
        db.flush()

        # ── FREELANCERS (10) ─────────────────────────────────────────────────
        freelancers_raw = [
            # 0
            {
                "email": "alexei@dev.ru", "pw": "pass123",
                "name": "Alexei Voronov", "lat": 55.75, "lng": 37.62,
                "avatar": "https://i.pravatar.cc/150?u=alexei@dev.ru",
                "bio": "Full-stack developer, 7 years. React + FastAPI + PostgreSQL. 47 projects delivered on time.",
                "title": "Senior Full-Stack Developer", "cat": "web-dev",
                "rate": 55, "exp": 7, "rating": "4.87", "jobs": 47, "balance": "3200",
                "verified": True, "resp": "within 1 hour",
                "skills": ["react", "fastapi", "typescript", "postgresql", "docker", "redis"],
                "langs": [("ru", "native"), ("en", "fluent")],
                "certs": [
                    ("AWS Certified Developer", "Amazon Web Services", "2023-03-15", "https://aws.amazon.com/cert/123"),
                    ("Meta React Developer Certificate", "Meta", "2022-08-20", None),
                ],
                "portfolio": [
                    ("E-Commerce Platform", "Full-stack online store with AI recommendations and real-time inventory. 200k+ orders processed.", "https://picsum.photos/seed/p1/800/500", "https://github.com/alexei/ecommerce"),
                    ("CRM System", "CRM for 50+ agent teams. Real-time analytics, Telegram notifications, pipeline management.", "https://picsum.photos/seed/p2/800/500", None),
                    ("SaaS Billing Dashboard", "Subscription management + Stripe integration for a B2B SaaS company.", "https://picsum.photos/seed/p20/800/500", None),
                ],
                "github": "https://github.com/alexeivoronov",
            },
            # 1
            {
                "email": "zara@flutter.dev", "pw": "pass123",
                "name": "Zara Ismailova", "lat": 41.30, "lng": 69.24,
                "avatar": "https://i.pravatar.cc/150?u=zara@flutter.dev",
                "bio": "Mobile developer specializing in Flutter (iOS+Android) + Firebase backend. 31 shipped apps.",
                "title": "Flutter / Mobile Developer", "cat": "mobile-dev",
                "rate": 45, "exp": 4, "rating": "4.62", "jobs": 31, "balance": "1950",
                "verified": True, "resp": "within 2 hours",
                "skills": ["flutter", "react-native", "kotlin", "swift"],
                "langs": [("ru", "native"), ("en", "conversational"), ("uz", "native")],
                "certs": [("Google Flutter Certified", "Google", "2023-06-01", None)],
                "portfolio": [
                    ("FoodDelivery App", "Food delivery for 3 cities — 50k+ downloads, 4.8★ on App Store.", "https://picsum.photos/seed/p3/800/500", "https://play.google.com/store/apps/zara"),
                    ("HealthTracker", "Health tracker with Apple Health / Google Fit integration.", "https://picsum.photos/seed/p4/800/500", None),
                    ("EdTech App", "Learning platform with video lessons, quizzes and offline mode.", "https://picsum.photos/seed/p21/800/500", None),
                ],
                "github": "https://github.com/zaraismail",
            },
            # 2
            {
                "email": "marco@design.it", "pw": "pass123",
                "name": "Marco Ferrari", "lat": 41.90, "lng": 12.50,
                "avatar": "https://i.pravatar.cc/150?u=marco@design.it",
                "bio": "Senior UI/UX Designer & Brand Identity specialist. 9 years. Working with European and US startups.",
                "title": "Senior UI/UX Designer", "cat": "design",
                "rate": 75, "exp": 9, "rating": "4.95", "jobs": 89, "balance": "6800",
                "verified": True, "resp": "within 30 minutes",
                "skills": ["figma", "adobe-xd", "illustrator", "photoshop", "blender", "sketch"],
                "langs": [("en", "native"), ("de", "fluent")],
                "certs": [
                    ("Google UX Design Certificate", "Google", "2021-11-10", None),
                    ("Figma for Advanced Teams", "Figma Inc.", "2022-04-05", None),
                ],
                "portfolio": [
                    ("SaaS Dashboard Redesign", "B2B SaaS redesign — conversion rate +40% after launch.", "https://picsum.photos/seed/p5/800/500", None),
                    ("FinTech Brand Identity", "Complete brand identity for a payment startup: logo, colors, motion guidelines.", "https://picsum.photos/seed/p6/800/500", None),
                    ("Mobile Banking UI", "Full design system for mobile bank app — 120+ components in Figma.", "https://picsum.photos/seed/p7/800/500", None),
                    ("E-Commerce App UI", "iOS/Android shopping app design — A/B tested, conversion +28%.", "https://picsum.photos/seed/p22/800/500", None),
                ],
                "github": None,
            },
            # 3
            {
                "email": "aisha@ailab.kz", "pw": "pass123",
                "name": "Aisha Bekova", "lat": 43.22, "lng": 76.85,
                "avatar": "https://i.pravatar.cc/150?u=aisha@ailab.kz",
                "bio": "Data Scientist & ML Engineer. NLP, computer vision, MLOps pipelines. PhD in Applied Math.",
                "title": "Data Scientist & ML Engineer", "cat": "data-ai",
                "rate": 65, "exp": 5, "rating": "4.73", "jobs": 22, "balance": "3600",
                "verified": True, "resp": "within 3 hours",
                "skills": ["python", "tensorflow", "pytorch", "pandas", "sql", "sklearn", "langchain"],
                "langs": [("ru", "native"), ("en", "fluent"), ("kk", "native")],
                "certs": [
                    ("Deep Learning Specialization", "Coursera / DeepLearning.AI", "2022-09-01", "https://coursera.org/cert/dl"),
                    ("Google Professional Data Engineer", "Google", "2023-02-14", None),
                ],
                "portfolio": [
                    ("Fraud Detection System", "ML pipeline for real-time fraud detection — 94% precision, $2M losses prevented.", "https://picsum.photos/seed/p8/800/500", "https://github.com/aisha/fraud-detector"),
                    ("NLP Sentiment Analysis", "Multilingual sentiment pipeline for retail chain — processes 50k reviews/day.", "https://picsum.photos/seed/p9/800/500", None),
                    ("Recommendation Engine", "Collaborative filtering + content-based for e-commerce — CTR +35%.", "https://picsum.photos/seed/p23/800/500", None),
                ],
                "github": "https://github.com/aishabekova",
            },
            # 4
            {
                "email": "bekzod@devops.uz", "pw": "pass123",
                "name": "Bekzod Yusupov", "lat": 41.30, "lng": 69.24,
                "avatar": "https://i.pravatar.cc/150?u=bekzod@devops.uz",
                "bio": "Senior DevOps Engineer. Kubernetes, AWS/GCP, Terraform, CI/CD. 6 years in production infra.",
                "title": "Senior DevOps / Cloud Engineer", "cat": "devops",
                "rate": 60, "exp": 6, "rating": "4.41", "jobs": 38, "balance": "2200",
                "verified": True, "resp": "within 1 hour",
                "skills": ["docker", "kubernetes", "aws", "github-actions", "terraform", "linux", "grafana", "prometheus"],
                "langs": [("ru", "fluent"), ("en", "fluent"), ("uz", "native")],
                "certs": [
                    ("AWS Solutions Architect Professional", "Amazon", "2023-05-20", "https://aws.amazon.com/cert/456"),
                    ("Certified Kubernetes Administrator (CKA)", "CNCF", "2022-12-01", None),
                ],
                "portfolio": [
                    ("Kubernetes Migration", "Migrated monolith to K8s — infra cost reduced 60%, zero-downtime deploys.", "https://picsum.photos/seed/p10/800/500", "https://github.com/bekzod/k8s-case"),
                    ("GitOps Pipeline", "Full GitOps setup with ArgoCD, Helm, GitHub Actions for 15-service microservice app.", "https://picsum.photos/seed/p24/800/500", None),
                ],
                "github": "https://github.com/bekzodyusupov",
            },
            # 5
            {
                "email": "diana@content.ru", "pw": "pass123",
                "name": "Diana Petrova", "lat": 55.75, "lng": 37.62,
                "avatar": "https://i.pravatar.cc/150?u=diana@content.ru",
                "bio": "Content strategist & copywriter. IT, fintech, e-commerce. 74 projects. Ex-editor at TechCrunch Russia.",
                "title": "Content Strategist & Copywriter", "cat": "writing",
                "rate": 32, "exp": 5, "rating": "4.15", "jobs": 74, "balance": "2400",
                "verified": True, "resp": "within 30 minutes",
                "skills": ["copywriting", "tech-writing", "translation-ru-en", "editing", "seo"],
                "langs": [("ru", "native"), ("en", "fluent"), ("de", "conversational")],
                "certs": [],
                "portfolio": [
                    ("SaaS Onboarding Copy", "Rewrote onboarding email sequence — trial-to-paid conversion +23%.", "https://picsum.photos/seed/p11/800/500", None),
                    ("Tech Blog Series", "60 SEO-optimized articles for a DevOps tools company.", "https://picsum.photos/seed/p12/800/500", None),
                ],
                "github": None,
            },
            # 6
            {
                "email": "ryan@security.io", "pw": "pass123",
                "name": "Ryan Clarke", "lat": 51.51, "lng": -0.13,
                "avatar": "https://i.pravatar.cc/150?u=ryan@security.io",
                "bio": "Offensive security specialist. OSCP certified. 8 years of pentesting for banks and SaaS companies.",
                "title": "Penetration Tester / Security Consultant", "cat": "security",
                "rate": 90, "exp": 8, "rating": "4.88", "jobs": 34, "balance": "4500",
                "verified": True, "resp": "within 2 hours",
                "skills": ["pentest", "owasp", "burp-suite", "metasploit", "network-security", "bug-bounty"],
                "langs": [("en", "native")],
                "certs": [
                    ("Offensive Security Certified Professional (OSCP)", "Offensive Security", "2021-07-15", None),
                    ("Certified Ethical Hacker (CEH)", "EC-Council", "2020-03-10", None),
                    ("GIAC Web Application Penetration Tester", "SANS", "2022-11-01", None),
                ],
                "portfolio": [
                    ("Banking App Security Audit", "Full pentest of mobile banking app — 14 critical vulnerabilities found and reported.", "https://picsum.photos/seed/p13/800/500", None),
                    ("SaaS OWASP Top 10 Audit", "Security assessment for B2B SaaS platform serving 50k users.", "https://picsum.photos/seed/p14/800/500", None),
                ],
                "github": "https://github.com/ryancsec",
            },
            # 7
            {
                "email": "lena@video.de", "pw": "pass123",
                "name": "Lena Braun", "lat": 48.14, "lng": 11.58,
                "avatar": "https://i.pravatar.cc/150?u=lena@video.de",
                "bio": "Motion designer & video editor. After Effects, Premiere Pro, Cinema 4D. 120+ videos for YouTube and ads.",
                "title": "Motion Designer & Video Editor", "cat": "video",
                "rate": 48, "exp": 6, "rating": "4.56", "jobs": 57, "balance": "1700",
                "verified": True, "resp": "within 1 hour",
                "skills": ["premiere", "after-effects", "cinema4d", "davinci", "motion-graphics"],
                "langs": [("de", "native"), ("en", "fluent")],
                "certs": [
                    ("Adobe Certified Professional — After Effects", "Adobe", "2022-05-20", None),
                ],
                "portfolio": [
                    ("Product Explainer Video", "90-second animated explainer for SaaS product — 2M+ YouTube views.", "https://picsum.photos/seed/p15/800/500", None),
                    ("Brand Ad Campaign", "6-video ad campaign for e-commerce brand — ROAS 4.2x.", "https://picsum.photos/seed/p16/800/500", None),
                    ("App Promo Video", "App Store promotional video — featured by Apple.", "https://picsum.photos/seed/p25/800/500", None),
                ],
                "github": None,
            },
            # 8
            {
                "email": "arjun@backend.in", "pw": "pass123",
                "name": "Arjun Sharma", "lat": 12.97, "lng": 77.59,
                "avatar": "https://i.pravatar.cc/150?u=arjun@backend.in",
                "bio": "Backend engineer specializing in Java/Spring Boot and Go microservices. 9 years, ex-Google engineer.",
                "title": "Senior Backend Engineer (Java/Go)", "cat": "web-dev",
                "rate": 70, "exp": 9, "rating": "4.79", "jobs": 41, "balance": "3900",
                "verified": True, "resp": "within 2 hours",
                "skills": ["java", "go", "spring", "postgresql", "redis", "docker", "kubernetes", "rest-api"],
                "langs": [("en", "fluent"), ("ru", "conversational")],
                "certs": [
                    ("Oracle Certified Professional — Java SE", "Oracle", "2020-09-01", None),
                    ("Google Cloud Professional Developer", "Google", "2023-01-20", None),
                ],
                "portfolio": [
                    ("Payment Microservices", "High-load payment system processing 10k TPS built with Go + Kafka.", "https://picsum.photos/seed/p17/800/500", "https://github.com/arjun/payment-ms"),
                    ("Real-Time Notification Service", "Push notification service for 5M users using Java + WebSockets.", "https://picsum.photos/seed/p18/800/500", None),
                ],
                "github": "https://github.com/arjunsharma",
            },
            # 9
            {
                "email": "natasha@finance.ru", "pw": "pass123",
                "name": "Natasha Volkova", "lat": 59.93, "lng": 30.32,
                "avatar": "https://i.pravatar.cc/150?u=natasha@finance.ru",
                "bio": "Financial analyst & accountant. IFRS, tax consulting, financial modeling for startups and enterprises.",
                "title": "Financial Analyst & CPA", "cat": "finance",
                "rate": 40, "exp": 10, "rating": "4.66", "jobs": 63, "balance": "2900",
                "verified": True, "resp": "within 3 hours",
                "skills": ["ifrs", "excel-vba", "financial-analysis", "1c", "gaap"],
                "langs": [("ru", "native"), ("en", "fluent")],
                "certs": [
                    ("ACCA — Association of Chartered Certified Accountants", "ACCA", "2019-06-10", None),
                    ("IFRS Certificate", "ICAEW", "2020-11-15", None),
                ],
                "portfolio": [
                    ("Startup Financial Model", "3-year financial model for Series A fundraising — $4M raised.", "https://picsum.photos/seed/p19/800/500", None),
                    ("IFRS Migration Project", "Migrated accounting for 300-person company from local GAAP to IFRS.", "https://picsum.photos/seed/p26/800/500", None),
                ],
                "github": None,
            },
        ]

        freelancers = []
        for fd in freelancers_raw:
            u, w = make_user(fd["email"], fd["pw"], UserRole.freelancer,
                             fd["name"], fd["bio"], fd["lat"], fd["lng"], fd["avatar"])
            w.balance = Decimal(fd["balance"])

            fp = FreelancerProfile(
                user_id=u.id,
                skills=fd["skills"],
                hourly_rate=Decimal(str(fd["rate"])),
                rating=Decimal(fd["rating"]),
                total_jobs=fd["jobs"],
                title=fd["title"],
                experience_years=fd["exp"],
                connects_balance=20,
                is_verified=fd["verified"],
                response_time=fd["resp"],
                github_url=fd.get("github"),
                category_id=cats[fd["cat"]].id if fd.get("cat") and fd["cat"] in cats else None,
            )
            db.add(fp)
            db.flush()

            for sk in fd["skills"]:
                if sk in skills:
                    db.add(SkillToProfile(profile_id=fp.id, skill_id=skills[sk].id))

            for lang_code, level_str in fd["langs"]:
                if lang_code in langs:
                    db.add(ProfileLanguage(
                        profile_id=fp.id,
                        language_id=langs[lang_code].id,
                        level=LanguageLevel[level_str],
                    ))

            for cert_title, issuer, issue_date_str, url in fd["certs"]:
                db.add(Certification(
                    profile_id=fp.id, title=cert_title, issuer=issuer,
                    issue_date=date.fromisoformat(issue_date_str), credential_url=url,
                ))

            for pt_title, pt_desc, img, url in fd["portfolio"]:
                db.add(PortfolioItem(user_id=u.id, title=pt_title, description=pt_desc,
                                     image_url=img, project_url=url))
            freelancers.append((u, fp))
        db.flush()

        cl = clients                       # cl[0..5]
        fr = [f[0] for f in freelancers]  # fr[0..9]

        # ── PROJECTS (25) ────────────────────────────────────────────────────
        # Fields: client, freelancer, status, bid_price, feat, title, desc,
        #         cat, bmin, bmax, ptype, level, dur
        projects_data = [

            # ─── COMPLETED (6) ───────────────────────────────────────────────
            dict(client=cl[0], freelancer=fr[0], status="completed", bid_price=3200, feat=True,
                 title="CRM System for Sales Agency",
                 desc="CRM for managing clients, tasks, pipeline and analytics. Telegram integration, email notifications, dashboard with charts. 30+ custom fields.",
                 cat="web-dev", bmin=2500, bmax=4000, ptype="fixed", level="expert", dur="2-3 months"),

            dict(client=cl[2], freelancer=fr[3], status="completed", bid_price=4800, feat=True,
                 title="ML Model: Customer Churn Prediction",
                 desc="Bank with 200k clients. Churn prediction model with 94% precision. Python + PostgreSQL + AWS Lambda. Realtime scoring API.",
                 cat="data-ai", bmin=3500, bmax=6000, ptype="fixed", level="expert", dur="1-2 months"),

            dict(client=cl[3], freelancer=fr[2], status="completed", bid_price=2200, feat=True,
                 title="SaaS Rebranding & Design System",
                 desc="Full rebranding: logo, color palette, typography, Figma UI kit with 80+ components. Dark and light themes. Handoff to developers.",
                 cat="design", bmin=1500, bmax=2800, ptype="fixed", level="expert", dur="6 weeks"),

            dict(client=cl[1], freelancer=fr[6], status="completed", bid_price=2800, feat=True,
                 title="Web App Security Audit (OWASP)",
                 desc="Full security audit of REST API and React frontend. Pentest with Burp Suite. Detailed report: 22 findings, remediation roadmap.",
                 cat="security", bmin=2000, bmax=3500, ptype="fixed", level="expert", dur="3 weeks"),

            dict(client=cl[4], freelancer=fr[8], status="completed", bid_price=6500, feat=True,
                 title="High-Load Payment Microservices (Go)",
                 desc="Greenfield microservices system processing 10k TPS. Go + Kafka + PostgreSQL. API Gateway, rate limiting, idempotency keys.",
                 cat="web-dev", bmin=5000, bmax=9000, ptype="fixed", level="expert", dur="3 months"),

            dict(client=cl[5], freelancer=fr[7], status="completed", bid_price=1800, feat=False,
                 title="Product Explainer Video + Motion Graphics",
                 desc="90-second animated explainer for SaaS product launch. After Effects + Cinema 4D. 3 revision rounds included. Final delivery in 4K.",
                 cat="video", bmin=1200, bmax=2500, ptype="fixed", level="expert", dur="3 weeks"),

            # ─── IN_PROGRESS (5) ─────────────────────────────────────────────
            dict(client=cl[0], freelancer=fr[1], status="in_progress", bid_price=5500, feat=True,
                 title="Food Delivery App (Flutter iOS+Android)",
                 desc="iOS + Android app for food delivery. Restaurant catalog, cart, Stripe payments, Apple Pay, real-time courier tracking. Firebase backend.",
                 cat="mobile-dev", bmin=4000, bmax=7000, ptype="fixed", level="expert", dur="3 months"),

            dict(client=cl[1], freelancer=fr[4], status="in_progress", bid_price=2800, feat=False,
                 title="DevOps: Kubernetes + CI/CD for E-Commerce",
                 desc="K8s cluster setup on AWS EKS, GitLab CI/CD, autoscaling policies, Prometheus/Grafana monitoring, HA PostgreSQL with replication.",
                 cat="devops", bmin=2000, bmax=3500, ptype="fixed", level="expert", dur="1 month"),

            dict(client=cl[3], freelancer=fr[3], status="in_progress", bid_price=3900, feat=False,
                 title="AI Recommendation Engine for E-Commerce",
                 desc="Collaborative filtering + content-based hybrid model. Real-time scoring via FastAPI. A/B testing framework. AWS SageMaker deployment.",
                 cat="data-ai", bmin=3000, bmax=5000, ptype="fixed", level="expert", dur="2 months"),

            dict(client=cl[2], freelancer=fr[9], status="in_progress", bid_price=2200, feat=False,
                 title="IFRS Financial Reporting Automation",
                 desc="Excel VBA + Python automation of monthly IFRS financial statements for 3 legal entities. Integration with 1C accounting system.",
                 cat="finance", bmin=1800, bmax=3000, ptype="fixed", level="expert", dur="6 weeks"),

            dict(client=cl[5], freelancer=fr[0], status="in_progress", bid_price=4100, feat=True,
                 title="Multi-Tenant SaaS Platform (Next.js + FastAPI)",
                 desc="Multi-tenant architecture with per-tenant databases, custom domains, billing via Stripe. Admin panel. REST + GraphQL APIs.",
                 cat="web-dev", bmin=3500, bmax=5500, ptype="fixed", level="expert", dur="2-3 months"),

            # ─── DELIVERED (2) ───────────────────────────────────────────────
            dict(client=cl[2], freelancer=fr[2], status="delivered", bid_price=1400, feat=False,
                 title="Landing Page Redesign + A/B Testing",
                 desc="UX audit of existing landing page, new design in Figma, pixel-perfect HTML/CSS. A/B test setup via Google Optimize. Mobile-first.",
                 cat="design", bmin=900, bmax=1800, ptype="fixed", level="intermediate", dur="3 weeks"),

            dict(client=cl[4], freelancer=fr[7], status="delivered", bid_price=2400, feat=False,
                 title="Brand Video Series (6 episodes)",
                 desc="6-episode brand story video series for LinkedIn + YouTube. DaVinci Resolve editing, custom motion graphics, subtitles in EN/ZH.",
                 cat="video", bmin=1800, bmax=3000, ptype="fixed", level="expert", dur="5 weeks"),

            # ─── OPEN (12) ───────────────────────────────────────────────────
            dict(client=cl[1], freelancer=None, status="open", bid_price=None, feat=True,
                 title="AI Customer Support Chatbot (GPT-4)",
                 desc="GPT-4 chatbot integrated into Telegram + website widget. Trained on FAQ database. Conversation history in PostgreSQL. Analytics dashboard.",
                 cat="data-ai", bmin=1500, bmax=3000, ptype="fixed", level="expert", dur="4 weeks"),

            dict(client=cl[3], freelancer=None, status="open", bid_price=None, feat=True,
                 title="HR SaaS Platform",
                 desc="HR platform: job postings, candidates pipeline (kanban), performance reviews, team analytics. React + Node.js + PostgreSQL. Design ready.",
                 cat="web-dev", bmin=6000, bmax=12000, ptype="fixed", level="expert", dur="4-6 months"),

            dict(client=cl[0], freelancer=None, status="open", bid_price=None, feat=False,
                 title="SEO Articles for Tech Blog (20 pieces)",
                 desc="20 SEO articles on fintech/API topics. 1500-2000 words each. English. Keyword research included. Deadline: 1 month.",
                 cat="writing", bmin=400, bmax=900, ptype="fixed", level="intermediate", dur="1 month"),

            dict(client=cl[2], freelancer=None, status="open", bid_price=None, feat=False,
                 title="Web App Pentest (OWASP Top 10)",
                 desc="Security audit of REST API + React frontend. OWASP Top 10 methodology. Detailed report with severity ratings and remediation steps. NDA required.",
                 cat="security", bmin=1200, bmax=2500, ptype="fixed", level="expert", dur="2 weeks"),

            dict(client=cl[4], freelancer=None, status="open", bid_price=None, feat=True,
                 title="Real-Time Trading Dashboard (React + WebSocket)",
                 desc="Live trading dashboard: order book, price charts (TradingView), portfolio tracker, alerts. WebSocket feeds from Binance API. Dark theme.",
                 cat="web-dev", bmin=3000, bmax=5500, ptype="fixed", level="expert", dur="2 months"),

            dict(client=cl[5], freelancer=None, status="open", bid_price=None, feat=False,
                 title="Social Media Video Ads (10 creatives)",
                 desc="10 short-form video ads for TikTok, Instagram Reels, YouTube Shorts. 15–30 sec each. Hook in first 3 sec. Spanish + English versions.",
                 cat="video", bmin=800, bmax=1800, ptype="fixed", level="intermediate", dur="3 weeks"),

            dict(client=cl[0], freelancer=None, status="open", bid_price=None, feat=True,
                 title="iOS App: Personal Finance Tracker (Swift)",
                 desc="Native iOS app: expense tracking, budget goals, OCR receipt scanning, iCloud sync, widgets. SwiftUI. Submit to App Store included.",
                 cat="mobile-dev", bmin=4000, bmax=8000, ptype="fixed", level="expert", dur="3 months"),

            dict(client=cl[1], freelancer=None, status="open", bid_price=None, feat=False,
                 title="Google Ads Campaign Management (3 months)",
                 desc="Setup and management of Google Search + Display campaigns for SaaS product. Monthly budget $5k. Target: CPA under $30. Weekly reports.",
                 cat="marketing", bmin=900, bmax=1800, ptype="hourly", level="intermediate", dur="3 months"),

            dict(client=cl[2], freelancer=None, status="open", bid_price=None, feat=False,
                 title="Corporate Financial Model (3-Year Forecast)",
                 desc="3-year P&L, Balance Sheet, Cash Flow model in Excel. Scenario analysis (base/bull/bear). Investor-ready format for Series A pitch deck.",
                 cat="finance", bmin=600, bmax=1200, ptype="fixed", level="expert", dur="2 weeks"),

            dict(client=cl[5], freelancer=None, status="open", bid_price=None, feat=True,
                 title="Microservices Migration (Monolith → Kubernetes)",
                 desc="Migrate 8-service monolith to Docker containers + K8s on GCP. CI/CD with GitHub Actions. Zero-downtime migration plan required.",
                 cat="devops", bmin=4000, bmax=7000, ptype="fixed", level="expert", dur="2-3 months"),

            dict(client=cl[3], freelancer=None, status="open", bid_price=None, feat=False,
                 title="Brand Identity Design (Logo + Style Guide)",
                 desc="Logo, color palette, typography, brand voice. Deliverables: AI/EPS + PNG/SVG files, brand guidelines PDF, Figma style guide. 3 initial concepts.",
                 cat="design", bmin=800, bmax=1800, ptype="fixed", level="intermediate", dur="4 weeks"),

            dict(client=cl[4], freelancer=None, status="open", bid_price=None, feat=False,
                 title="NLP Text Classification Pipeline",
                 desc="Multi-label text classifier for customer support tickets (10 categories, Chinese + English). BERT fine-tuning. REST API deployment on AWS.",
                 cat="data-ai", bmin=2500, bmax=4500, ptype="fixed", level="expert", dur="6 weeks"),
        ]

        projects = []
        for pd in projects_data:
            cat_obj = cats[pd["cat"]]
            p = Project(
                client_id=pd["client"].id,
                category=cat_obj.name, category_id=cat_obj.id,
                title=pd["title"], description=pd["desc"],
                budget_min=Decimal(str(pd["bmin"])), budget_max=Decimal(str(pd["bmax"])),
                deadline=date.today() + timedelta(days=60),
                project_type=pd["ptype"], experience_level=pd["level"], duration=pd["dur"],
                is_featured=pd["feat"],
                status=ProjectStatus[pd["status"]],
                assigned_freelancer_id=pd["freelancer"].id if pd["freelancer"] else None,
            )
            if pd["status"] == "delivered":
                p.delivery_description = "Work completed in full scope. All tests pass, documentation attached."
                p.delivery_submitted_at = dt(2)
                p.progress_percent = 100
            if pd["status"] == "in_progress":
                p.progress_percent = 40
            db.add(p)
            projects.append((p, pd))
        db.flush()

        # ── BIDS + CONTRACTS + ESCROW ────────────────────────────────────────
        # Open projects: add 2-3 pending bids from different freelancers
        open_project_bidders = {
            13: [fr[0], fr[1]],       # AI chatbot
            14: [fr[0], fr[8]],       # HR SaaS
            15: [fr[5]],              # SEO articles
            16: [fr[6]],              # Pentest
            17: [fr[0], fr[8]],       # Trading dashboard
            18: [fr[7]],              # Video ads
            19: [fr[1], fr[2]],       # iOS app
            20: [fr[5]],              # Google Ads
            21: [fr[9]],              # Financial model
            22: [fr[4]],              # Microservices migration
            23: [fr[2]],              # Brand identity
            24: [fr[3]],              # NLP pipeline
        }

        cover_letters = [
            "Hello! I specialize in exactly this domain and have delivered 10+ similar projects. I can start immediately and guarantee quality on schedule.",
            "I've reviewed your requirements carefully. My experience with similar systems spans 5 years — I'm confident I can deliver this within your budget and timeline.",
            "This project is a great fit for my skillset. Attached portfolio shows directly relevant work. Happy to discuss technical details in a call.",
            "Your project aligns perfectly with my background. I've built 3 similar systems in the past year. Let's connect to discuss approach and timeline.",
        ]

        for i, (p_obj, pd) in enumerate(projects):
            if pd["status"] == "open":
                bidders_list = open_project_bidders.get(i, [fr[0]])
                for j, bidder in enumerate(bidders_list):
                    price = Decimal(str(pd["bmin"])) + Decimal(str(j * 300))
                    db.add(Bid(
                        project_id=p_obj.id, freelancer_id=bidder.id,
                        price=price, status=BidStatus.pending,
                        cover_letter=cover_letters[j % len(cover_letters)],
                    ))
                continue

            if pd["freelancer"] is None:
                continue

            bid_price = Decimal(str(pd["bid_price"]))
            bid = Bid(
                project_id=p_obj.id, freelancer_id=pd["freelancer"].id,
                price=bid_price, status=BidStatus.accepted,
                cover_letter="Experienced in exactly this type of project. Deadlines and quality guaranteed.",
            )
            db.add(bid)
            db.flush()

            contract_status_map = {
                "completed": ContractStatus.completed,
                "in_progress": ContractStatus.active,
                "delivered": ContractStatus.active,
            }
            escrow_status_map = {
                "completed": EscrowStatus.released,
                "in_progress": EscrowStatus.frozen,
                "delivered": EscrowStatus.frozen,
            }
            db.add(Contract(
                project_id=p_obj.id, client_id=pd["client"].id,
                freelancer_id=pd["freelancer"].id, bid_id=bid.id,
                amount=bid_price, status=contract_status_map[pd["status"]],
                deadline=date.today() + timedelta(days=30),
                completed_at=dt(1) if pd["status"] == "completed" else None,
            ))
            tx = Transaction(
                project_id=p_obj.id, client_id=pd["client"].id,
                freelancer_id=pd["freelancer"].id,
                amount=bid_price, status=escrow_status_map[pd["status"]],
                released_at=dt(1) if pd["status"] == "completed" else None,
            )
            db.add(tx)

            client_w = db.query(Wallet).filter(Wallet.user_id == pd["client"].id).first()
            free_w   = db.query(Wallet).filter(Wallet.user_id == pd["freelancer"].id).first()
            if escrow_status_map[pd["status"]] == EscrowStatus.released:
                free_w.balance += bid_price * Decimal("0.99")
                fp_upd = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == pd["freelancer"].id).first()
                if fp_upd:
                    fp_upd.total_jobs += 1
                cp_upd = db.query(ClientProfile).filter(ClientProfile.user_id == pd["client"].id).first()
                if cp_upd:
                    cp_upd.total_spent += bid_price
                    cp_upd.total_projects += 1
            else:
                client_w.frozen += bid_price

        db.flush()

        # ── REVIEWS (for all 6 completed projects) ───────────────────────────
        # projects[0..5] are completed
        review_data = [
            # project 0 — CRM (cl[0] ↔ fr[0])
            (0, cl[0], fr[0], 5, "Alexei delivered everything perfectly. Code quality, deadlines, communication — all top-notch. Will definitely hire again."),
            (0, fr[0], cl[0], 5, "Timur is an excellent client. Clear requirements, fast feedback, fair payment on time. A pleasure to work with."),
            # project 1 — ML Churn (cl[2] ↔ fr[3])
            (1, cl[2], fr[3], 5, "Aisha is world-class. The churn model hit 94% precision — way above our expectations. Incredible work."),
            (1, fr[3], cl[2], 4, "Interesting and technically challenging project. Requirements shifted a couple times but Damir is fair and responsive."),
            # project 2 — Design System (cl[3] ↔ fr[2])
            (2, cl[3], fr[2], 5, "Marco created exactly what we envisioned and more. The design system is simply brilliant. Our team loves it."),
            (2, fr[2], cl[3], 5, "Sofia is every designer's dream client. She knows exactly what she wants and deeply values quality craft."),
            # project 3 — Security Audit (cl[1] ↔ fr[6])
            (3, cl[1], fr[6], 5, "Ryan found 22 vulnerabilities we had no idea about. His report was incredibly detailed and actionable. Saved us from a potential breach."),
            (3, fr[6], cl[1], 5, "Amina was professional and collaborative throughout. She took security seriously and implemented all recommendations quickly."),
            # project 4 — Payment Microservices (cl[4] ↔ fr[8])
            (4, cl[4], fr[8], 5, "Arjun built a payment system that handles our peak load effortlessly. Clean architecture, comprehensive tests. Exceptional engineer."),
            (4, fr[8], cl[4], 4, "Chen is technically sharp and knows what he wants. Timeline was tight but we made it work. Great project overall."),
            # project 5 — Explainer Video (cl[5] ↔ fr[7])
            (5, cl[5], fr[7], 5, "Lena's animation quality is stunning. The explainer video got 2M views in the first week after launch. Worth every dollar."),
            (5, fr[7], cl[5], 5, "Carlos gives clear creative direction and constructive feedback. The project was smooth and fun from start to finish."),
        ]

        for proj_idx, reviewer, reviewee, rating, comment in review_data:
            p_obj = projects[proj_idx][0]
            db.add(Review(
                project_id=p_obj.id, reviewer_id=reviewer.id,
                reviewee_id=reviewee.id, rating=rating, comment=comment,
            ))

        # ── ACHIEVEMENTS ─────────────────────────────────────────────────────
        from achievements.views import ensure_achievements_exist, check_and_grant
        ensure_achievements_exist(db)
        all_users = [*clients, *[f[0] for f in freelancers]]
        for u in all_users:
            check_and_grant(u, db)

        db.commit()
        print("\n✓ Seed complete!\n")
        print("=" * 52)
        print("LOGIN CREDENTIALS")
        print("=" * 52)
        print("  Admin:        admin@workflow.com       / admin123")
        print("  Client 1:     timur@techcorp.tj        / pass123")
        print("  Client 2:     amina@greenleaf.com      / pass123")
        print("  Client 3:     damir@fintech.kz         / pass123")
        print("  Client 4:     sofia@designstudio.de    / pass123")
        print("  Client 5:     chen@aiventures.cn       / pass123")
        print("  Client 6:     carlos@agencia.mx        / pass123")
        print("  Freelancer 1: alexei@dev.ru             / pass123")
        print("  Freelancer 2: zara@flutter.dev          / pass123")
        print("  Freelancer 3: marco@design.it           / pass123")
        print("  Freelancer 4: aisha@ailab.kz            / pass123")
        print("  Freelancer 5: bekzod@devops.uz          / pass123")
        print("  Freelancer 6: diana@content.ru          / pass123")
        print("  Freelancer 7: ryan@security.io          / pass123")
        print("  Freelancer 8: lena@video.de             / pass123")
        print("  Freelancer 9: arjun@backend.in          / pass123")
        print("  Freelancer 10:natasha@finance.ru        / pass123")
        print("=" * 52)
        print(f"\n  Projects: {len(projects)} total")
        print(f"  Users:    {len(clients)} clients + {len(freelancers)} freelancers + 1 admin")

    except Exception as e:
        db.rollback()
        print(f"\nSEED FAILED: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
