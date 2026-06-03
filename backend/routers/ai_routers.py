from fastapi import APIRouter, Depends
from ai.schemas import (
    HelpProjectRequest, HelpProjectResponse,
    HelpBidRequest, HelpBidResponse,
    AIChatRequest, AIChatResponse,
)
from ai.views import help_project, help_bid, ai_chat
from users.permissions import get_current_user
from users.models import User

ai_router = APIRouter(prefix="/api/ai", tags=["ai"])


@ai_router.post("/help-project", response_model=HelpProjectResponse)
async def ai_help_project(data: HelpProjectRequest, _: User = Depends(get_current_user)):
    description = await help_project(data.title, data.rough_description, data.category, data.budget)
    return HelpProjectResponse(description=description)


@ai_router.post("/help-bid", response_model=HelpBidResponse)
async def ai_help_bid(data: HelpBidRequest, _: User = Depends(get_current_user)):
    cover_letter = await help_bid(data.project_title, data.project_description, data.skills)
    return HelpBidResponse(cover_letter=cover_letter)


@ai_router.post("/chat", response_model=AIChatResponse)
async def ai_chat_endpoint(data: AIChatRequest, _: User = Depends(get_current_user)):
    text = await ai_chat(data.message, data.history, data.context)
    return AIChatResponse(text=text)
