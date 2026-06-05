from fastapi import APIRouter, Depends
from ai.schemas import (
    HelpProjectRequest, HelpProjectResponse,
    HelpBidRequest, HelpBidResponse,
    AIChatRequest, AIChatResponse,
    EditTextRequest, EditTextResponse,
    HelpDeliverRequest, HelpDeliverResponse,
    RankBidsRequest, RankBidsResponse,
)
from ai.views import help_project, help_bid, ai_chat, edit_text, help_deliver, rank_bids
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


@ai_router.post("/edit-text", response_model=EditTextResponse)
async def ai_edit_text(data: EditTextRequest, _: User = Depends(get_current_user)):
    text = await edit_text(data.text, data.action)
    return EditTextResponse(text=text)


@ai_router.post("/help-deliver", response_model=HelpDeliverResponse)
async def ai_help_deliver(data: HelpDeliverRequest, _: User = Depends(get_current_user)):
    text = await help_deliver(data.project_title, data.project_description)
    return HelpDeliverResponse(text=text)


@ai_router.post("/rank-bids", response_model=RankBidsResponse)
async def ai_rank_bids(data: RankBidsRequest, _: User = Depends(get_current_user)):
    text = await rank_bids(data.project_title, data.budget, data.description, data.bids_summary)
    return RankBidsResponse(text=text)
