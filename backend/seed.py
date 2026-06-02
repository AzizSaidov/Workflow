"""
Seed script — populates the database with realistic demo data.
Run from backend/ directory:
    python seed.py
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
            print("Already seeded. Run 'python seed.py --force' to reset and re-seed.")
            return

        print("Seeding database...")

        # ── CATEGORIES ──────────────────────────────────────────────────────
        cats_data = [
            ("Веб-разработка",      "web-dev",      "ti-code",          "Сайты, веб-приложения, API"),
            ("Мобильная разработка","mobile-dev",   "ti-device-mobile", "iOS, Android, Flutter"),
            ("Дизайн и UI/UX",      "design",       "ti-palette",       "Логотипы, интерфейсы, графика"),
            ("Data Science и AI",   "data-ai",      "ti-brain",         "ML, аналитика, нейросети"),
            ("Маркетинг и SEO",     "marketing",    "ti-speakerphone",  "Реклама, SMM, SEO"),
            ("Копирайтинг",         "writing",      "ti-pencil",        "Тексты, переводы, контент"),
            ("DevOps и облако",     "devops",       "ti-cloud",         "CI/CD, Docker, AWS, Kubernetes"),
            ("Кибербезопасность",   "security",     "ti-shield-lock",   "Pentest, аудит безопасности"),
            ("Видео и анимация",    "video",        "ti-video",         "Монтаж, 2D/3D анимация, motion"),
            ("Финансы и бухучёт",   "finance",      "ti-calculator",    "1С, бухгалтерия, финанализ"),
        ]
        cats = {}
        for name, slug, icon, desc in cats_data:
            c = Category(name=name, slug=slug, icon=icon, description=desc, is_active=True)
            db.add(c)
            cats[slug] = c
        db.flush()

        # ── SKILLS ──────────────────────────────────────────────────────────
        skills_data = {
            "web-dev":   [("React", "react"), ("Vue.js", "vuejs"), ("FastAPI", "fastapi"),
                          ("Node.js", "nodejs"), ("PostgreSQL", "postgresql"), ("TypeScript", "typescript"),
                          ("JavaScript", "javascript"), ("Python", "python-web"), ("C#", "csharp"),
                          ("C++", "cpp"), ("C", "c"), ("Java", "java"), ("Go", "go"),
                          ("Rust", "rust"), ("PHP", "php"), ("Ruby", "ruby"),
                          ("Next.js", "nextjs"), ("Nuxt.js", "nuxtjs"), ("Django", "django"),
                          ("Laravel", "laravel"), ("Spring", "spring"), (".NET", "dotnet"),
                          ("MongoDB", "mongodb"), ("Redis", "redis"), ("GraphQL", "graphql"),
                          ("REST API", "rest-api"), ("Bash", "bash")],
            "mobile-dev":[("Flutter", "flutter"), ("React Native", "react-native"),
                          ("Swift", "swift"), ("Kotlin", "kotlin"),
                          ("Objective-C", "objc"), ("Xamarin", "xamarin"), ("Ionic", "ionic")],
            "design":    [("Figma", "figma"), ("Adobe XD", "adobe-xd"), ("Illustrator", "illustrator"),
                          ("Photoshop", "photoshop"), ("Blender 3D", "blender")],
            "data-ai":   [("Python", "python"), ("TensorFlow", "tensorflow"), ("PyTorch", "pytorch"),
                          ("Pandas", "pandas"), ("SQL", "sql"), ("R", "r-lang"), ("Scala", "scala"),
                          ("Jupyter", "jupyter"), ("NumPy", "numpy"), ("Scikit-learn", "sklearn"),
                          ("OpenCV", "opencv"), ("LangChain", "langchain")],
            "marketing": [("Google Ads", "google-ads"), ("Facebook Ads", "facebook-ads"),
                          ("SEO", "seo"), ("Email Marketing", "email-marketing")],
            "writing":   [("Копирайтинг", "copywriting"), ("Технический текст", "tech-writing"),
                          ("Перевод RU-EN", "translation-ru-en"), ("Сценарии", "scripts")],
            "devops":    [("Docker", "docker"), ("Kubernetes", "kubernetes"), ("AWS", "aws"),
                          ("GitHub Actions", "github-actions"), ("Terraform", "terraform"),
                          ("Linux", "linux"), ("Nginx", "nginx"), ("CI/CD", "cicd"),
                          ("Ansible", "ansible"), ("GCP", "gcp"), ("Azure", "azure")],
            "security":  [("Penetration Testing", "pentest"), ("OWASP", "owasp"),
                          ("Bug Bounty", "bug-bounty"), ("Burp Suite", "burp-suite")],
            "video":     [("Premiere Pro", "premiere"), ("After Effects", "after-effects"),
                          ("DaVinci Resolve", "davinci"), ("Cinema 4D", "cinema4d")],
            "finance":   [("1С:Бухгалтерия", "1c"), ("Excel / VBA", "excel-vba"),
                          ("МСФО", "ifrs"), ("Финансовый анализ", "financial-analysis")],
        }
        skills = {}
        for cat_slug, skill_list in skills_data.items():
            for skill_name, skill_slug in skill_list:
                s = Skill(name=skill_name, slug=skill_slug, category_id=cats[cat_slug].id)
                db.add(s)
                skills[skill_slug] = s
        db.flush()

        # ── LANGUAGES ───────────────────────────────────────────────────────
        langs_raw = [
            ("Русский", "ru"), ("Английский", "en"), ("Таджикский", "tg"),
            ("Узбекский", "uz"), ("Казахский", "kk"), ("Немецкий", "de"), ("Китайский", "zh"),
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
                full_name=full_name, bio=bio, latitude=lat, longitude=lng, avatar_url=avatar,
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

        # ── CLIENTS ─────────────────────────────────────────────────────────
        clients_raw = [
            ("timur@techcorp.tj",    "pass123", "Timur Rashidov",
             "Founder of TechCorp. Building IT products for emerging markets.", 38.56, 68.77,
             "https://i.pravatar.cc/150?u=timur@techcorp.tj",
             "TechCorp", "https://techcorp.tj", "Dushanbe, Tajikistan",
             Decimal("7500")),
            ("amina@greenleaf.com",  "pass123", "Amina Usupova",
             "Owner of GreenLeaf Digital agency. Digital marketing for businesses.", 41.30, 69.24,
             "https://i.pravatar.cc/150?u=amina@greenleaf.com",
             "GreenLeaf Digital", "https://greenleaf.com", "Tashkent, Uzbekistan",
             Decimal("3200")),
            ("damir@fintech.kz",     "pass123", "Damir Seitkali",
             "CTO of a fintech startup building payment solutions.", 43.22, 76.85,
             "https://i.pravatar.cc/150?u=damir@fintech.kz",
             "PayEasy", "https://payeasy.kz", "Almaty, Kazakhstan",
             Decimal("8900")),
            ("sofia@designstudio.de","pass123", "Sofia Muller",
             "Art Director at a design studio. Working with European brands.", 52.52, 13.40,
             "https://i.pravatar.cc/150?u=sofia@designstudio.de",
             "Muller Design Studio", "https://muller.design", "Berlin, Germany",
             Decimal("5500")),
        ]
        clients = []
        for email, pw, name, bio, lat, lng, avatar, company, website, location, balance in clients_raw:
            u, w = make_user(email, pw, UserRole.client, name, bio, lat, lng, avatar)
            w.balance = balance
            db.add(ClientProfile(
                user_id=u.id, company_name=company, website=website,
                description=bio, location=location,
                total_spent=Decimal("0"), total_projects=0, is_verified=True,
            ))
            clients.append(u)
        db.flush()

        # ── FREELANCERS ─────────────────────────────────────────────────────
        freelancers_raw = [
            {
                "email": "alexei@dev.ru", "pw": "pass123",
                "name": "Alexei Voronov", "lat": 55.75, "lng": 37.62,
                "avatar": "https://i.pravatar.cc/150?u=alexei@dev.ru",
                "bio": "Full-stack developer, 7 years. React + FastAPI + PostgreSQL. 47 projects delivered.",
                "title": "Senior Full-Stack Developer",
                "rate": 55, "exp": 7, "rating": "4.87", "jobs": 47, "balance": "2840",
                "verified": True, "resp": "within 1 hour",
                "skills": ["react", "fastapi", "typescript", "postgresql", "docker"],
                "langs": [("ru", "native"), ("en", "fluent")],
                "certs": [
                    ("AWS Certified Developer", "Amazon Web Services", "2023-03-15", "https://aws.amazon.com/cert/123"),
                    ("Meta React Developer", "Meta", "2022-08-20", None),
                ],
                "portfolio": [
                    ("E-Commerce Platform", "Full-stack online store with AI recommendations", "https://picsum.photos/seed/p1/800/500", "https://github.com/alexei/ecommerce"),
                    ("CRM System", "CRM for 50+ agent teams with real-time analytics", "https://picsum.photos/seed/p2/800/500", None),
                ],
                "github": "https://github.com/alexeivoronov",
            },
            {
                "email": "zara@flutter.dev", "pw": "pass123",
                "name": "Zara Ismailova", "lat": 41.30, "lng": 69.24,
                "avatar": "https://i.pravatar.cc/150?u=zara@flutter.dev",
                "bio": "Mobile developer specializing in Flutter (iOS/Android) + Firebase. 4 years.",
                "title": "Flutter / Mobile Developer",
                "rate": 45, "exp": 4, "rating": "4.62", "jobs": 31, "balance": "1450",
                "verified": True, "resp": "within 2 hours",
                "skills": ["flutter", "react-native", "python"],
                "langs": [("ru", "native"), ("en", "conversational"), ("uz", "native")],
                "certs": [("Google Flutter Certified", "Google", "2023-06-01", None)],
                "portfolio": [
                    ("FoodDelivery App", "Food delivery for 3 cities — 50k+ downloads", "https://picsum.photos/seed/p3/800/500", "https://play.google.com/store/apps/zara"),
                    ("HealthTracker", "Health tracker with Apple Health integration", "https://picsum.photos/seed/p4/800/500", None),
                ],
                "github": "https://github.com/zaraismail",
            },
            {
                "email": "marco@design.it", "pw": "pass123",
                "name": "Marco Ferrari", "lat": 41.90, "lng": 12.50,
                "avatar": "https://i.pravatar.cc/150?u=marco@design.it",
                "bio": "UI/UX Designer & Brand Identity specialist. Figma expert. Working with European startups.",
                "title": "Senior UI/UX Designer",
                "rate": 75, "exp": 9, "rating": "4.95", "jobs": 89, "balance": "6200",
                "verified": True, "resp": "within 30 minutes",
                "skills": ["figma", "adobe-xd", "illustrator", "photoshop"],
                "langs": [("en", "native"), ("de", "fluent")],
                "certs": [
                    ("Google UX Design Certificate", "Google", "2021-11-10", None),
                    ("Figma for Advanced Teams", "Figma Inc.", "2022-04-05", None),
                ],
                "portfolio": [
                    ("SaaS Dashboard Redesign", "B2B SaaS redesign — conversion +40%", "https://picsum.photos/seed/p5/800/500", None),
                    ("Brand Identity Kit", "Full brand identity for a fintech startup", "https://picsum.photos/seed/p6/800/500", None),
                    ("Mobile Banking UI", "Design system for a mobile bank app", "https://picsum.photos/seed/p7/800/500", None),
                ],
                "github": None,
            },
            {
                "email": "aisha@ailab.kz", "pw": "pass123",
                "name": "Aisha Bekova", "lat": 43.22, "lng": 76.85,
                "avatar": "https://i.pravatar.cc/150?u=aisha@ailab.kz",
                "bio": "Data Scientist. NLP, computer vision, MLOps. 5 years of experience.",
                "title": "Data Scientist & ML Engineer",
                "rate": 65, "exp": 5, "rating": "4.73", "jobs": 22, "balance": "3100",
                "verified": True, "resp": "within 3 hours",
                "skills": ["python", "tensorflow", "pytorch", "pandas", "sql"],
                "langs": [("ru", "native"), ("en", "fluent"), ("kk", "native")],
                "certs": [
                    ("Deep Learning Specialization", "Coursera / DeepLearning.AI", "2022-09-01", "https://coursera.org/cert/dl"),
                    ("Google Professional Data Engineer", "Google", "2023-02-14", None),
                ],
                "portfolio": [
                    ("Fraud Detection System", "ML fraud detection — 94% precision at scale", "https://picsum.photos/seed/p8/800/500", "https://github.com/aisha/fraud-detector"),
                    ("NLP Sentiment Analysis", "Sentiment analysis pipeline for retail chain", "https://picsum.photos/seed/p9/800/500", None),
                ],
                "github": "https://github.com/aishabekova",
            },
            {
                "email": "bekzod@devops.uz", "pw": "pass123",
                "name": "Bekzod Yusupov", "lat": 41.30, "lng": 69.24,
                "avatar": "https://i.pravatar.cc/150?u=bekzod@devops.uz",
                "bio": "DevOps engineer. Kubernetes, AWS, Terraform, CI/CD. 6 years.",
                "title": "Senior DevOps Engineer",
                "rate": 60, "exp": 6, "rating": "4.41", "jobs": 38, "balance": "1800",
                "verified": False, "resp": "within 1 hour",
                "skills": ["docker", "kubernetes", "aws", "github-actions", "terraform"],
                "langs": [("ru", "fluent"), ("en", "fluent"), ("uz", "native")],
                "certs": [
                    ("AWS Solutions Architect Pro", "Amazon", "2023-05-20", "https://aws.amazon.com/cert/456"),
                    ("Certified Kubernetes Administrator", "CNCF", "2022-12-01", None),
                ],
                "portfolio": [
                    ("Kubernetes Migration", "Monolith to K8s migration — infra cost -60%", "https://picsum.photos/seed/p10/800/500", "https://github.com/bekzod/k8s-case"),
                ],
                "github": "https://github.com/bekzodyusupov",
            },
            {
                "email": "diana@content.ru", "pw": "pass123",
                "name": "Diana Petrova", "lat": 55.75, "lng": 37.62,
                "avatar": "https://i.pravatar.cc/150?u=diana@content.ru",
                "bio": "Content strategist & copywriter. IT, fintech, e-commerce niches. 5 years.",
                "title": "Content Strategist & Copywriter",
                "rate": 32, "exp": 5, "rating": "3.95", "jobs": 74, "balance": "2100",
                "verified": True, "resp": "within 30 minutes",
                "skills": ["copywriting", "tech-writing", "translation-ru-en"],
                "langs": [("ru", "native"), ("en", "fluent"), ("de", "conversational")],
                "certs": [],
                "portfolio": [
                    ("SaaS Onboarding Copy", "Rewrote onboarding flow — conversion +23%", "https://picsum.photos/seed/p11/800/500", None),
                    ("Tech Blog Series", "60 SEO articles for an IT company", "https://picsum.photos/seed/p12/800/500", None),
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

        cl = clients
        fr = [f[0] for f in freelancers]

        # ── PROJECTS ────────────────────────────────────────────────────────
        projects_data = [
            # COMPLETED
            dict(client=cl[0], freelancer=fr[0], status="completed", bid_price=3200, feat=True,
                 title="CRM System for Sales Agency",
                 desc="CRM for managing clients, tasks and analytics. Telegram integration, email notifications, dashboard with charts.",
                 cat="web-dev", bmin=2500, bmax=4000, ptype="fixed", level="expert", dur="2-3 months"),
            dict(client=cl[2], freelancer=fr[3], status="completed", bid_price=4800, feat=True,
                 title="ML Model: Customer Churn Prediction",
                 desc="Bank with 200k clients. Churn prediction model. Python + PostgreSQL. Deployment on AWS Lambda.",
                 cat="data-ai", bmin=3500, bmax=6000, ptype="fixed", level="expert", dur="1-2 months"),
            dict(client=cl[3], freelancer=fr[2], status="completed", bid_price=2200, feat=True,
                 title="SaaS Rebranding & Design System",
                 desc="Full rebranding: logo, colors, typography, Figma UI kit. 80+ components. Dark and light themes.",
                 cat="design", bmin=1500, bmax=2800, ptype="fixed", level="expert", dur="6 weeks"),
            # IN_PROGRESS
            dict(client=cl[0], freelancer=fr[1], status="in_progress", bid_price=5500, feat=True,
                 title="Food Delivery App (Flutter iOS+Android)",
                 desc="iOS + Android. Restaurant catalog, cart, payments (Stripe, Apple Pay), real-time courier tracking. Firebase backend.",
                 cat="mobile-dev", bmin=4000, bmax=7000, ptype="fixed", level="expert", dur="3 months"),
            dict(client=cl[1], freelancer=fr[4], status="in_progress", bid_price=2800, feat=False,
                 title="DevOps: Kubernetes + CI/CD for E-Commerce",
                 desc="K8s cluster setup, GitLab CI/CD, autoscaling, Prometheus/Grafana monitoring, HA PostgreSQL.",
                 cat="devops", bmin=2000, bmax=3500, ptype="fixed", level="expert", dur="1 month"),
            # DELIVERED
            dict(client=cl[2], freelancer=fr[2], status="delivered", bid_price=1400, feat=False,
                 title="Landing Page Redesign with A/B Testing",
                 desc="UX audit of landing page, new design in Figma, HTML/CSS implementation, A/B test via Google Optimize.",
                 cat="design", bmin=900, bmax=1800, ptype="fixed", level="intermediate", dur="3 weeks"),
            # OPEN
            dict(client=cl[1], freelancer=None, status="open", bid_price=None, feat=True,
                 title="AI Customer Support Chatbot (GPT-4)",
                 desc="GPT-4 integrated into Telegram + website. Trained on FAQ, conversation history in PostgreSQL, analytics dashboard.",
                 cat="data-ai", bmin=1500, bmax=3000, ptype="fixed", level="expert", dur="4 weeks"),
            dict(client=cl[3], freelancer=None, status="open", bid_price=None, feat=True,
                 title="HR SaaS Platform",
                 desc="HR platform: job postings, candidates (kanban board), performance reviews, analytics. React + Node.js + PostgreSQL. Design ready.",
                 cat="web-dev", bmin=6000, bmax=12000, ptype="fixed", level="expert", dur="4-6 months"),
            dict(client=cl[0], freelancer=None, status="open", bid_price=None, feat=False,
                 title="SEO Articles for Tech Blog (20 pieces)",
                 desc="20 SEO articles on fintech/API topics. 1500-2000 words each. English. Deadline 1 month.",
                 cat="writing", bmin=400, bmax=900, ptype="fixed", level="intermediate", dur="1 month"),
            dict(client=cl[2], freelancer=None, status="open", bid_price=None, feat=False,
                 title="Web App Pentest (OWASP Top 10)",
                 desc="Security audit of REST API + frontend. Report with severity ratings and remediation recommendations. NDA signed.",
                 cat="security", bmin=1200, bmax=2500, ptype="fixed", level="expert", dur="2 weeks"),
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
                p.delivery_description = "Работа выполнена в полном объёме. Все тесты проходят."
                p.delivery_submitted_at = dt(2)
            db.add(p)
            projects.append((p, pd))
        db.flush()

        # ── BIDS + CONTRACTS + ESCROW ────────────────────────────────────────
        for p_obj, pd in projects:
            if pd["status"] == "open":
                bidders = [fr[0], fr[1], fr[5]] if "SaaS" in pd["title"] else [fr[0], fr[1]]
                for i, bidder in enumerate(bidders[:2]):
                    price = Decimal(str(pd["bmin"])) + Decimal(str(i * 500))
                    db.add(Bid(
                        project_id=p_obj.id, freelancer_id=bidder.id,
                        price=price, status=BidStatus.pending,
                        cover_letter=(
                            f"Здравствуйте! Специализируюсь именно в этой области. "
                            f"Готов начать сразу, опыт {bidder.bio[:60]}..."
                        ),
                    ))
                continue

            if pd["freelancer"] is None:
                continue

            bid_price = Decimal(str(pd["bid_price"]))
            bid = Bid(
                project_id=p_obj.id, freelancer_id=pd["freelancer"].id,
                price=bid_price, status=BidStatus.accepted,
                cover_letter="Опыт именно в этой области. Сроки и качество гарантирую.",
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

        # ── REVIEWS ─────────────────────────────────────────────────────────
        review_data = [
            (0, cl[0], fr[0], 5, "Alexei delivered everything perfectly. Deadlines, code quality, communication — top notch!"),
            (0, fr[0], cl[0], 5, "Timur is an excellent client. Clear requirements, fast responses, fair payment."),
            (1, cl[2], fr[3], 5, "Aisha is a world-class professional. The model achieved 94% precision. Incredible work!"),
            (1, fr[3], cl[2], 4, "Interesting project. Requirements changed a few times but overall a pleasure to work with."),
            (2, cl[3], fr[2], 5, "Marco created exactly what we envisioned. The design system is simply brilliant."),
            (2, fr[2], cl[3], 5, "Sofia is a designer's dream client. Knows what she wants and values quality."),
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
        for u in [*clients, *[f[0] for f in freelancers]]:
            check_and_grant(u, db)

        db.commit()
        print("Seed complete!\n")
        print("Login credentials:")
        print("  Admin:       admin@workflow.com      / admin123")
        print("  Client 1:    timur@techcorp.tj       / pass123")
        print("  Client 2:    amina@greenleaf.com     / pass123")
        print("  Client 3:    damir@fintech.kz        / pass123")
        print("  Client 4:    sofia@designstudio.de   / pass123")
        print("  Freelancer:  alexei@dev.ru            / pass123")
        print("  Freelancer:  zara@flutter.dev         / pass123")
        print("  Freelancer:  marco@design.it          / pass123")
        print("  Freelancer:  aisha@ailab.kz           / pass123")
        print("  Freelancer:  bekzod@devops.uz         / pass123")
        print("  Freelancer:  diana@content.ru         / pass123")
        print("")

    except Exception as e:
        db.rollback()
        print(f"SEED FAILED: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
