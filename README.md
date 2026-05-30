Заполни файл frontend/README.md вот таким содержимым:

# 🚀 Workflow — Freelance Platform

Фриланс-платформа с эскроу-оплатой. Заказчики публикуют проекты, фрилансеры подают заявки, деньги передаются безопасно.

## Стек
- Frontend: React 18 + Vite + React Router + Zustand
- Backend: FastAPI + PostgreSQL + Redis + Celery + WebSocket
- Deploy: Docker + GitHub Actions + Nginx

## Запуск через Docker
docker-compose up --build

## Локальный запуск
cd frontend && npm install && npm run dev
cd backend && pip install -r requirements.txt && uvicorn main:app --reload