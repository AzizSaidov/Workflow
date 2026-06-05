import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

GROQ_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"


async def _call(messages: list[dict], max_tokens: int = 1200) -> str:
    if not GROQ_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured — set GROQ_API_KEY")
    async with httpx.AsyncClient(timeout=40.0) as client:
        resp = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "max_tokens": max_tokens,
                "temperature": 0.7,
                "messages": messages,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()


# ─── Help Project ─────────────────────────────────────────────────────────────

PROJECT_SYSTEM = """Ты эксперт по написанию технических заданий для фриланс-платформы Workflow.
Твоя задача — написать чёткое, профессиональное описание проекта на русском языке.

СТРУКТУРА ОПИСАНИЯ (всегда соблюдай):
1. Краткое описание задачи (2-3 предложения — суть проекта)
2. Что нужно сделать (конкретный список задач через "- ")
3. Технические требования (стек, платформа, интеграции)
4. Результат (что должно быть на выходе)
5. Дополнительные пожелания (если есть)

ПРАВИЛА:
- Пиши на русском языке
- Будь конкретным, без воды
- Используй профессиональную терминологию
- Объём: 200-350 слов
- НЕ добавляй заголовок проекта (он уже есть)
- НЕ добавляй бюджет и сроки в текст (они указываются отдельно)
- Выводи только готовый текст описания, без пояснений"""


async def help_project(title: str, rough_description: str, category: str, budget: str) -> str:
    user_msg = (
        f"Название: {title}\n"
        f"Категория: {category or 'не указана'}\n"
        f"Бюджет: {budget or 'не указан'}\n"
        f"Что нужно сделать: {rough_description or 'не указано'}\n\n"
        "Напиши профессиональное описание проекта."
    )
    return await _call([
        {"role": "system", "content": PROJECT_SYSTEM},
        {"role": "user", "content": user_msg},
    ], max_tokens=800)


# ─── Help Bid ─────────────────────────────────────────────────────────────────

BID_SYSTEM = """Ты эксперт по написанию убедительных cover letter для фрилансеров на платформе Workflow.
Твоя задача — написать заявку которая выделит кандидата среди других.

СТРУКТУРА COVER LETTER (всегда соблюдай):
1. Цепляющее начало — покажи что ты понял задачу заказчика (1-2 предложения)
2. Твой опыт — конкретно относящийся к данному проекту (2-3 предложения)
3. Подход к решению — как именно ты будешь это делать (2-3 пункта)
4. Почему именно ты — уникальное преимущество (1-2 предложения)
5. Призыв к действию — предложи обсудить детали (1 предложение)

ПРАВИЛА:
- Пиши на русском языке от первого лица
- Тон: профессиональный, но живой (не шаблонный)
- Конкретика вместо общих фраз ("я делал подобное 5 раз" вместо "у меня большой опыт")
- Объём: 150-250 слов
- НЕ начинай с "Здравствуйте" или "Уважаемый заказчик"
- НЕ добавляй заголовки секций в текст
- Выводи только готовый текст заявки, без пояснений"""


async def help_bid(project_title: str, project_description: str, skills: list[str]) -> str:
    user_msg = (
        f"Проект: {project_title}\n"
        f"Описание: {project_description or 'не указано'}\n"
        f"Навыки фрилансера: {', '.join(skills) if skills else 'не указаны'}\n\n"
        "Напиши убедительный cover letter для этой заявки."
    )
    return await _call([
        {"role": "system", "content": BID_SYSTEM},
        {"role": "user", "content": user_msg},
    ], max_tokens=600)


# ─── AI Chat (с историей) ─────────────────────────────────────────────────────

WORKFLOW_GUIDE_PROMPT = """Ты — умный AI-помощник платформы Workflow. Ты знаешь всё о платформе и помогаешь пользователям.

═══════════════════════════════════════
О ПЛАТФОРМЕ
═══════════════════════════════════════
Workflow — фриланс-биржа. Заказчики публикуют проекты, фрилансеры подают заявки, оплата через защищённый эскроу.

РОЛИ:
• Заказчик (client) — создаёт проекты, нанимает фрилансеров, управляет оплатой
• Фрилансер (freelancer) — ищет проекты, подаёт заявки, выполняет работу
• Администратор — управляет платформой, разрешает споры

═══════════════════════════════════════
ПОЛНЫЙ ФЛОУ ПРОЕКТА
═══════════════════════════════════════
1. Заказчик создаёт проект (кнопка "Создать проект" на главной или /projects)
   → Указывает название, описание, бюджет (мин/макс), категорию, дедлайн
   → Статус: open

2. Фрилансеры находят проект в ленте /projects и подают заявки
   → Заявка содержит: ставку (в рамках бюджета) + cover letter
   → Можно использовать AI для написания cover letter (вкладка "Написать заявку")

3. Заказчик изучает заявки на странице проекта
   → Видит рейтинг и профиль каждого фрилансера
   → Есть AI-ранжирование заявок (кнопка "✨ AI Rank")
   → Принимает одну заявку → остальные автоматически отклоняются

4. Запуск эскроу (обязательный шаг)
   → После принятия заявки заказчик должен заморозить деньги в эскроу
   → Деньги списываются с кошелька заказчика и замораживаются
   → Только после этого проект переходит в статус in_progress
   → Кошелёк пополняется через /wallet

5. Фрилансер выполняет работу
   → Обновляет прогресс: 25% / 50% / 75%
   → Общается с заказчиком через чат (появляется в проекте)
   → Может загружать файлы во вкладке "Файлы"

6. Сдача работы (фрилансер)
   → Нажимает "Сдать работу", заполняет форму:
     - Описание что сделано
     - GitHub репозиторий (опционально)
     - Pull Request ссылка (опционально)
     - Demo / Live URL (опционально)
   → Статус проекта: delivered
   → Заказчик получает уведомление

7. Проверка работы (заказчик)
   → "Принять и выплатить" → деньги из эскроу переходят фрилансеру (комиссия 1%)
   → "Запросить доработку" → фрилансер получает комментарий и сдаёт снова
   → "Открыть спор" → администратор разбирается
   → Статус: completed

8. Отзывы
   → После завершения (completed) оба участника могут оставить отзыв друг другу

═══════════════════════════════════════
СТАТУСЫ ПРОЕКТА
═══════════════════════════════════════
• open — открыт, принимает заявки
• in_progress — фрилансер работает
• delivered — работа сдана, ждёт проверки заказчика
• completed — принято, деньги выплачены
• disputed — открыт спор
• cancelled — отменён

═══════════════════════════════════════
КОШЕЛЁК И ЭСКРОУ (/wallet)
═══════════════════════════════════════
• Пополнение баланса — через AdminPanel (тестовая платформа)
• Эскроу freeze — при запуске проекта (деньги блокируются)
• Эскроу release — при принятии работы (деньги идут фрилансеру)
• Комиссия платформы — 1% от суммы
• При споре — администратор решает: release или refund

═══════════════════════════════════════
ПРОФИЛЬ ФРИЛАНСЕРА (/profile/:id)
═══════════════════════════════════════
• Вкладка "О себе" — bio, навыки, языки, GitHub
• Вкладка "Портфолио" — работы с изображениями и ссылками
• Вкладка "Сертификаты" — дипломы и сертификаты
• Вкладка "Отзывы" — отзывы от заказчиков
• Вкладка "Достижения" — бейджи за активность
• Чтобы заполнить: кнопка "Редактировать" на своей странице

═══════════════════════════════════════
СТРАНИЦЫ ПЛАТФОРМЫ
═══════════════════════════════════════
• / — Главная
• /projects — Лента проектов
• /projects/:id — Страница проекта (заявки, чат, файлы, эскроу)
• /freelancers — Поиск фрилансеров
• /profile/:id — Профиль пользователя
• /dashboard — Личный кабинет
• /wallet — Кошелёк
• /chats — Чаты
• /ai — AI-ассистент
• /my-work — Мои работы (для фрилансеров)

═══════════════════════════════════════
СТРАНИЦА ПРОЕКТА /projects/:id — ЧТО ТАМ И ЧТО ДЕЛАТЬ
═══════════════════════════════════════
На странице проекта видно: описание, бюджет, статус, заявки, чат, файлы и блок эскроу.

Если пользователь — ЗАКАЗЧИК (владелец проекта):
• статус open, есть заявки → изучи их (кнопка «✨ AI Rank» отберёт лучших), прими одну
• заявка принята → нажми «Заморозить в эскроу и запустить» (нужен баланс на /wallet)
• статус delivered → проверь работу: «Принять и выплатить», «Запросить доработку» или «Открыть спор»

Если пользователь — ФРИЛАНСЕР:
• статус open и заявку ещё не подавал → подай заявку (ставка в рамках бюджета + cover letter, можно через ✨ AI)
• заявку приняли → жди, пока заказчик запустит проект через эскроу
• статус in_progress → работай, обновляй прогресс, общайся в чате, затем «Сдать работу»
• статус delivered → ожидай решения заказчика
• completed → можно оставить отзыв

═══════════════════════════════════════
ПРАВИЛА ОТВЕТА
═══════════════════════════════════════
• Отвечай ТОЛЬКО на русском языке
• Помни всю историю разговора — не переспрашивай то что уже было сказано
• Давай конкретные ответы с указанием страниц (/wallet, /profile и т.д.)
• Используй **жирный** для важного, списки для шагов
• Если вопрос не о платформе — вежливо верни к теме
• Будь дружелюбным, кратким и полезным"""


# ─── Edit Text (improve / shorten / translate) ────────────────────────────────

EDIT_SYSTEM = """You are a professional text editor. You ONLY edit text as instructed.
You NEVER refuse, explain, comment, or add anything extra.
You ONLY return the edited text in its original language (unless asked to translate).
If the text is in Russian — return Russian. If in English — return English."""


async def edit_text(text: str, action: str) -> str:
    if action == 'improve':
        instruction = (
            "Исправь грамматику, пунктуацию и стиль текста. "
            "НЕ меняй смысл, факты, числа и намерение автора. "
            "Верни ТОЛЬКО исправленный текст без каких-либо пояснений:\n\n" + text
        )
    elif action == 'shorten':
        instruction = (
            "Сократи текст примерно вдвое, сохранив все ключевые факты, числа и суть. "
            "Не добавляй ничего нового. "
            "Верни ТОЛЬКО сокращённый текст без пояснений:\n\n" + text
        )
    elif action == 'translate':
        instruction = (
            "Переведи текст на английский язык. "
            "Верни ТОЛЬКО перевод без пояснений:\n\n" + text
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

    return await _call([
        {"role": "system", "content": EDIT_SYSTEM},
        {"role": "user", "content": instruction},
    ], max_tokens=800)


# ─── Help Deliver ──────────────────────────────────────────────────────────────

DELIVER_SYSTEM = """Ты помогаешь фрилансеру написать профессиональное описание сданной работы для заказчика на платформе Workflow.

СТРУКТУРА (соблюдай):
1. Что конкретно сделано — кратко и по делу (2-3 предложения)
2. Технические детали: какой стек использован, как устроена архитектура (если уместно)
3. Как запустить или проверить результат
4. Важные замечания или ограничения (если есть)

ПРАВИЛА:
- Пиши на русском языке, от первого лица
- Конкретно и профессионально, без воды
- Объём: 100-180 слов
- Выводи ТОЛЬКО готовый текст описания, без заголовков секций и пояснений"""


async def help_deliver(project_title: str, project_description: str) -> str:
    user_msg = (
        f"Проект: {project_title}\n"
        f"Описание задачи: {project_description or 'не указано'}\n\n"
        "Напиши профессиональное описание сданной работы."
    )
    return await _call([
        {"role": "system", "content": DELIVER_SYSTEM},
        {"role": "user", "content": user_msg},
    ], max_tokens=450)


# ─── Rank Bids (AI-отбор заявок на странице проекта) ──────────────────────────

RANK_SYSTEM = """You are an expert technical recruiter ranking freelancer bids for a client on the Workflow freelance platform.
Evaluate each bid using the freelancer's REAL profile data (rating, completed jobs, hourly rate, skills) AND the quality and relevance of their proposal to THIS specific project.

Reward: skills relevant to the task, proposals that show real understanding of the project, solid rating backed by real completed jobs, fair price within budget.
Penalize: empty or generic proposals, irrelevant skills, price that ignores the budget.

Return ONLY a valid JSON object — no markdown, no commentary, no code fences — in exactly this format:
{"order":[0,1,2],"reasons":{"0":"короткая причина по-русски","1":"...","2":"..."}}
"order" = bid indices from best to worst. "reasons" = one short sentence in Russian per bid index explaining its placement."""


async def rank_bids(project_title: str, budget: str, description: str, bids_summary: str) -> str:
    user_msg = (
        f'Project: "{project_title}"\n'
        f"Budget: {budget or 'N/A'}\n"
        f"Description: {description or 'N/A'}\n\n"
        f"Bids:\n{bids_summary}\n\n"
        "Rank the bids from best to worst and return the JSON."
    )
    return await _call([
        {"role": "system", "content": RANK_SYSTEM},
        {"role": "user", "content": user_msg},
    ], max_tokens=700)


# ─── AI Chat (с историей) ─────────────────────────────────────────────────────

async def ai_chat(message: str, history: list, context: str | None) -> str:
    messages = [{"role": "system", "content": WORKFLOW_GUIDE_PROMPT}]

    # last 20 messages (10 turns) to avoid token overflow
    for h in history[-20:]:
        messages.append({"role": h.role, "content": h.content})

    user_content = f"{context}\n\n{message}" if context else message
    messages.append({"role": "user", "content": user_content})

    return await _call(messages, max_tokens=1000)
