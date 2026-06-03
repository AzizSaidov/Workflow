# Workflow — ТЗ
### Версия 6.1 | Обновлено 2026-06-03

> Единственный актуальный документ.
> Правило: когда делаем новую версию страницы — старую удаляем.

---

## СТАТУС РЕДИЗАЙНА СТРАНИЦ

| Страница | Файл | Редизайн | Примечание |
|----------|------|----------|------------|
| Home | Home.jsx | ✅ Готово | Персонализация по роли, Globe, секции категорий |
| Login | Login.jsx | ✅ Готово | AuthLeft + Globe слева, форма справа |
| Register | Register.jsx | ✅ Готово | AuthLeft + Globe слева, форма справа |
| RoleSelect | RoleSelect.jsx | ✅ Готово | Два fullscreen-панели, тема день/ночь |
| DashboardClient | DashboardClient.jsx | ✅ Готово | getMine(), "Требует внимания", "Новые заявки" |
| DashboardFreelancer | DashboardFreelancer.jsx | ✅ Готово | AI баннер, сайдбар, "Мои работы" |
| MyWork | MyWork.jsx | ✅ Готово | Трекер работ фрилансера, дедлайны |
| ProjectCard | ProjectCard.jsx | ✅ Готово | Иерархия бюджета, статус, hover |
| FreelancerCard | FreelancerCard.jsx | ✅ Готово | Аватар, рейтинг, навыки, ставка |
| Profile | Profile.jsx | ⏳ Нужен редизайн | Sidebar слева, вкладки |
| ProjectDetail | ProjectDetail.jsx | ⏳ Нужен редизайн | Вкладки Заявки/Чат/Файлы |
| AIAssistant | AIAssistant.jsx | ⏳ Нужен редизайн | Вертикальный sidebar + split layout |
| Wallet | Wallet.jsx | ⏳ Нужен редизайн | Большой баланс, эскроу, фильтр |
| Freelancers | Freelancers.jsx | ⏳ Нужен редизайн | Убрать ProtectedRoute, поиск |
| ProjectsFeed | ProjectsFeed.jsx | ⏳ Пагинация + URL sync | — |
| ClientProfile | — | 🆕 Создать | Профиль заказчика (новая страница) |

---

## ПРАВИЛА ТИПОГРАФИКИ (соблюдать везде)

### Числа и суммы
- Символ `$` ВСЕГДА стоит ДО числа: `$12,450` — не `12,450$`
- Крупные суммы: `$` в меньшем шрифте (60–70% от размера числа), число в Syne 800
- Дробная часть `.00` — если нужна: меньший шрифт, приглушённый цвет
- Отрицательные суммы: красные (`#F87171`), положительные: зелёные (`var(--accent-green)`)
- **Все цифры:** глобально Syne через @font-face unicode-range (уже реализовано в index.css)

### Иерархия заголовков
- H1 страницы: Syne 800, 28–36px, letterSpacing -1.5px
- H2 секции: Syne 700, 18–22px
- Метки/лейблы: 12–13px, uppercase, letterSpacing 0.5, `var(--text-muted)`
- Основной текст: DM Sans 400, 14–15px, `var(--text-secondary)`
- Мутированный текст: DM Sans 300, 13px, `var(--text-muted)`

### Ключевые цифры (stat cards, балансы)
- Главное число на странице: Syne 800, 48–56px
- Второстепенные числа: Syne 700, 28–36px
- Маленькие числа (счётчики в табах): 12–14px bold

---

## ✅ СДЕЛАНО

### Функциональность
- [x] TJS → $ везде
- [x] AI "Улучшить" — не меняет смысл
- [x] Аватарки и имена реальные везде
- [x] Страница /ai (чат + создать проект + написать заявку), для всех ролей
- [x] Публичный доступ — /projects, /projects/:id, /profile/:id без логина
- [x] Гость видит проекты, баннер "Войдите чтобы подать заявку"
- [x] get_optional_user в бэкенде (5 роутеров)
- [x] ProjectDetail — StatusTimeline, форма сдачи, приёмка, файлы
- [x] Profile — Portfolio CRUD (добавить/редактировать/удалить), GitHub URL
- [x] github_url колонка в БД (ALTER TABLE)
- [x] Wallet — `$` перед числом, баланс 56px, эскроу 32px
- [x] Геолокация — красная точка на глобусе, per-user localStorage key
- [x] Страница /my-work (фрилансер: В работе / На проверке / Завершённые)
- [x] Online-статус через Redis (SETEX на каждый HTTP-запрос)

### Редизайн
- [x] Home — персонализация CTA по роли, глобус, категории, skills marquee
- [x] Login / Register — AuthLeft с живым глобусом слева
- [x] RoleSelect — два fullscreen-панели с анимацией, тема день/ночь
- [x] ProjectCard — бюджет иерархия, теги, hover
- [x] FreelancerCard — аватар, рейтинг, навыки, ставка
- [x] DashboardClient — getMine(), секция "Требует внимания", "Новые заявки"
- [x] DashboardFreelancer — AI баннер, "Мои работы", pending hints
- [x] Все цифры → Syne через unicode-range @font-face (index.css)

---

## ОСТАВШИЕСЯ ЗАДАЧИ

### 🔴 ПРИОРИТЕТ 1 — Редизайн страниц

**1. Profile (/profile/:id)**

Sidebar СЛЕВА (1/3) + вкладки справа (2/3):
```
Sidebar: аватар 96px (клик = загрузить для владельца) | имя | профессия
         рейтинг | $X/hr | опыт | Редактировать (инлайн)
         навыки [React][Python][+] | языки | GitHub ↗
         [В избранное ♡] (не владелец)

Вкладки: [О себе] [Портфолио] [Отзывы]
  О себе: bio, опыт, сертификаты (+CRUD для владельца), достижения
  Портфолио: сетка 2кол, [+ Добавить] для владельца
  Отзывы: список с аватарами, средний рейтинг
```

**2. ProjectDetail (/projects/:id)**

Вкладки в главной зоне: **[Заявки N][Чат][Файлы]**
- Клиент видит: Заявки + Чат + Файлы
- Фрилансер видит: Чат + Файлы (+ Заявки только свою)
- Зона действий зависит от роли + статуса

**3. AIAssistant (/ai)**

Вертикальный sidebar слева (1/4) + контент (3/4):
- [🤖 Чат] [✍ Проект] [📝 Заявка]
- Формы "Проект" и "Заявка": split — форма слева, результат справа

**4. Wallet (/wallet)**
- Баланс крупно (56px Syne) + заморожено рядом (28px)
- Таблица транзакций с фильтр-табами [Все][Пополнения][Списания][Эскроу]

---

### 🟡 ПРИОРИТЕТ 2 — Пропущенные фичи из бэкенда

**5. Certifications CRUD в профиле фрилансера**

Сейчас: сертификаты отображаются только если есть (read-only).
Нужно: во вкладке "О себе" для владельца показывать кнопки [+ Добавить сертификат] / редактировать / удалить.

Модель данных (бэкенд `/api/certifications/`):
```
name: str
issuer: str
issue_date: date
expiry_date: date | null
credential_url: str | null
```
API уже готов: `certificationsApi.create/update/delete` в `frontend/src/api/certifications.js`

**6. Client Profile — профиль заказчика**

Сейчас: у заказчиков нет публичного профиля. Фрилансер не может посмотреть на кого работает.
Нужно: страница `/client/:id` или расширение `/profile/:id` для role=client.

Показывать:
- Имя, аватар, дата регистрации
- Компания / описание (PUT /api/client-profiles/me)
- История проектов (completed)
- Рейтинг как заказчика (из reviews)

**7. Кнопка "Открыть спор" для пользователей**

Сейчас: споры только через AdminPanel.
Нужно: в ProjectDetail (статус `in_progress` / `delivered`) кнопка для клиента:
"Открыть спор" → форма с описанием → POST /api/escrow/{tx_id}/dispute

Диалог спора: обмен сообщениями с ответом от admin через `/api/disputes/{tx_id}/messages`.

**8. Кнопка "Пожаловаться" (Report)**

Сейчас: нет нигде.
Нужно: иконка `ti-flag` на:
- Карточке пользователя (FreelancerCard, Profile)
- ProjectDetail (для подозрительных проектов)

POST /api/reports/ — { target_id, target_type: 'user'|'project', reason }

**9. Contracts — контракт в ProjectDetail**

Сейчас: контракты создаются в бэкенде при принятии заявки, но нигде не видны.
Нужно: секция "Контракт" в ProjectDetail для `in_progress`/`completed`:
- Стороны: заказчик ↔ фрилансер
- Сумма, дата начала, статус
- Кнопка для фрилансера: "Завершить контракт" → PUT /api/contracts/{id}/complete

**10. AI Rank — ограничение для заказчика**

Сейчас: кнопка "✨ AI Rank" в ProjectDetail показывает отсортированный список всех заявок.
Нужно: после нажатия AI Rank заказчик видит только **ТОП-3 лучших кандидата**; остальные заявки скрываются за блоком "Показать все" (collapsed). Фрилансеры видят всё как есть (только свою заявку).

Смысл: создать искусственный дефицит внимания — заказчик фокусируется на лучших, не тратит время на слабых.

**11. История доработок (Revision History)**

Сейчас: "Запросить доработку" просто переводит проект обратно в `in_progress`. История теряется.
Нужно:
- При каждой "Запросить доработку" сохранять запись: дата, комментарий клиента
- В ProjectDetail: счётчик доработок рядом со статусом: `Доработок: 2`
- Вкладка или раскрываемый блок "История доработок" с хронологическим списком

Модель данных (новая таблица `project_revisions`):
```
project_id: FK → projects
requested_by: FK → users (client_id)
comment: str
created_at: datetime
```
API: `POST /api/projects/{id}/revisions` + `GET /api/projects/{id}/revisions`

**12. Лайки профиля**

Нужно: кнопка "👍 Нравится" на странице `/profile/:id` (не владелец).
- `POST /api/profiles/{user_id}/like` — поставить лайк
- `DELETE /api/profiles/{user_id}/like` — убрать лайк
- `GET /api/profiles/{user_id}` — возвращать `like_count` и `is_liked_by_me`
- Показывать счётчик в sidebar профиля рядом с рейтингом

Модель данных (новая таблица `profile_likes`):
```
user_id: FK → users (кому ставят)
liker_id: FK → users (кто ставит)
created_at: datetime
PK: (user_id, liker_id)
```

**13. Toggle для Избранного и Лайков**

Сейчас: кнопка ♡ в FreelancerCard / Profile добавляет в избранное, но повторный клик не убирает.
Нужно: все операции лайк/избранное — истинный toggle:
- Если уже в избранном → DELETE /api/favorites/{id} → убрать, иконка становится пустой ♡
- Если ещё не в избранном → POST /api/favorites/ → добавить, иконка ♥
- То же для лайков профиля
- Состояние `isFavorited` читается при загрузке страницы (GET возвращает `is_favorited: bool`)

**14. Админка — UI пополнения баланса**

Сейчас: простой `<input type="number">` для суммы, нет поиска пользователя.
Нужно:
- Поиск пользователя по имени/email (debounced, `/api/admin/users?search=`)
- Карточка выбранного пользователя (аватар + имя + текущий баланс)
- Поле суммы с форматированием
- Кнопка "Пополнить" → POST /api/admin/wallet/topup
- Тост с подтверждением и обновлением отображаемого баланса

**15. Админка — Блокировка пользователей**

Сейчас: кнопка "Заблокировать" в таблице пользователей есть визуально, но не работает.
Нужно:
- PUT /api/admin/users/{id}/block и PUT /api/admin/users/{id}/unblock (или через `role`)
- Добавить поле `is_blocked: bool` в модель `User` + Alembic миграция
- В `get_current_user`: если `user.is_blocked` → 403 `{"detail": "Аккаунт заблокирован"}`
- В AdminPanel: кнопка переключается между "Заблокировать" / "Разблокировать" в зависимости от статуса
- Заблокированный пользователь видит страницу-заглушку при попытке войти

---

### 🟢 ПРИОРИТЕТ 3 — Улучшения UX

**10. Freelancers (/freelancers)**
- Убрать ProtectedRoute — гость должен видеть список
- Поиск по имени/навыку через `/api/search/freelancers?q=`
- Фильтры: категория, рейтинг 4+, ставка до $X, верифицированные

**11. Пагинация в ProjectsFeed**
- Первые 12 проектов, кнопка "Загрузить ещё"
- Или infinite scroll (IntersectionObserver)

**12. URL-синхронизация фильтров в ProjectsFeed**
- При смене фильтра → `setSearchParams({category, budget, type, ...})`
- При открытии страницы → читать параметры из URL
- Ссылку можно скопировать и открыть с теми же фильтрами

---

### 🔵 ПРИОРИТЕТ 4 — SEO и технические улучшения

**13. SEO мета-теги (useSEO хук)**

Создать `frontend/src/hooks/useSEO.js`:
```js
export function useSEO({ title, description, image }) {
  useEffect(() => {
    document.title = title ? `${title} | Workflow` : 'Workflow — Фриланс-платформа'
    setMeta('description', description || 'Найди лучших фрилансеров...')
    setMeta('og:title', title)
    setMeta('og:description', description)
    if (image) setMeta('og:image', image)
  }, [title, description, image])
}
```

Применить на ключевых страницах:
| Страница | title | description |
|----------|-------|-------------|
| Home | Workflow — Фриланс-платформа | Найди фрилансеров... |
| ProjectDetail | {project.title} | {project.description[:120]} |
| Profile | {user.full_name} — Фрилансер | {profile.bio[:120]} |
| ProjectsFeed | Проекты — Workflow | Тысячи проектов... |
| Freelancers | Таланты — Workflow | Лучшие фрилансеры... |

**14. Alembic — миграции при добавлении новых полей**

При каждом новом поле в models.py:
```bash
cd backend
alembic revision --autogenerate -m "описание изменения"
alembic upgrade head
```

Текущий статус миграций: `github_url` добавлен через ALTER TABLE вручную.
Нужно: убедиться что alembic head соответствует реальной схеме БД.
```bash
alembic current   # текущая ревизия
alembic check     # расхождения с моделями
```

**15. Async бэкенд (опционально, для перфоманса)**

Сейчас: все `views.py` используют синхронные операции с SQLAlchemy.
Можно переделать на `async def` + `AsyncSession` из SQLAlchemy 2.x.

Преимущество: FastAPI не блокирует event loop при запросах к БД.
Изменения:
- `database.py`: `AsyncEngine`, `AsyncSession`, `async_sessionmaker`
- Все `views.py`: `async def`, `await db.execute()`, `await db.scalar()`
- `get_db`: `async def get_db()` → `AsyncSession`

⚠️ Большая рефакторинг-задача — делать только если есть время. На презентации разницы не видно.

---

## ЛОГИКА СИСТЕМЫ (чтобы ничего не пропустить)

### Полный flow проекта
```
1. Клиент создаёт проект (status: open)
2. Фрилансеры подают заявки (bid: pending)
3. Клиент принимает заявку → bid: accepted, project: in_progress
   └→ Эскроу: freeze(budget) у клиента
   └→ Создаётся Contract
4. Фрилансер сдаёт работу → project: delivered
   └→ Уведомление клиенту
5а. Клиент принимает → project: completed
    └→ Эскроу: release → фрилансер получает budget × 0.99
    └→ Contract: complete
    └→ Клиент может оставить review
5б. Клиент просит доработку → project: in_progress (снова)
5в. Клиент открывает спор → project: disputed
    └→ Admin разбирает: release или refund
```

### Роли и доступ
| Действие | Гость | Фрилансер | Клиент | Админ |
|----------|-------|-----------|--------|-------|
| Смотреть проекты | ✅ | ✅ | ✅ | ✅ |
| Смотреть профили | ✅ | ✅ | ✅ | ✅ |
| Смотреть фрилансеров | ✅ | ✅ | ✅ | ✅ |
| Создать проект | ❌ | ❌ | ✅ | ✅ |
| Подать заявку | ❌ | ✅ | ❌ | ❌ |
| Открыть чат | ❌ | только assigned | ✅ (своих) | ✅ |
| Оставить отзыв | ❌ | ✅ (только клиентам) | ✅ (только фрилансерам) | ✅ |
| Открыть спор | ❌ | ❌ | ✅ (своих) | ✅ |
| AdminPanel | ❌ | ❌ | ❌ | ✅ |

### Чат — кто видит
WebSocket `/ws/chat/{project_id}` проверяет: `user_id == project.client_id OR user_id == project.assigned_freelancer_id`.
Остальные получают код 4001 (unauthorized). Поэтому кнопка "Чат" отображается только участникам.

### Эскроу
- Freeze: автоматически при принятии заявки
- Release: при acceptDelivery (клиент нажал "Принять")
- Dispute: клиент открыл спор → admin решает release или refund
- Refund: деньги возвращаются клиенту

---

## ПОРЯДОК ВЫПОЛНЕНИЯ (обновлён)

```
ПРИОРИТЕТ 1 — Редизайн страниц (✅ Profile, ProjectDetail, AIAssistant, Wallet сделаны):
  — всё из этого блока выполнено

ПРИОРИТЕТ 2 — Пропущенные фичи:
  1. AI Rank ТОП-3 в ProjectDetail (#10)
  2. История доработок — таблица + счётчик (#11)
  3. Лайки профиля (#12)
  4. Toggle Избранное + Лайки (#13)
  5. Админка — UI пополнения баланса (#14)
  6. Админка — блокировка пользователей (#15)
  7. Client Profile страница (#6)
  8. Report кнопка — FreelancerCard + ProjectDetail (#8)
  9. Certifications CRUD в профиле (#5)
  10. Dispute кнопка для пользователей (#7)
  11. Contracts секция в ProjectDetail (#9)

ПРИОРИТЕТ 3 — UX улучшения:
  12. Freelancers (убрать ProtectedRoute + поиск + фильтры)
  13. Пагинация в ProjectsFeed
  14. URL-синхронизация фильтров

ПРИОРИТЕТ 4 — Техническое:
  15. useSEO хук + применить на 5 страницах
  16. Alembic check (проверить что миграции в порядке)
  17. Async бэкенд (если есть время)

ФИНАЛ:
  18. git pull + npm run build на сервере
  19. Проверить все сценарии: гость / фрилансер / клиент / admin
  20. OpenDay презентация ✅
```

---

## ФАЙЛЫ ДЛЯ СОЗДАНИЯ / ЗАМЕНЫ

```
Создать новые:
  frontend/src/hooks/useSEO.js              (SEO мета-теги)
  frontend/src/pages/ClientProfile.jsx      (профиль заказчика)

Переписать:
  frontend/src/pages/Profile.jsx            (sidebar слева + вкладки + лайки)
  frontend/src/pages/ProjectDetail.jsx      (вкладки + спор + контракт + история доработок)
  frontend/src/pages/AIAssistant.jsx        (sidebar + split)   ✅ СДЕЛАНО
  frontend/src/pages/Wallet.jsx             (большой баланс + фильтр)   ✅ СДЕЛАНО
  frontend/src/pages/Freelancers.jsx        (публичный + поиск)
  frontend/src/pages/ProjectsFeed.jsx       (пагинация + URL sync)
  frontend/src/pages/AdminPanel.jsx         (UI пополнения + блокировка)

Новые backend:
  backend/projects/models.py         → таблица project_revisions
  backend/users/models.py            → поле is_blocked
  backend/profiles/models.py        → таблица profile_likes
  backend/routers/project_routers.py → /revisions endpoints
  backend/routers/profile_routers.py → /like endpoints
  backend/routers/admin_routers.py   → /block /unblock endpoints
  alembic/                           → миграции для всех новых полей/таблиц
```

---

## ЧТО НЕ ДЕЛАЕМ (отложено)

- Реальные платежи
- Connects механика
- Milestones / частичный refund
- Мобильная адаптация (desktop-first)
- Push уведомления браузера
- Async бэкенд (если не хватит времени)

---

## Технический стек (справка)

- **Backend:** FastAPI, PostgreSQL:5433, SQLAlchemy 2.x, Alembic, Redis, Groq (llama-3.3-70b)
- **Frontend:** React 18, Vite, Zustand, Axios, Three.js, CSS inline styles
- **Дизайн:** `--bg: #07070E` `--accent: #7F77DD`, Syne + DM Sans, Tabler Icons v2.44.0
- **Запуск:** `docker-compose up -d` → `uvicorn main:app --reload` → `npm run dev`
- **Сервер:** `students@ubuntu-4gb-hel1-1`, порт 8005, nginx → `~/azizsaidov/Workflow`

---

*Workflow TZ v6.1 | 2026-06-03 | AzizSaidov*
