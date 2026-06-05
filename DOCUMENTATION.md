# Workflow — полная документация проекта

> Этот файл — «карта» проекта: что это, на чём сделано, как устроено, где какая логика
> лежит и что пока работает «для вида». Цель — прочитать и уметь пересказать весь проект.

---

## 1. Что такое Workflow

**Workflow** — фриланс-платформа (аналог Upwork). Заказчики публикуют проекты, фрилансеры
подают заявки, оплата идёт через **эскроу** (деньги замораживаются и выдаются только после
приёмки работы). Сверху — реалтайм-чат, AI-ассистент, 3D-глобус пользователей, система
достижений и полноценная админ-панель.

**Три роли:**
- **Заказчик (client)** — создаёт проекты, нанимает, платит.
- **Фрилансер (freelancer)** — ищет проекты, подаёт заявки, выполняет работу.
- **Администратор (admin)** — модерация, споры, верификация, статистика.

---

## 2. Технологии (стек) и зачем каждая

### Backend
| Технология | Зачем |
|---|---|
| **FastAPI** | веб-фреймворк, весь REST API и WebSocket |
| **Uvicorn** (dev) / **Gunicorn** (prod) | ASGI-сервер, запускает приложение |
| **PostgreSQL** (порт **5433**) | основная база данных |
| **SQLAlchemy 2.x** | ORM — модели и запросы к БД |
| **Alembic** | миграции схемы БД |
| **Pydantic v2** | валидация запросов/ответов (схемы) |
| **Redis** | онлайн-статус, новогодний режим, брокер для Celery |
| **Celery** | фоновые задачи (письма, проверка дедлайнов) |
| **python-jose** | JWT-токены (access/refresh) |
| **passlib + bcrypt** | хеширование паролей |
| **httpx** | async HTTP-клиент (запросы к Groq AI) |
| **python-multipart / aiofiles** | загрузка и хранение файлов |

### Frontend
| Технология | Зачем |
|---|---|
| **React 18 + Vite** | UI и сборка |
| **React Router v6** | маршрутизация страниц |
| **Zustand** | глобальное состояние (без Redux) |
| **Axios** | HTTP-клиент к backend (`src/api/client.js`) |
| **Three.js + react-globe.gl** | 3D-глобус пользователей |
| **Canvas API** | звёздный фон (`StarBackground`) |
| **Tabler Icons** (webfont) | иконки `ti ti-*` |
| **Чистый CSS** | без Tailwind/Bootstrap; дизайн-токены в CSS-переменных |

### AI
- **Groq API**, модель **llama-3.3-70b-versatile**. Endpoint OpenAI-совместимый.
  Ключ `GROQ_API_KEY` в `backend/.env`. Вся логика — `backend/ai/views.py`.

### Инфраструктура
- **Docker Compose** — поднимает PostgreSQL и Redis.
- **Nginx** (prod) — отдаёт собранный фронт + проксирует `/api/` и `/ws/`.

---

## 3. Архитектура: как устроены папки

### Backend (`backend/`)
```
main.py            # создаёт FastAPI-приложение, подключает ВСЕ роутеры
database.py        # engine (pool_size=20), SessionLocal, Base, get_db
utils.py           # get_dushanbe_time() — UTC+5, время для всех timestamp
seed.py            # тестовые данные (--force дропает схему и пересоздаёт)
routers/           # ВСЕ роутеры тут (HTTP-маршруты → вызывают views)
tasks/             # Celery: celery_app.py + notification_tasks.py
<модуль>/          # на каждый домен: models.py, schemas.py, views.py
```

**Паттерн модуля** (одинаковый везде):
- `models.py` — таблицы SQLAlchemy.
- `schemas.py` — Pydantic-схемы (вход/выход API).
- `views.py` — **вся бизнес-логика** (роутеры только принимают запрос и зовут view).

**Модули:** `users, projects, bids, wallet, escrow, chats, reviews, profiles, stats,
media, notifications, ai, search, reports, categories, skills, languages, client_profiles,
certifications, portfolio, contracts, favorites, disputes, admin, achievements`.

### Frontend (`frontend/src/`)
```
store/        # Zustand: authStore, themeStore, toastStore, siteStore
api/          # client.js (axios) + модульные файлы (projects, bids, ai, admin, ...)
components/   # Navbar, Globe, StarBackground, ChatWidget, AITextarea, Button, ...
pages/        # Home, Login, ProjectsFeed, ProjectDetail, Profile, Wallet, AdminPanel, ...
hooks/        # useSEO
```
- Все запросы — **только** через `api/client.js` (Bearer-токен + авто-refresh).
- Состояние — через Zustand, без prop-drilling.

---

## 4. Модели данных и связи

| Модель (таблица) | Ключевое | Связи |
|---|---|---|
| **User** | email, password(hash), role, is_banned, is_admin, lat/lng | владелец всего |
| **FreelancerProfile** | title, hourly_rate, rating, total_jobs, is_verified, connects_balance | 1–1 с User |
| **ClientProfile** | is_verified, инфо о заказчике | 1–1 с User |
| **Project** | title, description, budget_min/max, status, project_type, category_id, assigned_freelancer_id | принадлежит client, ссылается на freelancer |
| **Bid** | price, cover_letter, status (pending/accepted/rejected) | project ↔ freelancer |
| **Wallet** | balance, frozen | 1–1 с User |
| **Transaction** (эскроу) | amount, status (frozen/released/refunded/disputed), released_at | project, client, freelancer |
| **Contract** | amount, deadline | создаётся при принятии заявки |
| **Message** | content, file_url, edited_at | чат проекта |
| **Notification** | type, title, message, is_read | пользователю |
| **Review** | rating, comment | project, reviewer, reviewee |
| **Favorite** | project_id ИЛИ freelancer_id | пользователя |
| **Achievement / UserAchievement** | key, points + `UniqueConstraint(user_id, achievement_id)` | выданные ачивки |
| **Report** | reason, description, status | жалоба на юзера/проект |
| **Skill / Language / Category** | справочники | M2M через SkillToProfile / ProfileLanguage / ProfileCategory / ProjectSkill |
| **ProfileLike** | liker_id, liked_user_id | лайки профилей |
| **Certification / PortfolioItem** | сертификаты и работы | у фрилансера |
| **AdminAuditLog** | admin_id, action, target, detail | журнал действий админов |

Время везде — `get_dushanbe_time()` (UTC+5) из `utils.py`.

---

## 5. Главные фичи: что это и где логика

### Аутентификация (JWT)
- Логика: `users/views.py`, `users/auth.py`, `users/permissions.py`.
- При логине выдаются **access** (30 мин) и **refresh** (7 дней) токены.
- Фронт хранит их в `localStorage` (`workflow-auth`, через Zustand persist).
- `api/client.js` подставляет `Authorization: Bearer` и при `401` **сам обновляет**
  access по refresh-токену (interceptor), повторяет запрос; если refresh протух → разлогин.
- Зависимости доступа: `get_current_user` (обязателен), `get_optional_user` (публичные
  страницы), `check_admin` (только админ). Забаненного (не админа) отбивает 403.

### Роли и защита маршрутов
- Фронт: `components/ProtectedRoute.jsx` — нет токена → `/login`; не та роль → `/dashboard`.
- Бэк: каждая мутация проверяет владельца/роль во view.

### Проекты и флоу статусов
- Логика: `projects/views.py`. Статусы:
  `open → in_progress → delivered → completed` (либо `disputed` / `cancelled`).
- Лента `/projects` показывает только `open` **и без назначенного фрилансера**
  (после принятия заявки проект уходит из ленты и не принимает новые заявки).

### Заявки (bids)
- Логика: `bids/views.py`. Фрилансер подаёт ставку (в рамках бюджета) + cover letter.
- Принятие заявки (`accept_bid`): назначает фрилансера, отклоняет остальные, создаёт `Contract`.
  Статус проекта при этом ещё `open` — деньги замораживаются отдельным шагом (эскроу).

### Эскроу (сердце оплаты)
- Логика: `escrow/views.py` + `projects/views.py::accept_delivery`.
- **freeze** — заказчик замораживает `bid.price`: списывается с `balance` в `frozen`,
  проект → `in_progress`, создаётся `Transaction(status=frozen)`.
- **release / accept_delivery** — заказчик принял работу: фрилансеру уходит сумма
  **минус комиссия** (`PLATFORM_COMMISSION_RATE`, по умолчанию **1%**), проект → `completed`,
  `total_jobs += 1`, выдаются ачивки.
- **dispute** — заказчик открыл спор → решает админ (release или refund).
- **refund** — возврат заказчику, проект → `cancelled`.
- Комиссия платформы = `сумма × rate`; в админке показывается как «доход платформы».

### Кошелёк
- Логика: `wallet/views.py`. `balance` (доступно) и `frozen` (в эскроу).
- Пополнение для обычных юзеров — **только через админа** (`/admin/wallet/topup`).

### Отзывы и рейтинг
- Логика: `reviews/views.py`. Отзыв можно оставить **только** участникам **завершённого**
  проекта, один отзыв на проект. Рейтинг фрилансера = среднее по всем его отзывам.

### Профили
- Логика: `profiles/views.py`. Навыки/языки/категории — **только из справочников**
  (`/api/skills`, `/api/languages`, `/api/categories`), не свободный ввод.
- `is_online` берётся из Redis и отдаётся в `ProfileResponse`.

### Избранное / лайки / жалобы
- `favorites/`, `profiles/views.py::toggle_like`, `reports/`.

### Достижения (ачивки)
- Логика: `achievements/views.py`. ~35 ачивок (первая заявка, X завершённых, рейтинг,
  заработок, портфолио, верификация и т.д.).
- `check_and_grant(user, db)` вызывается после значимых действий (создание заявки/проекта,
  приём заявки, релиз эскроу, отзыв, добавление навыка/портфолио/сертификата, верификация).
- Дубли невозможны: `UniqueConstraint(user_id, achievement_id)` + основное действие
  коммитится **до** выдачи, поэтому откат дубль-гранта не ломает действие.

### Уведомления
- Логика: `notifications/views.py::create_notification` (внутри транзакции, без своего commit).
- Доставка в реалтайме — через WebSocket (см. §8).

### Чат
- Логика: `chats/views.py` + `chats/manager.py` (ConnectionManager).
- Доступен **только участникам** проekта (client + назначенный freelancer) и только в
  статусах in_progress/delivered/completed. Реалтайм — WebSocket.

### AI-ассистент — см. §7 (отдельно, т.к. вопрос частый).

### 3D-глобус
- Компонент: `components/Globe.jsx` (**react-globe.gl** поверх **Three.js**).
- Данные точек — эндпоинт локаций (`stats/views.py::get_user_locations`): берёт всех юзеров,
  у кого заполнены `latitude/longitude`. Координаты ставятся **по геолокации браузера**
  при логине (`Login.jsx` → `authApi.updateLocation`).
- Цвета точек по роли, дуги «сделок», орбитальные кольца, новогодний режим (снег + иней).

### Звёздный фон
- `components/StarBackground.jsx` — чистый **Canvas 2D**: звёзды, падающие звёзды (тёмная тема),
  mesh-блобы + сетка точек (светлая тема). В новогоднем режиме палитра меняется на ледяную.

### Админ-панель
- Фронт: `pages/AdminPanel.jsx`; бэк: `admin/views.py` + `routers/admin_routers.py`.
- Разделы: **Обзор** (карточки + 14-дневный SVG-график + доход платформы),
  **Пользователи** (бан/верификация/роли/админка), **Проекты** (модерация: скрыть/удалить),
  **Кошельки** (пополнение), **Транзакции** (реестр), **Споры** (release/refund),
  **Жалобы** (бан из жалобы с причиной), **Журнал** (audit log всех действий админов),
  **Настройки** (новогодний режим).

### Новогодний режим
- Глобальный флаг в Redis (`site:holiday_mode`), переключает админ.
- Фронт читает его при старте (`siteStore`), включает снежинки, ледяную палитру (через
  CSS-переменные), заснеженный глобус. Один тумблер — для всех пользователей сразу.

### Медиа/файлы
- `media/views.py`. Загрузка `POST /api/media/upload` → URL; физически в `backend/uploads/`.
- Лимит 50 MB, типы: изображения, pdf, docx, zip, mp4, аудио и т.д.

---

## 6. Где используется Redis

1. **Онлайн-статус** — `users/permissions.py`: на каждый авторизованный запрос
   `SETEX online:{user_id} 300 1`. Кто онлайн = есть ключ. Счётчик онлайна —
   `stats/views.py::get_online_count` (`keys("online:*")`).
2. **Новогодний режим** — `routers/settings_routers.py`: ключ `site:holiday_mode`.
3. **Брокер и backend Celery** — `tasks/celery_app.py` (очередь задач лежит в Redis).

---

## 7. Как работает AI (откуда берёт данные)

Вся логика — `backend/ai/views.py`, через **Groq API** (llama-3.3-70b-versatile, httpx).
Данные AI **не выдумывает** — фронт передаёт ему контекст из БД/формы:

| Функция | Откуда данные | Что делает |
|---|---|---|
| `help_project` | форма «название/описание/категория/бюджет» | пишет ТЗ проекта |
| `help_bid` | название+описание проекта + навыки фрилансера | пишет cover letter |
| `help_deliver` | название+описание проекта | описывает сданную работу |
| `edit_text` | текст из textarea | улучшить / сократить / перевести |
| `rank_bids` | **реальные профили заявителей** (рейтинг, завершённые, ставка, навыки) + тексты заявок | ранжирует заявки, отдаёт JSON `{order, reasons}` для «✨ AI Rank» на странице проекта |
| `ai_chat` | системный промпт о платформе + история + **роль пользователя** | чат-ассистент `/ai` |

- `AITextarea` (`components/AITextarea.jsx`) — переиспользуемый textarea с ✨-меню
  (generate / improve / shorten / translate), работает в режимах `bid` / `project` / `deliver`.
- Чат-ассистент знает весь флоу платформы и **шпаргалку по странице `/projects/:id`**
  (что делать по роли и статусу), отвечает по-русски, учитывает роль пользователя.

---

## 8. Где используется WebSocket

Два постоянных соединения (авторизация — токеном в query-параметре `?token=`):

| Соединение | URL | Кто | Файлы |
|---|---|---|---|
| **Чат** | `ws://.../ws/chat/{project_id}` | только участники проекта | `routers/chat_routers.py`, `chats/manager.py` |
| **Уведомления** | `ws://.../ws/notifications/{user_id}` | любой авторизованный | `routers/notification_routers.py`, `notifications/manager.py` |

- Токен валидируется `decode_token`; `code=4001` = unauthorized, `4003` = не участник.
- Сессии БД для WS — **короткоживущие**: `SessionLocal()` открывается только на время
  записи в БД и сразу закрывается (не держится во время `await`).
- Редактирование/удаление сообщений — через REST (`PUT/DELETE`), сервер делает `broadcast`
  с типами `message_updated` / `message_deleted`.
- Уведомления — опрос раз в 5 секунд, отдаёт записи новее `last_check`.

---

## 9. Где используется Celery

- Конфиг: `tasks/celery_app.py` (брокер/бэкенд — Redis, таймзона Asia/Dushanbe).
- Задачи: `tasks/notification_tasks.py`.
- **`check_deadlines`** — по расписанию (Celery **beat**, каждый день 09:00): шлёт
  напоминания о дедлайне за 3 дня / 1 день и предупреждение о просрочке. **Реальная логика
  есть**, но нужен запущенный `celery beat` (на демо обычно не запускают).
- Запуск: `celery -A tasks.celery_app worker` (+ `... beat` для расписания).

---

## 10. Что пока БЕЗ логики / заглушки / легаси (честно)

> Это важно знать при пересказе — часть вещей сделана «по фасаду».

- **Оплата по часам (`project_type: hourly`)** — только **метка/фильтр**. Реального учёта часов
  и почасового биллinga нет: эскроу всегда замораживает фиксированный `bid.price`.
  `hourly_rate` в профиле — только для отображения и фильтра поиска.
- **Верификация** — админ просто жмёт тумблер (`is_verified = true`). Проверки документов нет;
  фича даёт **значок** на профиле + ачивку «Верифицирован».
- **Email-уведомления (Celery)** — `send_email_notification` это `print(...)`-заглушка
  (TODO SMTP/SendGrid). Хелперы `send_bid_accepted_email` / `send_payment_received_email`
  **вообще нигде не вызываются** (живой путь — внутренние уведомления). В тексте писем
  валюта `TJS` — рассинхрон с `$` в приложении.
- **Депозит** (`POST /api/wallet/deposit`) — mock без платёжного шлюза; в UI убран,
  пополнение только через админку.
- **Реальные платежи** — их нет. Кошелёк виртуальный, валюта везде `$`.
- **Connects** (механика «коннектов» как на Upwork) — поле `connects_balance` есть, логики списания нет.
- **Forgot password** — не реализован.
- **Мобильная адаптация** — осознанно desktop-first.
- **Легаси-поля БД**: `Project.category` (строка) живёт рядом с новым `category_id` (FK);
  `FreelancerProfile.skills` и `portfolio` (ARRAY/JSONB) — старые, заменены на M2M-таблицы.
- **Эндпоинты, не вызываемые фронтом** (но рабочие через Swagger): `/escrow/{tx_id}/release`
  (UI использует `/projects/{id}/accept-delivery`), `/media/{project_id}/deliver`
  (сдача файлом), `/wallet/deposit`.
- **WS-URL захардкожены** как `ws://localhost:8000/...` в `api/chats.js` и `notifications.js` —
  при деплое надо параметризовать.

---

## 11. Запуск

```powershell
docker-compose up -d                      # PostgreSQL + Redis

cd backend
.venv\Scripts\activate
uvicorn main:app --reload                 # API на :8000, Swagger /docs
python seed.py                            # тестовые данные (--force = дроп схемы)
celery -A tasks.celery_app worker         # (опционально) фоновые задачи

cd frontend
npm install && npm run dev                # UI на :5173
```

**Переменные окружения** (`backend/.env`): `DATABASE_URL` (порт 5433), `REDIS_URL`,
`SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `GROQ_API_KEY`,
`PLATFORM_COMMISSION_RATE`.

**Тестовый админ:** `admin@workflow.com` / `admin123`.

---

## 12. Шпаргалка «за 30 секунд»

Workflow — фриланс-биржа на **FastAPI + React**, данные в **PostgreSQL**, реалтайм и
онлайн-статус через **Redis + WebSocket**, фоновые задачи на **Celery**, AI-помощник на
**Groq (Llama 3.3)**, 3D-глобус на **Three.js/react-globe.gl**. Деньги — через **эскроу** с
комиссией 1%. Логика бэка — во `views.py` каждого модуля, маршруты — в `routers/`,
состояние фронта — в **Zustand**, все запросы — через один axios-клиент с авто-refresh JWT.
Часть фич (почасовая оплата, верификация, email, депозит) сделаны как фасад без полной логики.














# Admin:        admin@workflow.com       / admin123
# Client 1:     timur@techcorp.tj        / pass123
# Client 2:     amina@greenleaf.com      / pass123
# Client 3:     damir@fintech.kz         / pass123
# Client 4:     sofia@designstudio.de    / pass123
# Client 5:     chen@aiventures.cn       / pass123
# Client 6:     carlos@agencia.mx        / pass123
# Freelancer 1: alexei@dev.ru             / pass123
# Freelancer 2: zara@flutter.dev          / pass123
# Freelancer 3: marco@design.it           / pass123
# Freelancer 4: aisha@ailab.kz            / pass123
# Freelancer 5: bekzod@devops.uz          / pass123
# Freelancer 6: diana@content.ru          / pass123
# Freelancer 7: ryan@security.io          / pass123
# Freelancer 8: lena@video.de             / pass123
# Freelancer 9: arjun@backend.in          / pass123
# Freelancer 10:natasha@finance.ru        / pass123


  ┌─────────┬────────────────────────┬───────┐
  │    #    │          Кто           │ Город │
  ├─────────┼────────────────────────┼───────┤
  │ admin   │ Miami, США             │       │
  ├─────────┼────────────────────────┼───────┤
  │ timur   │ New York, США          │       │
  ├─────────┼────────────────────────┼───────┤
  │ amina   │ Chicago, США           │       │
  ├─────────┼────────────────────────┼───────┤
  │ damir   │ Houston, США           │       │
  ├─────────┼────────────────────────┼───────┤
  │ carlos  │ Los Angeles, США       │       │
  ├─────────┼────────────────────────┼───────┤
  │ arjun   │ Seattle, США           │       │
  ├─────────┼────────────────────────┼───────┤
  │ ryan    │ London, UK             │       │
  ├─────────┼────────────────────────┼───────┤
  │ marco   │ Madrid, Spain          │       │
  ├─────────┼────────────────────────┼───────┤
  │ zara    │ Rome, Italy            │       │
  ├─────────┼────────────────────────┼───────┤
  │ lena    │ Vienna, Austria        │       │
  ├─────────┼────────────────────────┼───────┤
  │ bekzod  │ Warsaw, Poland         │       │
  ├─────────┼────────────────────────┼───────┤
  │ diana   │ Stockholm, Sweden      │       │
  ├─────────┼────────────────────────┼───────┤
  │ sofia   │ Berlin, Germany        │       │
  ├─────────┼────────────────────────┼───────┤
  │ alexei  │ Moscow, Russia         │       │
  ├─────────┼────────────────────────┼───────┤
  │ natasha │ St. Petersburg, Russia │       │
  ├─────────┼────────────────────────┼───────┤
  │ chen    │ Beijing, China         │       │
  ├─────────┼────────────────────────┼───────┤
  │ aisha   │ Shanghai, China        │       │
  └─────────┴────────────────────────┴───────┘


 31 модель и 143 API эндпоинта (включая 2 WebSocket).

  Модели по модулям:
  - users — User
  - profiles — FreelancerProfile, SkillToProfile, ProfileLanguage, ProfileCategory, ProfileLike
  - projects — Project, ProjectSkill, ProjectRevision
  - bids — Bid
  - escrow — Transaction
  - wallet — Wallet
  - chats — Message, ChatHidden
  - notifications — Notification
  - achievements — Achievement, UserAchievement
  - contracts — Contract
  - disputes — DisputeMessage
  - reports — Report
  - reviews — Review
  - portfolio — PortfolioItem, PortfolioLike
  - media — ProjectFile
  - favorites — Favorite
  - client_profiles — ClientProfile
  - certifications — Certification
  - categories — Category
  - skills — Skill
  - languages — Language
  - admin — AdminAuditLog
