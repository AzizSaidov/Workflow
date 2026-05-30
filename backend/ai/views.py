import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-6"


async def _ask(system: str, user_msg: str) -> str:
    if not ANTHROPIC_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured — set ANTHROPIC_API_KEY")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            ANTHROPIC_URL,
            headers={
                "x-api-key": ANTHROPIC_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": MODEL,
                "max_tokens": 1024,
                "system": system,
                "messages": [{"role": "user", "content": user_msg}],
            },
        )
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]


async def help_project(title: str, rough_description: str, category: str, budget: str) -> str:
    system = (
        "Ты помощник фриланс-платформы Workflow. "
        "Помоги заказчику написать чёткое, профессиональное описание проекта на русском языке. "
        "Верни только готовый текст описания, без лишних комментариев."
    )
    user_msg = (
        f"Название: {title}\n"
        f"Категория: {category}\n"
        f"Бюджет: {budget}\n"
        f"Черновое описание: {rough_description}"
    )
    return await _ask(system, user_msg)


async def help_bid(project_title: str, project_description: str, skills: list[str]) -> str:
    system = (
        "Ты помощник фриланс-платформы Workflow. "
        "Помоги фрилансеру написать убедительное сопроводительное письмо для заявки на проект. "
        "Верни только готовый текст письма на русском языке, без лишних комментариев."
    )
    user_msg = (
        f"Проект: {project_title}\n"
        f"Описание проекта: {project_description}\n"
        f"Навыки фрилансера: {', '.join(skills)}"
    )
    return await _ask(system, user_msg)


async def ai_chat(message: str, context: str | None) -> str:
    system = (
        "Ты AI-ассистент фриланс-платформы Workflow. "
        "Помогай пользователям с вопросами о платформе, фрилансе и поиске работы. "
        "Отвечай на русском языке."
    )
    user_msg = f"{context}\n\n{message}" if context else message
    return await _ask(system, user_msg)
