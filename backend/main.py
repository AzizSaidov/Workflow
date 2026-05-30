from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers.user_routers import users_router
from routers.project_routers import projects_router
from routers.bid_routers import bids_router
from routers.wallet_routers import wallet_router
from routers.escrow_routers import escrow_router

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
