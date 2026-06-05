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

BID_SYSTEM = """Ты помогаешь фрилансеру на платформе Workflow написать cover letter (заявку) под конкретный проект заказчика.

КРИТИЧЕСКОЕ ПРАВИЛО О ФАКТАХ:
- Используй ТОЛЬКО те факты, которые реально даны в данных фрилансера и его черновике.
- НИКОГДА не выдумывай: годы опыта, число проектов, названия компаний, образование, конкретные кейсы, цифры, технологии — если их нет во входных данных.
- Если данных о фрилансере мало — НЕ компенсируй это выдумками. Вместо ложных фактов пиши о понимании задачи, мотивации и подходе к решению.
- Если фрилансер написал черновик — опирайся на него: улучшай и структурируй его мысли, а не заменяй своими.

СТРУКТУРА COVER LETTER:
1. Цепляющее начало — покажи что ты понял задачу заказчика (1-2 предложения, опираясь на описание проекта)
2. Релевантность — чем твои реальные навыки/специализация подходят (только из данных)
3. Подход к решению — как именно ты будешь это делать (2-3 конкретных пункта по задаче)
4. Призыв к действию — предложи обсудить детали (1 предложение)

ПРАВИЛА:
- Пиши на русском языке от первого лица
- Тон: профессиональный, но живой (не шаблонный)
- Объём: 120-220 слов
- НЕ начинай с "Здравствуйте" или "Уважаемый заказчик"
- НЕ добавляй заголовки секций в текст
- Выводи только готовый текст заявки, без пояснений"""


async def help_bid(project_title: str, project_description: str, skills: list[str],
                   freelancer_name: str = '', freelancer_title: str = '',
                   freelancer_bio: str = '', freelancer_jobs: int = 0,
                   freelancer_rating: str = '', freelancer_notes: str = '') -> str:
    freelancer_block = ''
    if freelancer_name:
        freelancer_block += f"Имя фрилансера: {freelancer_name}\n"
    if freelancer_title:
        freelancer_block += f"Специализация: {freelancer_title}\n"
    if freelancer_bio:
        freelancer_block += f"О себе: {freelancer_bio}\n"
    if skills:
        freelancer_block += f"Навыки: {', '.join(skills)}\n"
    if freelancer_jobs:
        freelancer_block += f"Завершённых проектов: {freelancer_jobs}\n"
    if freelancer_rating:
        freelancer_block += f"Рейтинг: {freelancer_rating}\n"

    notes_block = (
        f"\n=== ЧЕРНОВИК ФРИЛАНСЕРА (опирайся на него, не выдумывай сверх него) ===\n{freelancer_notes}\n"
        if freelancer_notes and freelancer_notes.strip() else ""
    )

    user_msg = (
        f"=== ДАННЫЕ ФРИЛАНСЕРА (единственный источник фактов о нём) ===\n"
        f"{freelancer_block or 'Данных нет — пиши без конкретных фактов об опыте, только о подходе и мотивации'}\n"
        f"{notes_block}"
        f"\n=== ПРОЕКТ ЗАКАЗЧИКА (под него пишем заявку) ===\n"
        f"Название: {project_title}\n"
        f"Описание: {project_description or 'не указано'}\n\n"
        "Напиши cover letter под этот проект, используя ТОЛЬКО реальные данные фрилансера выше. "
        "Не придумывай факты, которых нет в данных."
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

DELIVER_SYSTEM = """Ты помогаешь фрилансеру оформить описание УЖЕ выполненной работы для заказчика на платформе Workflow.

КРИТИЧЕСКОЕ ПРАВИЛО О ФАКТАХ:
- Ты НЕ знаешь, что фрилансер реально сделал — это знает только он. Поэтому опирайся ИСКЛЮЧИТЕЛЬНО на его заметки о выполненной работе и приложенные ссылки.
- НИКОГДА не выдумывай технологии, функции, метрики, архитектуру или детали, которых нет в заметках фрилансера. Описание задачи проекта — это лишь контекст, а не список того, что сделано.
- Твоя работа — превратить заметки фрилансера в аккуратный, структурированный отчёт о сдаче: исправить формулировки, добавить структуру. НЕ добавляй несуществующих фактов.
- Если заметок мало — оставь описание коротким. Лучше короткий честный отчёт, чем выдуманные подробности.

СТРУКТУРА (если хватает данных из заметок):
1. Что сделано — по заметкам фрилансера
2. Как проверить / где посмотреть результат — если есть ссылки (GitHub, PR, демо)
3. Важные замечания — только если упомянуты

ПРАВИЛА:
- Пиши на русском языке, от первого лица
- Конкретно и профессионально, без воды и без выдумок
- Объём: 60-160 слов
- Выводи ТОЛЬКО готовый текст описания, без заголовков секций и пояснений"""


async def help_deliver(project_title: str, project_description: str,
                       work_notes: str = '', links: str = '') -> str:
    if not (work_notes and work_notes.strip()):
        # Without the freelancer's own notes the AI has nothing real to describe.
        raise HTTPException(
            status_code=422,
            detail="Сначала кратко опишите, что вы сделали — AI оформит это, но не придумывает за вас",
        )
    user_msg = (
        f"=== КОНТЕКСТ ПРОЕКТА (что просил заказчик — НЕ список того, что сделано) ===\n"
        f"Проект: {project_title}\n"
        f"Задача: {project_description or 'не указано'}\n\n"
        f"=== ЗАМЕТКИ ФРИЛАНСЕРА О ВЫПОЛНЕННОЙ РАБОТЕ (единственный источник фактов) ===\n"
        f"{work_notes.strip()}\n"
        f"{('Ссылки на результат: ' + links.strip()) if links and links.strip() else ''}\n\n"
        "Оформи это в аккуратный отчёт о сдаче работы, опираясь ТОЛЬКО на заметки выше. Ничего не выдумывай."
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
