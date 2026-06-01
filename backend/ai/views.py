import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

GROQ_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"


async def _ask(system: str, user_msg: str) -> str:
    if not GROQ_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured — set GROQ_API_KEY")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "max_tokens": 1024,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_msg},
                ],
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def help_project(title: str, rough_description: str, category: str, budget: str) -> str:
    system = (
        "You are an assistant for the Workflow freelance platform. "
        "Help the client write a clear, professional project description. "
        "Return only the finished description text, no extra commentary."
    )
    user_msg = (
        f"Title: {title}\n"
        f"Category: {category}\n"
        f"Budget: {budget}\n"
        f"Draft description: {rough_description}"
    )
    return await _ask(system, user_msg)


async def help_bid(project_title: str, project_description: str, skills: list[str]) -> str:
    system = (
        "You are an assistant for the Workflow freelance platform. "
        "Help the freelancer write a compelling cover letter for their bid. "
        "Return only the finished cover letter text, no extra commentary."
    )
    user_msg = (
        f"Project: {project_title}\n"
        f"Project description: {project_description}\n"
        f"Freelancer skills: {', '.join(skills) if skills else 'Not specified'}"
    )
    return await _ask(system, user_msg)


async def ai_chat(message: str, context: str | None) -> str:
    system = (
        "You are an AI assistant for the Workflow freelance platform. "
        "Help users with questions about freelancing, projects, and the platform. "
        "Be concise and helpful."
    )
    user_msg = f"{context}\n\n{message}" if context else message
    return await _ask(system, user_msg)
