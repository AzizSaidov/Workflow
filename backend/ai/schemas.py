from pydantic import BaseModel


class HelpProjectRequest(BaseModel):
    title: str
    rough_description: str
    category: str
    budget: str


class HelpProjectResponse(BaseModel):
    description: str


class HelpBidRequest(BaseModel):
    project_title: str
    project_description: str
    skills: list[str]


class HelpBidResponse(BaseModel):
    cover_letter: str


class ChatMessage(BaseModel):
    role: str      # 'user' or 'assistant'
    content: str


class AIChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    context: str | None = None


class AIChatResponse(BaseModel):
    text: str


class EditTextRequest(BaseModel):
    text: str
    action: str   # 'improve' | 'shorten' | 'translate'


class EditTextResponse(BaseModel):
    text: str


class HelpDeliverRequest(BaseModel):
    project_title: str
    project_description: str = ''


class HelpDeliverResponse(BaseModel):
    text: str


class RankBidsRequest(BaseModel):
    project_title: str
    budget: str = ''
    description: str = ''
    bids_summary: str


class RankBidsResponse(BaseModel):
    text: str
