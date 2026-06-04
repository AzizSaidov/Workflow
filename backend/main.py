from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers.user_routers import users_router
from routers.project_routers import projects_router
from routers.bid_routers import bids_router
from routers.wallet_routers import wallet_router
from routers.escrow_routers import escrow_router
from routers.chat_routers import chats_router
from routers.review_routers import reviews_router
from routers.profile_routers import profiles_router
from routers.stats_routers import stats_router
from routers.media_routers import media_router
from routers.notification_routers import notifications_router, notifications_ws_router
from routers.ai_routers import ai_router
from routers.search_routers import search_router
from routers.report_routers import reports_router
from routers.category_routers import categories_router
from routers.language_routers import languages_router
from routers.client_profile_routers import client_profiles_router
from routers.certification_routers import certifications_router
from routers.portfolio_routers import portfolio_router
from routers.contract_routers import contracts_router
from routers.favorite_routers import favorites_router
from routers.dispute_routers import disputes_router
from routers.admin_routers import admin_router
from routers.achievement_routers import achievements_router
from routers.skill_routers import skills_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        yield
    except asyncio.CancelledError:
        pass

app = FastAPI(title="Workflow API", version="5.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://test.softclub.tj",
        "http://test.softclub.tj",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(projects_router)
app.include_router(bids_router)
app.include_router(wallet_router)
app.include_router(escrow_router)
app.include_router(chats_router)
app.include_router(reviews_router)
app.include_router(profiles_router)
app.include_router(stats_router)
app.include_router(media_router)
app.include_router(notifications_router)
app.include_router(notifications_ws_router)
app.include_router(ai_router)
app.include_router(search_router)
app.include_router(reports_router)
app.include_router(categories_router)
app.include_router(languages_router)
app.include_router(client_profiles_router)
app.include_router(certifications_router)
app.include_router(portfolio_router)
app.include_router(contracts_router)
app.include_router(favorites_router)
app.include_router(disputes_router)
app.include_router(admin_router)
app.include_router(achievements_router)
app.include_router(skills_router)
