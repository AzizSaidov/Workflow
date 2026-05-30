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
from routers.notification_routers import notifications_router
from routers.ai_routers import ai_router
from routers.search_routers import search_router
from routers.report_routers import reports_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Workflow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
app.include_router(ai_router)
app.include_router(search_router)
app.include_router(reports_router)
