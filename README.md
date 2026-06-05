# 🚀 Workflow — фриланс-платформа

Аналог Upwork: заказчики публикуют проекты, фрилансеры подают заявки, оплата проходит через
**эскроу** (деньги замораживаются и выдаются только после приёмки). Плюс реалтайм-чат,
AI-ассистент, 3D-глобус пользователей, система достижений и админ-панель.

> 📖 **Подробный разбор всего проекта** (архитектура, модели, фичи, где Redis/Celery/WebSocket,
> как работает AI и глобус, что пока заглушки) — в **[DOCUMENTATION.md](./DOCUMENTATION.md)**.

---

## Стек

- **Frontend:** React 18, Vite, React Router v6, Zustand, Axios, Three.js + react-globe.gl, чистый CSS
- **Backend:** FastAPI, PostgreSQL (порт 5433), SQLAlchemy 2.x, Alembic, Pydantic v2, Redis, Celery, JWT
- **AI:** Groq API (Llama 3.3 70B)
- **Инфра:** Docker Compose (Postgres + Redis), Nginx (prod)

## Возможности

- Проекты и заявки с флоу `open → in_progress → delivered → completed`
- Эскроу: заморозка → выплата/возврат/спор, комиссия 1%
- Реалтайм-чат и уведомления (WebSocket)
- AI-ассистент: генерация ТЗ, cover letter, описание сдачи, AI-ранжирование заявок
- Профили (навыки/языки/категории из справочников), портфолио, сертификаты, отзывы, рейтинг
- Достижения, избранное, жалобы
- 3D-глобус пользователей (по геолокации), звёздный фон, новогодний режим
- Админ-панель: модерация проектов, споры, верификация, пополнение, журнал действий, статистика с графиком

## Запуск

```bash
# 1. База и Redis
docker-compose up -d

# 2. Backend (http://localhost:8000, Swagger /docs)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
python seed.py            # тестовые данные

# 3. Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

**Переменные окружения** — в `backend/.env` (см. DOCUMENTATION.md §11).
**Тестовый админ:** `admin@workflow.com` / `admin123`.

## Структура

```
backend/    FastAPI: main.py, database.py, routers/, tasks/, <модуль>/{models,schemas,views}.py
frontend/   React: src/{store,api,components,pages,hooks}
```

🤖 Документация и значительная часть кода созданы с помощью [Claude Code](https://claude.com/claude-code).
