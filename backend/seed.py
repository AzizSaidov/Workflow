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
from profiles.models import FreelancerProfile, SkillToProfile, ProfileLanguage, LanguageLevel, ProfileLike
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
        ("JavaScript", "javascript"), ("C#", "csharp"),
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
            "admin@workflow.com", "admin123", UserRole.client,
            "Admin", "Workflow platform administrator.", 38.56, 68.77,
            "https://randomuser.me/api/portraits/men/52.jpg",
        )
        admin.is_admin = True
        admin_w.balance = Decimal("50000")

        # ── CLIENTS (6) ─────────────────────────────────────────────────────
        clients_raw = [
            {
                "email": "timur@techcorp.tj", "pw": "pass123",
                "name": "Timur Rashidov",
                "bio": "Founder of TechCorp. Building IT products for emerging markets in Central Asia.",
                "lat": 38.56, "lng": 68.77,
                "avatar": "https://randomuser.me/api/portraits/men/36.jpg",
                "company": "TechCorp", "website": "https://techcorp.tj",
                "location": "Dushanbe, Tajikistan", "balance": Decimal("10000"),
            },
            {
                "email": "amina@greenleaf.com", "pw": "pass123",
                "name": "Amina Usupova",
                "bio": "Owner of GreenLeaf Digital. We help regional businesses grow online.",
                "lat": 41.30, "lng": 69.24,
                "avatar": "https://randomuser.me/api/portraits/women/52.jpg",
                "company": "GreenLeaf Digital", "website": "https://greenleaf.com",
                "location": "Tashkent, Uzbekistan", "balance": Decimal("4000"),
            },
            {
                "email": "damir@fintech.kz", "pw": "pass123",
                "name": "Damir Seitkali",
                "bio": "CTO of PayEasy — building next-gen payment infrastructure for Kazakhstan.",
                "lat": 43.22, "lng": 76.85,
                "avatar": "https://randomuser.me/api/portraits/men/72.jpg",
                "company": "PayEasy", "website": "https://payeasy.kz",
                "location": "Almaty, Kazakhstan", "balance": Decimal("11000"),
            },
            {
                "email": "sofia@designstudio.de", "pw": "pass123",
                "name": "Sofia Muller",
                "bio": "Art Director at Muller Design Studio. Partnering with European SaaS brands.",
                "lat": 52.52, "lng": 13.40,
                "avatar": "https://randomuser.me/api/portraits/women/22.jpg",
                "company": "Muller Design Studio", "website": "https://muller.design",
                "location": "Berlin, Germany", "balance": Decimal("8000"),
            },
            {
                "email": "chen@aiventures.cn", "pw": "pass123",
                "name": "Chen Wei",
                "bio": "CEO of AI Ventures. Investing in and building AI-first products for Asian markets.",
                "lat": 31.23, "lng": 121.47,
                "avatar": "https://randomuser.me/api/portraits/men/57.jpg",
                "company": "AI Ventures", "website": "https://aiventures.cn",
                "location": "Shanghai, China", "balance": Decimal("15000"),
            },
            {
                "email": "carlos@agencia.mx", "pw": "pass123",
                "name": "Carlos Mendez",
                "bio": "Founder of Agencia Digital. Full-service digital agency serving Latin American brands.",
                "lat": 19.43, "lng": -99.13,
                "avatar": "https://randomuser.me/api/portraits/men/43.jpg",
                "company": "Agencia Digital", "website": "https://agencia.mx",
                "location": "Mexico City, Mexico", "balance": Decimal("6000"),
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
                "avatar": "https://randomuser.me/api/portraits/men/20.jpg",
                "bio": "Full-stack developer, 7 years. React + FastAPI + PostgreSQL. 47 projects delivered on time.",
                "title": "Senior Full-Stack Developer", "cat": "web-dev",
                "rate": 55, "exp": 7, "rating": "4.80", "jobs": 50, "balance": "3000",
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
                "avatar": "https://randomuser.me/api/portraits/women/57.jpg",
                "bio": "Mobile developer specializing in Flutter (iOS+Android) + Firebase backend. 31 shipped apps.",
                "title": "Flutter / Mobile Developer", "cat": "mobile-dev",
                "rate": 45, "exp": 4, "rating": "5.00", "jobs": 30, "balance": "2000",
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
                "avatar": "https://randomuser.me/api/portraits/men/30.jpg",
                "bio": "Senior UI/UX Designer & Brand Identity specialist. 9 years. Working with European and US startups.",
                "title": "Senior UI/UX Designer", "cat": "design",
                "rate": 75, "exp": 9, "rating": "4.83", "jobs": 90, "balance": "7000",
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
                "avatar": "https://randomuser.me/api/portraits/women/40.jpg",
                "bio": "Data Scientist & ML Engineer. NLP, computer vision, MLOps pipelines. PhD in Applied Math.",
                "title": "Data Scientist & ML Engineer", "cat": "data-ai",
                "rate": 65, "exp": 5, "rating": "4.80", "jobs": 20, "balance": "3500",
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
                "avatar": "https://randomuser.me/api/portraits/men/10.jpg",
                "bio": "Senior DevOps Engineer. Kubernetes, AWS/GCP, Terraform, CI/CD. 6 years in production infra.",
                "title": "Senior DevOps / Cloud Engineer", "cat": "devops",
                "rate": 60, "exp": 6, "rating": "4.00", "jobs": 40, "balance": "2000",
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
                "avatar": "https://randomuser.me/api/portraits/women/32.jpg",
                "bio": "Content strategist & copywriter. IT, fintech, e-commerce. 74 projects. Ex-editor at TechCrunch Russia.",
                "title": "Content Strategist & Copywriter", "cat": "writing",
                "rate": 30, "exp": 5, "rating": "4.00", "jobs": 75, "balance": "2500",
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
                "avatar": "https://randomuser.me/api/portraits/men/77.jpg",
                "bio": "Offensive security specialist. OSCP certified. 8 years of pentesting for banks and SaaS companies.",
                "title": "Penetration Tester / Security Consultant", "cat": "security",
                "rate": 90, "exp": 8, "rating": "4.88", "jobs": 35, "balance": "4500",
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
                "avatar": "https://randomuser.me/api/portraits/women/63.jpg",
                "bio": "Motion designer & video editor. After Effects, Premiere Pro, Cinema 4D. 120+ videos for YouTube and ads.",
                "title": "Motion Designer & Video Editor", "cat": "video",
                "rate": 50, "exp": 6, "rating": "4.56", "jobs": 60, "balance": "1800",
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
                "avatar": "https://randomuser.me/api/portraits/men/68.jpg",
                "bio": "Backend engineer specializing in Java/Spring Boot and Go microservices. 9 years, ex-Google engineer.",
                "title": "Senior Backend Engineer (Java/Go)", "cat": "web-dev",
                "rate": 70, "exp": 9, "rating": "4.79", "jobs": 40, "balance": "4000",
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
                "avatar": "https://randomuser.me/api/portraits/women/80.jpg",
                "bio": "Financial analyst & accountant. IFRS, tax consulting, financial modeling for startups and enterprises.",
                "title": "Financial Analyst & CPA", "cat": "finance",
                "rate": 40, "exp": 10, "rating": "5.00", "jobs": 65, "balance": "3000",
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
            dict(client=cl[0], freelancer=fr[0], status="completed", bid_price=3000, feat=True,
                 title="CRM System for Sales Agency",
                 desc="CRM for managing clients, tasks, pipeline and analytics. Telegram integration, email notifications, dashboard with charts. 30+ custom fields.",
                 cat="web-dev", bmin=2500, bmax=4000, ptype="fixed", level="expert", dur="2-3 months"),

            dict(client=cl[2], freelancer=fr[3], status="completed", bid_price=5000, feat=True,
                 title="ML Model: Customer Churn Prediction",
                 desc="Bank with 200k clients. Churn prediction model with 94% precision. Python + PostgreSQL + AWS Lambda. Realtime scoring API.",
                 cat="data-ai", bmin=3500, bmax=6000, ptype="fixed", level="expert", dur="1-2 months"),

            dict(client=cl[3], freelancer=fr[2], status="completed", bid_price=2000, feat=True,
                 title="SaaS Rebranding & Design System",
                 desc="Full rebranding: logo, color palette, typography, Figma UI kit with 80+ components. Dark and light themes. Handoff to developers.",
                 cat="design", bmin=1500, bmax=3000, ptype="fixed", level="expert", dur="6 weeks"),

            dict(client=cl[1], freelancer=fr[6], status="completed", bid_price=3000, feat=True,
                 title="Web App Security Audit (OWASP)",
                 desc="Full security audit of REST API and React frontend. Pentest with Burp Suite. Detailed report: 22 findings, remediation roadmap.",
                 cat="security", bmin=2000, bmax=3500, ptype="fixed", level="expert", dur="3 weeks"),

            dict(client=cl[4], freelancer=fr[8], status="completed", bid_price=7000, feat=True,
                 title="High-Load Payment Microservices (Go)",
                 desc="Greenfield microservices system processing 10k TPS. Go + Kafka + PostgreSQL. API Gateway, rate limiting, idempotency keys.",
                 cat="web-dev", bmin=5000, bmax=9000, ptype="fixed", level="expert", dur="3 months"),

            dict(client=cl[5], freelancer=fr[7], status="completed", bid_price=2000, feat=False,
                 title="Product Explainer Video + Motion Graphics",
                 desc="90-second animated explainer for SaaS product launch. After Effects + Cinema 4D. 3 revision rounds included. Final delivery in 4K.",
                 cat="video", bmin=1000, bmax=2500, ptype="fixed", level="expert", dur="3 weeks"),

            # ─── IN_PROGRESS (5) ─────────────────────────────────────────────
            dict(client=cl[0], freelancer=fr[1], status="in_progress", bid_price=5500, feat=True,
                 title="Food Delivery App (Flutter iOS+Android)",
                 desc="iOS + Android app for food delivery. Restaurant catalog, cart, Stripe payments, Apple Pay, real-time courier tracking. Firebase backend.",
                 cat="mobile-dev", bmin=4000, bmax=7000, ptype="fixed", level="expert", dur="3 months"),

            dict(client=cl[1], freelancer=fr[4], status="in_progress", bid_price=3000, feat=False,
                 title="DevOps: Kubernetes + CI/CD for E-Commerce",
                 desc="K8s cluster setup on AWS EKS, GitLab CI/CD, autoscaling policies, Prometheus/Grafana monitoring, HA PostgreSQL with replication.",
                 cat="devops", bmin=2000, bmax=3500, ptype="fixed", level="expert", dur="1 month"),

            dict(client=cl[3], freelancer=fr[3], status="in_progress", bid_price=4000, feat=False,
                 title="AI Recommendation Engine for E-Commerce",
                 desc="Collaborative filtering + content-based hybrid model. Real-time scoring via FastAPI. A/B testing framework. AWS SageMaker deployment.",
                 cat="data-ai", bmin=3000, bmax=5000, ptype="fixed", level="expert", dur="2 months"),

            dict(client=cl[2], freelancer=fr[9], status="in_progress", bid_price=2000, feat=False,
                 title="IFRS Financial Reporting Automation",
                 desc="Excel VBA + Python automation of monthly IFRS financial statements for 3 legal entities. Integration with 1C accounting system.",
                 cat="finance", bmin=1800, bmax=3000, ptype="fixed", level="expert", dur="6 weeks"),

            dict(client=cl[5], freelancer=fr[0], status="in_progress", bid_price=4000, feat=True,
                 title="Multi-Tenant SaaS Platform (Next.js + FastAPI)",
                 desc="Multi-tenant architecture with per-tenant databases, custom domains, billing via Stripe. Admin panel. REST + GraphQL APIs.",
                 cat="web-dev", bmin=3500, bmax=5500, ptype="fixed", level="expert", dur="2-3 months"),

            # ─── DELIVERED (2) ───────────────────────────────────────────────
            dict(client=cl[2], freelancer=fr[2], status="delivered", bid_price=1500, feat=False,
                 title="Landing Page Redesign + A/B Testing",
                 desc="UX audit of existing landing page, new design in Figma, pixel-perfect HTML/CSS. A/B test setup via Google Optimize. Mobile-first.",
                 cat="design", bmin=1000, bmax=2000, ptype="fixed", level="intermediate", dur="3 weeks"),

            dict(client=cl[4], freelancer=fr[7], status="delivered", bid_price=2500, feat=False,
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
                 cat="writing", bmin=500, bmax=1000, ptype="fixed", level="intermediate", dur="1 month"),

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
                 cat="video", bmin=1000, bmax=2000, ptype="fixed", level="intermediate", dur="3 weeks"),

            dict(client=cl[0], freelancer=None, status="open", bid_price=None, feat=True,
                 title="iOS App: Personal Finance Tracker (Swift)",
                 desc="Native iOS app: expense tracking, budget goals, OCR receipt scanning, iCloud sync, widgets. SwiftUI. Submit to App Store included.",
                 cat="mobile-dev", bmin=4000, bmax=8000, ptype="fixed", level="expert", dur="3 months"),

            dict(client=cl[1], freelancer=None, status="open", bid_price=None, feat=False,
                 title="Google Ads Campaign Management (3 months)",
                 desc="Setup and management of Google Search + Display campaigns for SaaS product. Monthly budget $5k. Target: CPA under $30. Weekly reports.",
                 cat="marketing", bmin=1000, bmax=2000, ptype="hourly", level="intermediate", dur="3 months"),

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
                 cat="design", bmin=1000, bmax=2000, ptype="fixed", level="intermediate", dur="4 weeks"),

            dict(client=cl[4], freelancer=None, status="open", bid_price=None, feat=False,
                 title="NLP Text Classification Pipeline",
                 desc="Multi-label text classifier for customer support tickets (10 categories, Chinese + English). BERT fine-tuning. REST API deployment on AWS.",
                 cat="data-ai", bmin=2500, bmax=5000, ptype="fixed", level="expert", dur="6 weeks"),

            # ─── EXTRA COMPLETED (10) — for richer review history ────────────
            dict(client=cl[3], freelancer=fr[0], status="completed", bid_price=3000, feat=False,
                 title="React Analytics Dashboard",
                 desc="Real-time analytics dashboard for marketing team. React + Recharts + FastAPI. Custom filters, CSV export, role-based access for 5 user types.",
                 cat="web-dev", bmin=2000, bmax=3500, ptype="fixed", level="expert", dur="6 weeks"),

            dict(client=cl[4], freelancer=fr[1], status="completed", bid_price=3500, feat=False,
                 title="Fitness Tracker App (Flutter iOS+Android)",
                 desc="Cross-platform fitness app with workout logging, progress charts, Apple Health / Google Fit integration, push notifications and offline mode.",
                 cat="mobile-dev", bmin=3000, bmax=5000, ptype="fixed", level="expert", dur="2 months"),

            dict(client=cl[0], freelancer=fr[2], status="completed", bid_price=1500, feat=False,
                 title="Corporate Website Redesign",
                 desc="Full redesign of 12-page corporate website. Figma prototypes → pixel-perfect HTML/CSS/JS. WCAG 2.1 AA accessibility, 97 Lighthouse score.",
                 cat="design", bmin=1000, bmax=2000, ptype="fixed", level="intermediate", dur="4 weeks"),

            dict(client=cl[1], freelancer=fr[4], status="completed", bid_price=2500, feat=False,
                 title="AWS Infrastructure Migration",
                 desc="Migrated on-premise infrastructure to AWS. EC2 + RDS + S3 + CloudFront. IaC with Terraform. Zero-downtime migration with 2-hour maintenance window.",
                 cat="devops", bmin=2000, bmax=3000, ptype="fixed", level="expert", dur="3 weeks"),

            dict(client=cl[2], freelancer=fr[5], status="completed", bid_price=600, feat=False,
                 title="Technical Blog Articles (15 posts)",
                 desc="15 SEO-optimized technical articles on fintech/API topics. 1500-2000 words each. Keyword research, meta descriptions, internal linking strategy.",
                 cat="writing", bmin=500, bmax=1000, ptype="fixed", level="intermediate", dur="5 weeks"),

            dict(client=cl[4], freelancer=fr[9], status="completed", bid_price=1000, feat=False,
                 title="Startup Financial Model (Series A)",
                 desc="3-year financial model: P&L, Balance Sheet, Cash Flow with scenario analysis. Investor-ready pitch deck slides. Prepared for $6M Series A round.",
                 cat="finance", bmin=800, bmax=1500, ptype="fixed", level="expert", dur="2 weeks"),

            dict(client=cl[5], freelancer=fr[3], status="completed", bid_price=3000, feat=False,
                 title="Customer Segmentation ML Model",
                 desc="RFM segmentation + K-means clustering on 500k customer records. Actionable segments for marketing team. Python + Spark + interactive Tableau dashboard.",
                 cat="data-ai", bmin=2500, bmax=4000, ptype="fixed", level="expert", dur="6 weeks"),

            dict(client=cl[3], freelancer=fr[8], status="completed", bid_price=4500, feat=False,
                 title="Event-Driven Architecture (Java + Kafka)",
                 desc="Redesigned order processing system using event sourcing and CQRS. Java + Kafka + PostgreSQL. 10x throughput improvement. Comprehensive integration tests.",
                 cat="web-dev", bmin=3500, bmax=5500, ptype="fixed", level="expert", dur="2 months"),

            dict(client=cl[0], freelancer=fr[0], status="completed", bid_price=2000, feat=False,
                 title="Internal Task Management Tool",
                 desc="Kanban board with drag-and-drop, time tracking, team workload view, Slack notifications. React + FastAPI + PostgreSQL. Deployed on company servers.",
                 cat="web-dev", bmin=1500, bmax=2500, ptype="fixed", level="intermediate", dur="5 weeks"),

            dict(client=cl[5], freelancer=fr[2], status="completed", bid_price=1800, feat=False,
                 title="Mobile App UI Design + Prototype",
                 desc="Full UI design for iOS/Android travel app. 48 screens, design system with 90+ components, interactive Figma prototype, developer handoff package.",
                 cat="design", bmin=1500, bmax=2500, ptype="fixed", level="expert", dur="5 weeks"),
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
        # Open projects: add 3-5 pending bids (indices shifted +10 for extra completed projects)
        open_project_bidders = {
            23: [fr[0], fr[1], fr[8]],       # AI chatbot
            24: [fr[0], fr[8], fr[3]],        # HR SaaS
            25: [fr[5], fr[9]],               # SEO articles
            26: [fr[6]],                      # Pentest
            27: [fr[0], fr[8], fr[1]],        # Trading dashboard
            28: [fr[7], fr[1]],               # Video ads
            29: [fr[1], fr[2]],               # iOS app
            30: [fr[5]],                      # Google Ads
            31: [fr[9], fr[5]],               # Financial model
            32: [fr[4], fr[0]],               # Microservices migration
            33: [fr[2], fr[7]],               # Brand identity
            34: [fr[3], fr[0]],               # NLP pipeline
        }

        cover_letters = [
            "I've delivered 10+ projects in this exact domain. Strong portfolio, available immediately, deadline-focused approach.",
            "Reviewed your requirements carefully. My 5+ years of experience with similar systems means I can hit your timeline and budget.",
            "Great fit for my skillset. Portfolio attached with directly relevant work. Happy to jump on a call to discuss technical details.",
            "I've built 3 similar systems in the past year. Clean architecture, thorough testing, solid communication throughout.",
            "This is exactly what I specialize in. I work async-first, deliver early, and document everything for future maintainability.",
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

        # ── REVIEWS ──────────────────────────────────────────────────────────
        # Original 6 completed (0-5) + extra 10 completed (25-34)
        review_data = [
            # ── project 0: CRM (cl[0]=Timur ↔ fr[0]=Alexei) ─────────────────
            (0, cl[0], fr[0], 5, "Alexei delivered everything perfectly. Code quality, deadlines, communication — all top-notch. Will definitely hire again."),
            (0, fr[0], cl[0], 5, "Timur is an excellent client. Clear requirements, fast feedback, fair payment on time. A pleasure to work with."),
            # ── project 1: ML Churn (cl[2]=Damir ↔ fr[3]=Aisha) ─────────────
            (1, cl[2], fr[3], 5, "Aisha is world-class. The churn model hit 94% precision — way above our expectations. Incredible work."),
            (1, fr[3], cl[2], 4, "Interesting and technically challenging project. Requirements shifted a couple of times but Damir is fair and responsive."),
            # ── project 2: Design System (cl[3]=Sofia ↔ fr[2]=Marco) ─────────
            (2, cl[3], fr[2], 5, "Marco created exactly what we envisioned and more. The design system is simply brilliant. Our team loves it."),
            (2, fr[2], cl[3], 5, "Sofia is every designer's dream client. She knows exactly what she wants and deeply values quality craft."),
            # ── project 3: Security Audit (cl[1]=Amina ↔ fr[6]=Ryan) ─────────
            (3, cl[1], fr[6], 5, "Ryan found 22 vulnerabilities we had no idea about. His report was incredibly detailed and actionable. Saved us from a potential breach."),
            (3, fr[6], cl[1], 5, "Amina was professional and collaborative throughout. She took security seriously and implemented all recommendations quickly."),
            # ── project 4: Payment Microservices (cl[4]=Chen ↔ fr[8]=Arjun) ──
            (4, cl[4], fr[8], 5, "Arjun built a payment system that handles our peak load effortlessly. Clean architecture, comprehensive tests. Exceptional engineer."),
            (4, fr[8], cl[4], 4, "Chen is technically sharp and knows what he wants. Timeline was tight but we made it work. Great project overall."),
            # ── project 5: Explainer Video (cl[5]=Carlos ↔ fr[7]=Lena) ───────
            (5, cl[5], fr[7], 5, "Lena's animation quality is stunning. The explainer video got 2M views in the first week after launch. Worth every dollar."),
            (5, fr[7], cl[5], 5, "Carlos gives clear creative direction and constructive feedback. The project was smooth and fun from start to finish."),

            # ── project 25: Analytics Dashboard (cl[3]=Sofia ↔ fr[0]=Alexei) ─
            (25, cl[3], fr[0], 4, "Alexei built a solid dashboard with excellent performance. A few minor UI tweaks were needed but overall great work and fast delivery."),
            (25, fr[0], cl[3], 5, "Sofia provided crystal-clear design mockups and quick approvals. This kind of client makes every project enjoyable."),
            # ── project 26: Fitness App (cl[4]=Chen ↔ fr[1]=Zara) ────────────
            (26, cl[4], fr[1], 5, "Zara delivered a polished Flutter app ahead of schedule. Apple Health integration worked flawlessly. Very impressed with the code quality."),
            (26, fr[1], cl[4], 5, "Chen has a deep technical understanding of mobile. Clear requirements and fast decision-making — exactly what a freelancer hopes for."),
            # ── project 27: Corporate Website (cl[0]=Timur ↔ fr[2]=Marco) ────
            (27, cl[0], fr[2], 5, "Marco transformed our outdated corporate site into something we're genuinely proud of. Lighthouse score 97 — wow. Highly recommended."),
            (27, fr[2], cl[0], 4, "Timur knew what he wanted but the scope expanded mid-project. He was fair about it and adjusted the budget. Good client to work with."),
            # ── project 28: AWS Migration (cl[1]=Amina ↔ fr[4]=Bekzod) ───────
            (28, cl[1], fr[4], 4, "Bekzod executed the AWS migration with zero downtime. A few misunderstandings on scope early on, but he resolved them professionally."),
            (28, fr[4], cl[1], 5, "Amina's team was well-prepared and responsive. The migration window was tight but everyone pulled together. Would work with her again."),
            # ── project 29: Blog Articles (cl[2]=Damir ↔ fr[5]=Diana) ─────────
            (29, cl[2], fr[5], 4, "Diana's articles are well-researched and the SEO structure is solid. Turnaround could be faster but quality is consistently good."),
            (29, fr[5], cl[2], 5, "Damir gives detailed briefs and quick feedback. No ambiguity, no scope creep. This is how content projects should run."),
            # ── project 30: Financial Model (cl[4]=Chen ↔ fr[9]=Natasha) ─────
            (30, cl[4], fr[9], 5, "Natasha built a bulletproof financial model that impressed our Series A investors. Scenario analysis was especially insightful."),
            (30, fr[9], cl[4], 5, "Chen provided all the business data I needed upfront. Clear vision, fast review cycles. The project ran perfectly."),
            # ── project 31: Segmentation ML (cl[5]=Carlos ↔ fr[3]=Aisha) ─────
            (31, cl[5], fr[3], 5, "Aisha's segmentation model revealed customer insights our marketing team never had before. The Tableau dashboard is used daily now."),
            (31, fr[3], cl[5], 5, "Carlos trusted the process and let the data tell the story. The business impact was real and measurable. Great collaboration."),
            # ── project 32: Kafka Architecture (cl[3]=Sofia ↔ fr[8]=Arjun) ───
            (32, cl[3], fr[8], 5, "Arjun redesigned our entire order system and the results are remarkable — 10x throughput, zero errors in 3 months of production. Brilliant."),
            (32, fr[8], cl[3], 4, "Sofia's project had ambitious requirements but she trusted the technical choices. Documentation and testing were thorough. Good project."),
            # ── project 33: Task Tool (cl[0]=Timur ↔ fr[0]=Alexei) ───────────
            (33, cl[0], fr[0], 5, "Third time working with Alexei and he keeps getting better. The internal tool is used by our whole team daily. Fast, clean, reliable code."),
            (33, fr[0], cl[0], 5, "Timur is one of my best long-term clients. Clear vision, fast responses, and always pays on time. This is what freelancing should feel like."),
            # ── project 34: Mobile UI Design (cl[5]=Carlos ↔ fr[2]=Marco) ────
            (34, cl[5], fr[2], 5, "Marco's designs were so good the development team had zero questions. 48 screens delivered in 5 weeks with a full component library. Exceptional."),
            (34, fr[2], cl[5], 5, "Carlos gave me full creative freedom within the brief. The outcome exceeded both our expectations. Looking forward to the next project."),
        ]

        for proj_idx, reviewer, reviewee, rating, comment in review_data:
            p_obj = projects[proj_idx][0]
            db.add(Review(
                project_id=p_obj.id, reviewer_id=reviewer.id,
                reviewee_id=reviewee.id, rating=rating, comment=comment,
                created_at=dt(proj_idx * 3 + 5),
            ))

        # ── ACHIEVEMENTS ─────────────────────────────────────────────────────
        from achievements.views import ensure_achievements_exist, check_and_grant
        ensure_achievements_exist(db)
        all_users = [*clients, *[f[0] for f in freelancers]]
        for u in all_users:
            check_and_grant(u, db)

        # ── PROFILE LIKES ─────────────────────────────────────────────────────
        likes_data = [
            (cl[0], fr[0]),   # Timur → Alexei
            (cl[0], fr[2]),   # Timur → Marco
            (cl[1], fr[0]),   # Amina → Alexei
            (cl[1], fr[6]),   # Amina → Ryan
            (cl[2], fr[3]),   # Damir → Aisha
            (cl[2], fr[9]),   # Damir → Natasha
            (cl[3], fr[2]),   # Sofia → Marco
            (cl[3], fr[7]),   # Sofia → Lena
            (cl[4], fr[8]),   # Chen → Arjun
            (cl[4], fr[3]),   # Chen → Aisha
            (cl[5], fr[7]),   # Carlos → Lena
            (cl[5], fr[1]),   # Carlos → Zara
            (fr[0], fr[3]),   # Alexei → Aisha
            (fr[2], fr[1]),   # Marco → Zara
            (fr[8], fr[4]),   # Arjun → Bekzod
        ]
        for liker, liked in likes_data:
            db.add(ProfileLike(liker_id=liker.id, liked_user_id=liked.id))
        db.flush()

        db.commit()
        print("\nSeed complete!\n")
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
