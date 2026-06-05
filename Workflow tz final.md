# Workflow — ТЗ
### Версия 7.2 | Обновлено 2026-06-05

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
| MyWork | MyWork.jsx | ✅ Готово | Стат-карточки, дедлайн-цвета, прогресс-бар |
| ProjectCard | ProjectCard.jsx | ✅ Готово | Иерархия бюджета, статус, hover |
| FreelancerCard | FreelancerCard.jsx | ✅ Готово | Аватар, рейтинг, навыки, ставка |
| ProjectsFeed | ProjectsFeed.jsx | ✅ Готово | Сайдбар фильтров, пагинация 12шт, URL sync |
| Freelancers | Freelancers.jsx | ✅ Готово | Публичная, звёздочки, ProtectedRoute убран |
| Profile | Profile.jsx | ✅ Готово | Sidebar 280px, 3 вкладки, сертификаты с файлом, GitHub кнопка |
| ProjectDetail | ProjectDetail.jsx | ✅ Готово | Вкладки Заявки/Чат/Файлы, AI Rank TOP-3, StatusTimeline |
| AIAssistant | AIAssistant.jsx | ✅ Готово | Sidebar 268px + split layout, empty state |
| NotificationBell | NotificationBell.jsx | ⏳ Нужен редизайн | Grouped by date, иконки по типу, skeleton |
| Wallet | Wallet.jsx | ✅ Готово | Баланс 56px, stats row, группировка по дате, фильтр-табы |
| ClientProfile | ClientProfile.jsx | ✅ Готово | Профиль заказчика: sidebar + проекты + отзывы + флаг |
| Achievements | Achievements.jsx | ✅ Готово | Сетка достижений, прогресс, фильтры по категориям |

---

## 🔜 ОЧЕРЕДЬ ЗАДАЧ (делаем по одной, по шагам)

> Добавлено 2026-06-05. Выполнять строго по одной задаче за раз — после каждой остановка и подтверждение.

**Z1. Объединить «Категория» и «Специализация» в профиле фрилансера** ⏳ Согласовано, ждёт выполнения

Сейчас: в профиле два механизма для одной и той же таблицы `categories` —
- одиночная `FreelancerProfile.category_id` (выпадающий список «Категория» в форме; **нигде не отображается**, заполняется только в seed);
- M2M `ProfileCategory` (теги «Специализация»; видны в сайдбаре профиля и на карточках `/freelancers`).

Это дублирование. Плюс seed заполняет только одиночную `category_id`, поэтому у сид-фрилансеров теги «Специализация» пустые. Поиск на `/freelancers` фильтрует по обоим (`category_id` OR M2M).

Нужно (**вариант A — согласован**): оставить только «Специализацию» = M2M (мультивыбор), одиночную `category_id` убрать полностью.
- Backend:
  - `profiles/models.py` — убрать колонку `category_id` из `FreelancerProfile` (таблицу `ProfileCategory` оставить).
  - `profiles/schemas.py` — убрать `category_id` из `ProfileUpdate`; убрать `category_id` и `category_name` из `ProfileResponse`.
  - `profiles/views.py` — почистить `_build_profile_response`; в `get_top_freelancers` и `get_all_freelancer_profiles` упростить фильтр до M2M-only (`id IN m2m`).
  - `seed.py` — вместо `category_id=...` у профиля добавлять `ProfileCategory(profile_id, category_id)` из `fd["cat"]` (чтобы у сид-фрилансеров появились теги и фильтр работал).
  - Alembic-миграция на дроп колонки `category_id` (или `python seed.py --force` пересоздаёт схему).
- Frontend:
  - `Profile.jsx` — убрать выпадающий список «Категория» (+ `editForm.category_id`, + из вызова `updateMe`). Блок «Специализация» (теги) оставить.
  - `Freelancers.jsx` — без изменений (уже использует M2M и для показа, и для фильтра).
- Проверено: одиночную `category_id`/`category_name` больше нигде не читают (stats считают по `Project.category` — это другое).

**Z2. Профили заказчиков сломаны — часть контента не отображается** ⏳ Баг, ждёт диагностики

Сейчас: на профиле заказчика «половина не видна» — часть блоков не рендерится. Затрагивает `ClientProfile.jsx` (`/client/:id`) и/или клиентский вид `Profile.jsx` (`/profile/:id`).
Нужно: продиагностировать и починить рендер, чтобы отображался весь контент (сайдбар: аватар / инфо / компания / описание; основное: проекты + отзывы). Убедиться что слои фона (StarBackground/glow) не перекрывают контент и нет «обрезанной» половины.

**Z3. Достижения «как в Steam» — не приходят на экран** ⏳ Баг/фича, ждёт выполнения

Сейчас: при получении ачивки всплывающий тост не «въезжает» на экран как просили. Компонент `AchievementToast` есть, но не срабатывает / не виден.
Нужно: чтобы заработанная ачивка показывалась тостом, который **въезжает на экран (Steam-style slide-in)**. Проверить всю цепочку: выдача ачивки (`check_and_grant` → `_grant`) → `Notification` с `type=achievement` → WS `/ws/notifications` (после `init_done`) → `NotificationBell` → `AchievementToast` (анимация появления). Найти где рвётся и починить.

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
- [x] AI improve/shorten/translate — отдельный эндпоинт `/ai/edit-text`, не использует chat-промпт платформы
- [x] AI сдача работы — `mode: 'deliver'`, эндпоинт `/ai/help-deliver`
- [x] Отзывы — `reviewer_name` и `reviewer_avatar_url` в ответе бэкенда (JOIN с User)
- [x] Отзывы — эндпоинт `GET /api/reviews/my/{project_id}`, форма не показывается после refresh если уже оставлен
- [x] Отзывы в профиле — 5 иконок звёзд (filled/empty) вместо цифры
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
- [x] ReportModal — переиспользуемый компонент жалоб (reason dropdown + описание)
- [x] Кнопка "Пожаловаться" — FreelancerCard, Profile, ProjectDetail (флаг-иконка, e.stopPropagation)
- [x] useSEO хук — `frontend/src/hooks/useSEO.js` (title, description, og:title, og:description)
- [x] SEO применён на: Home, ProjectsFeed, Freelancers, Profile, ProjectDetail
- [x] ClientProfile — страница `/client/:id`, публичная, sidebar + вкладки Проекты/Отзывы
- [x] История доработок — таблица `project_revisions`, счётчик "Доработок: N", раскрываемый список
- [x] Категории фрилансера — M2M таблица `profile_categories`, редактор в Profile, фильтр на /freelancers
- [x] Celery deadline-задача — `check_deadlines()` ежедневно в 09:00 Душанбе
- [x] Alembic — настроен `env.py`, миграция `045713092286` (profile_categories + project_revisions)
- [x] Lifespan FastAPI — подавляет WindowsError при CTRL+C в uvicorn

### Редизайн
- [x] Home — персонализация CTA по роли, глобус, категории, skills marquee
- [x] Login / Register — AuthLeft с живым глобусом слева
- [x] RoleSelect — два fullscreen-панели с анимацией, тема день/ночь
- [x] ProjectCard — бюджет иерархия, теги, hover
- [x] FreelancerCard — аватар, рейтинг, навыки, ставка
- [x] DashboardClient — getMine(), секция "Требует внимания", "Новые заявки"
- [x] DashboardFreelancer — AI баннер, "Мои работы", pending hints
- [x] Все цифры → Syne через unicode-range @font-face (index.css)
- [x] MyWork — стат-карточки (В работе / На проверке / Завершено / Заработано), дедлайн-цвета, прогресс-бар
- [x] ProjectsFeed — сайдбар 240px с фильтрами, пагинация 12шт, URL sync, FilterChip
- [x] Freelancers — публичная страница (ProtectedRoute убран), звёздочки для клиентов
- [x] Profile — sidebar 280px, вкладки О себе/Портфолио/Отзывы, сертификаты с файлом, GitHub-кнопка с анимацией
- [x] ProjectDetail — вкладки Заявки/Чат/Файлы, AI Rank TOP-3 с медалями, StatusTimeline
- [x] Wallet — баланс 56px, stats row (получено/потрачено/транзакций), группировка по дате, фильтр-табы

### Достижения
- [x] Страница /achievements — сетка всех достижений, фильтры Все/Фрилансер/Заказчик/Общие
- [x] Прогресс-бар и счётчики очков для авторизованных
- [x] Автовыдача достижений: при подаче заявки, отзыве, завершении проекта
- [x] Уведомление в колоколе при получении достижения (тип achievement)
- [x] Steam-like попап (AchievementToast) внизу-справа с прогресс-баром 5 сек

### Избранное
- [x] Роле-зависимые вкладки: фрилансер видит "Заказчики"+"Проекты", клиент — "Фрилансеры"+"Проекты"
- [x] Звёздочки вместо сердечек везде (FreelancerCard, Profile, ProjectDetail, ProjectsFeed)
- [x] Toggle: повторный клик убирает из избранного с текстом "Убрать" при hover
- [x] Кнопка добавления в избранное в ProjectDetail

### AdminPanel
- [x] Редизайн: sidebar-навигация, карточки юзеров с expand
- [x] Кошельки: поиск с дебаунсом + карточка выбранного юзера
- [x] Блокировка: работает на бэкенде + фронте, заблокированный не может войти, при попытке — редирект `/login?blocked=1`
- [x] Фильтр заблокированных в разделе Пользователи (кнопка-тоггл со счётчиком)
- [x] `is_admin` флаг — отдельный boolean, независимый от роли (client/freelancer)
  - Юзер может быть "Заказчик + Администратор" одновременно
  - Назначить/снять администратора — одна кнопка, роль (client/freelancer) не меняется
  - Нельзя менять client↔freelancer через AdminPanel
  - Нельзя заблокировать администратора
- [x] Navbar, ProtectedRoute, Seed обновлены под `is_admin`

> ⚠️ **Требует SQL миграции** (выполнить один раз в psql):
> ```sql
> ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
> UPDATE users SET is_admin = TRUE WHERE role = 'admin';
> UPDATE users SET role = 'client' WHERE role = 'admin';
> ```
> После этого запустить `seed.py --force` ИЛИ просто перезапустить бэкенд.

---

## ОСТАВШИЕСЯ ЗАДАЧИ

### 🔴 ПРИОРИТЕТ 1 — Редизайн страниц

~~**1. Profile**~~ ✅ Сделано
~~**2. ProjectDetail**~~ ✅ Сделано
~~**4. Wallet**~~ ✅ Сделано

**3. AIAssistant (/ai)**

Вертикальный sidebar слева (1/4) + контент (3/4):
- [🤖 Чат] [✍ Проект] [📝 Заявка]
- Формы "Проект" и "Заявка": split — форма слева, результат справа

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

**6. Client Profile — профиль заказчика** ✅ Сделано

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

**8. Кнопка "Пожаловаться" (Report)** ✅ Сделано

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

**10. AI Rank — реальный анализ профилей + ТОП-3**

Сейчас: кнопка "✨ AI Rank" сортирует заявки на основе текста самих заявок — AI не видит реальные данные фрилансера.

Нужно:
- Перед отправкой в Groq API — подгрузить по каждому фрилансеру: рейтинг, количество завершённых проектов, навыки (skills), ставку (hourly_rate), количество отзывов
- Передать эти данные в промпт как контекст: `"Фрилансер X: рейтинг 4.9, 12 завершённых проектов, навыки: React/Python, ставка $45/hr"`
- AI ранжирует на основе реальных данных профиля + текста заявки + требований проекта
- После нажатия показывать только **ТОП-3** кандидата, остальные скрыты за "Показать всех (N)" collapsed
- Фрилансеры видят только свою заявку (без изменений)

Backend: эндпоинт `POST /api/ai/rank-bids` принимает `project_id`, подгружает заявки + профили, формирует промпт, возвращает отсортированный список с кратким объяснением для каждого.

Смысл: заказчик видит объективный рейтинг на основе реального опыта фрилансера, а не просто красивых слов в заявке.

**11. История доработок (Revision History)** ✅ Сделано

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

**18. Категории в профиле фрилансера** ✅ Сделано

Сейчас: у фрилансера нет поля "категории". На /freelancers нет фильтра по специализации.
Нужно:
- В профиле фрилансера (вкладка "О себе", редактирование): multi-select категорий из справочника `/api/categories/`
- Хранить в `FreelancerProfile.categories` (M2M или JSON array, смотреть как реализован skills)
- На странице `/freelancers`: добавить фильтр по категории (дропдаун или chips)
- На `/projects` для авторизованного фрилансера: кнопка "По моим категориям" — быстрый фильтр, показывает проекты в категориях из его профиля

Backend: если M2M — новая таблица `freelancer_profile_categories`; если JSON — добавить поле `category_ids: list[UUID]` в `FreelancerProfile`.
Предпочтительно M2M (как skills) — `/api/profiles/me` уже возвращает skills[], добавить categories[] туда же.

**19. Редизайн уведомлений (NotificationBell)**

Сейчас: простой dropdown со списком строк, все одинаковые визуально.
Нужно:
- Иконка по типу уведомления:
  - `payment_received` → `ti-wallet` зелёный
  - `bid_accepted` → `ti-check` акцентный
  - `bid_rejected` → `ti-x` красный
  - `new_bid` → `ti-send` акцентный
  - `project_completed` → `ti-trophy` золотой
  - `project_disputed` → `ti-alert-triangle` оранжевый
  - `achievement` → `ti-award` фиолетовый
  - остальное → `ti-bell` серый
- Группировка по дате: "Сегодня" / "Вчера" / "Ранее"
- Непрочитанные — белый фон, прочитанные — приглушённее
- Skeleton-лоадер пока грузится
- Кнопка "Отметить все прочитанными" в хедере дропдауна
- Пустое состояние с иллюстрацией: большая иконка `ti-bell-off` + текст

**13. Toggle для Избранного и Лайков**

Сейчас: кнопка ♡ в FreelancerCard / Profile добавляет в избранное, но повторный клик не убирает.
Нужно: все операции лайк/избранное — истинный toggle:
- Если уже в избранном → DELETE /api/favorites/{id} → убрать, иконка становится пустой ♡
- Если ещё не в избранном → POST /api/favorites/ → добавить, иконка ♥
- То же для лайков профиля
- Состояние `isFavorited` читается при загрузке страницы (GET возвращает `is_favorited: bool`)

**14. Админка — UI пополнения баланса** ✅ Сделано
- Поиск пользователя debounced, карточка выбранного, $-поле, тост с подтверждением

**15. Админка — Блокировка пользователей** ✅ Сделано
- `is_banned` в модели User уже есть; ban/unban эндпоинты готовы
- `get_current_user` возвращает 403 "Аккаунт заблокирован" для забаненных
- Логин тоже блокируется (403 при попытке войти)
- Клиент axios перехватывает 403 → разлогин → `/login?blocked=1`
- На Login.jsx банер с объяснением при `?blocked=1`
- AdminPanel редизайн: sidebar-навигация, карточки юзеров с expand, поиск+фильтр по роли

**16. Почасовая оплата — ДЕКОРАТИВНО, без логики**

`project_type = "hourly"` — только визуальный тег на карточке и в ProjectDetail.
Никакой бизнес-логики нет и не планируется в рамках MVP:
- Эскроу работает так же как fixed (замораживает budget_max целиком)
- Часы не считаются, `hourly_rate` и `hours_worked` полей нет
- Итоговая сумма = фиксированный бюджет как всегда

Это осознанное решение — для демо/портфолио достаточно визуального различия типов.

**17. Дедлайн — реальная логика** ✅ Сделано

Сейчас: `deadline: Date` — только отображается на карточке, никакой реакции системы нет.
Нужно:
- Уведомление фрилансеру за 3 дня до дедлайна
- Уведомление за 1 день до дедлайна
- Визуальный индикатор в ProjectDetail: зелёный / жёлтый (3 дня) / красный (просрочен)
- При просрочке: автоматически менять статус на `overdue` или уведомлять клиента

Backend: Celery-задача `check_deadlines` на расписании (каждые 24ч):
```python
@celery_app.task
def check_deadlines():
    # найти проекты где deadline <= now+3 дня и status == in_progress
    # отправить уведомления
```

---

### 🟢 ПРИОРИТЕТ 3 — Улучшения UX

**10. Freelancers (/freelancers)**
- ~~Убрать ProtectedRoute~~ ✅ Сделано
- Поиск по имени/навыку через `/api/search/freelancers?q=` ⏳
- Фильтры: рейтинг 4+, ставка до $X, верифицированные, категория ⏳

**20. Убрать поиск (лупу) из Navbar**

Иконка лупы в правой части Navbar — лишняя, не добавляет ценности.
Удалить: `<form onSubmit={handleSearch}>` блок целиком из `Navbar.jsx`, а также связанные `useState` (`searchOpen`, `searchVal`) и `useRef` (`searchRef`).
Навигация по проектам остаётся через ссылку "Найти работу" / "Проекты".

**11. Пагинация в ProjectsFeed** ✅ Сделано

**12. URL-синхронизация фильтров в ProjectsFeed** ✅ Сделано

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
ПРИОРИТЕТ 1 — Редизайн страниц:
  ✅ Home, Login, Register, RoleSelect, DashboardClient, DashboardFreelancer
  ✅ MyWork, ProjectsFeed, Freelancers, ProjectCard, FreelancerCard
  ✅ Profile, ProjectDetail, AIAssistant, Wallet
  ⏳ NotificationBell, ClientProfile (новая)

ПРИОРИТЕТ 2 — Пропущенные фичи:
  ✅ Client Profile страница (#6)
  ✅ Report кнопка — FreelancerCard + ProjectDetail (#8)
  ✅ История доработок — таблица + счётчик (#11)
  ✅ Дедлайн — реальная логика + Celery (#17)
  ✅ Категории в профиле фрилансера (#18)
  1. AI Rank ТОП-3 в ProjectDetail (#10)
  2. Лайки профиля (#12)
  3. Toggle Избранное + Лайки (#13)
  4. Certifications CRUD в профиле (#5)
  5. Dispute кнопка для пользователей (#7)
  6. Contracts секция в ProjectDetail (#9)

ПРИОРИТЕТ 3 — UX улучшения:
  12. Freelancers (поиск + фильтры включая категорию)
  13. ~~Пагинация в ProjectsFeed~~ ✅
  14. ~~URL-синхронизация фильтров~~ ✅
  15. Убрать лупу из Navbar (#20)

ПРИОРИТЕТ 4 — Техническое:
  ✅ useSEO хук + применён на 5 страницах
  ✅ Alembic — настроен, миграции применены
  ✅ Lifespan FastAPI (Windows CTRL+C fix)
  → celery в requirements.txt (A1)
  → favicon + og:image (A2, A3)
  → 404 страница (A4)
  → Защита от двойного сабмита (A5)
  → Ачивки на все события (A7)
  → Nginx конфиг для сервера
  → Async бэкенд (если есть время)

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

## АУДИТ — ЧЕКЛИСТ ПЕРЕД ПРЕЗЕНТАЦИЕЙ / ДЕПЛОЕМ (2026-06-04)

> Результат полной проверки кодовой базы. Ничего не сломано — это список того, что надо закрыть.

---

### 🔴 Критические (сломается при деплое на сервер)

**A1. `celery` отсутствует в `requirements.txt`** — ✅ СДЕЛАНО (2026-06-05)

> ✅ `celery[redis]` добавлен в `backend/requirements.txt`. На сервере выполнить `pip install -r requirements.txt`.

Файлы `tasks/celery_app.py` и `tasks/notification_tasks.py` существуют и работают локально,
но `pip install -r requirements.txt` на сервере не установит celery.

Исправление:
```
# backend/requirements.txt — добавить:
celery[redis]
```

**A2. `og:image` не задан нигде** — ✅ СДЕЛАНО (2026-06-05)

> ✅ В `index.html` добавлены og/twitter-теги; создан исходник `frontend/public/og-image.svg` (1200×630).
> ⚠️ Осталось разово экспортнуть `og-image.svg` → `og-image.png` — Telegram/FB/WhatsApp не показывают SVG-превью.

`useSEO` выставляет `og:title` / `og:description`, но не `og:image`.
В `index.html` нет дефолтного `og:image`. При шаринге в мессенджерах превью без картинки.

Исправление: в `frontend/public/` добавить `og-image.jpg` (1200×630) и прописать в `index.html`:
```html
<meta property="og:image" content="/og-image.jpg" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://test.softclub.tj" />
```

---

### 🟡 Важные (плохо выглядят на презентации)

**A3. Нет favicon** — ✅ СДЕЛАНО (2026-06-05)

> ✅ Создан `frontend/public/favicon.svg` (фирменная «W») и подключён в `index.html`.

`index.html` не содержит `<link rel="icon">`. Браузер показывает пустую вкладку.

Исправление: добавить `frontend/public/favicon.ico` (или SVG) и в `index.html`:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

**A4. Нет страницы 404** — ✅ СДЕЛАНО (2026-06-05)

> ✅ Создана `frontend/src/pages/NotFound.jsx` (космическая тема: «4 🪐 4», планета с кольцом,
> кнопки «Назад» / «На главную», быстрые ссылки). В `App.jsx` `path="*"` теперь → `<NotFound />`
> (убран редирект и неиспользуемый импорт `Navigate`).

`path="*"` в App.jsx редиректит на `/`. Если судья вводит несуществующий URL — просто Home без объяснений.

Исправление: создать простую страницу `NotFound.jsx` и добавить в App.jsx:
```jsx
<Route path="*" element={<NotFound />} />
```
Содержимое: большая цифра "404", текст "Страница не найдена", кнопка "На главную".

**A5. Двойной сабмит на логине и регистрации** — ✅ СДЕЛАНО (2026-06-05)

> ✅ В `Login.jsx` и `Register.jsx` добавлен guard `if (loading) return` в начало `handleSubmit`.
> Кнопка `Button` и так блокируется при `loading` (`disabled={disabled || loading}`),
> а guard закрывает гонку (быстрый двойной клик / Enter до ре-рендера).

Кнопка не блокируется во время запроса. Быстрый двойной клик отправляет 2 одинаковых запроса.

Исправление: добавить `const [submitting, setSubmitting] = useState(false)` и
`disabled={submitting}` на кнопку в `Login.jsx` и `Register.jsx`.

**A6. Мобильная вёрстка не адаптирована**

Гриды используют `repeat(3, 1fr)` с фиксированными `maxWidth`. На телефоне
карточки DashboardClient, ProjectsFeed и Freelancers обрезаются или сжимаются до нечитаемого вида.

Примечание: в "ЧТО НЕ ДЕЛАЕМ" было прописано "Мобильная адаптация (desktop-first)" — значит это осознанное
решение. Закрывать только если решили изменить политику.

---

### 🟢 Минорное (не блокирует, но стоит отметить)

**A7. Ачивки проверяются только при создании проекта** — ✅ ПРОВЕРЕНО, УЖЕ ЗАКРЫТО (2026-06-05)

> ✅ Пункт устарел: `check_and_grant()` вызывается во всех нужных точках — создание заявки
> (`bids/views.py`), приём заявки (`project_routers.py`), релиз эскроу / приёмка работы
> (`escrow/views.py`), создание отзыва (`reviews/views.py`) + профиль, портфолио, сертификаты, верификация.
> ✅ Выдаётся корректно: у `UserAchievement` есть `UniqueConstraint(user_id, achievement_id)` —
> дублей нет; основное действие коммитится ДО `check_and_grant`, поэтому откат дубль-гранта
> не роняет действие; дублей уведомлений тоже нет.

`check_and_grant()` вызывается только в `create_project()` (`projects/views.py:71`).
Большинство ачивок (первая заявка, первый completed, первый отзыв) никогда не выдаются.

Исправление: добавить вызов `check_and_grant(user, db)` в:
- `accept_bid()` — для клиента (принял заявку) и фрилансера (заявку приняли)
- `accept_delivery()` — для клиента (завершил проект) и фрилансера (проект closed)
- `create_review()` — для пользователя оставившего отзыв

**A8. Email-уведомления — заглушка**

`send_email_notification()` в `tasks/notification_tasks.py` делает только `print(...)`.
Для продакшена нужно заменить на реальный SMTP или SendGrid.
На демо некритично, но при просмотре кода выглядит незаконченным.

**A9. Нет `robots.txt`**

Для SEO на продакшене нужен. Достаточно добавить `frontend/public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://test.softclub.tj/sitemap.xml
```

**A10. Forgot password отсутствует**

Известный gap (отложен в ТЗ). Минимальное решение для демо: на Login.jsx добавить текст
"Забыли пароль? Обратитесь к администратору: admin@workflow.com".

---

### Nginx-конфиг для сервера (нужен при деплое)

Для production на `test.softclub.tj` нужен nginx-конфиг с:
- `location /api/` → proxy к gunicorn на `localhost:8000`
- `location /ws/` → proxy с `upgrade websocket`
- `location /` → serve собранного фронтенда из `frontend/dist/`

Без этого конфига сервер не будет принимать запросы правильно.

Шаблон-конфиг:
```nginx
server {
    listen 80;
    server_name test.softclub.tj;

    root /home/students/azizsaidov/Workflow/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### Итоговый статус

| | Для презентации | Для продакшена |
|---|---|---|
| Backend API | ✅ Готов | ✅ Готов |
| Frontend | ✅ Готов | ✅ Готов |
| WS URLs | ✅ VITE_API_URL | ✅ VITE_API_URL |
| Celery в requirements | ✅ Добавлен | ✅ Добавлен |
| Favicon | ✅ Есть (SVG) | ✅ Есть (SVG) |
| og:image | ✅ Разметка + SVG | ⚠️ Экспортнуть PNG |
| 404 страница | ✅ NotFound.jsx | ✅ NotFound.jsx |
| Nginx конфиг | — | ❌ **Написать** |
| Email (SMTP) | ⚠️ Заглушка | ❌ **Подключить** |
| Мобилка | ⚠️ Desktop-only | ⚠️ Договорились не делать |

---

## ПОВТОРНАЯ ПРОВЕРКА (2026-06-05) — НАЙДЕННЫЕ БАГИ

> Повторный проход по коду после редизайна страниц и зимнего режима.
> В отличие от аудита A1–A10 (там «чего не хватает»), здесь — **реальные баги в текущем коде**.
> B1–B6 — ✅ ВСЕ ИСПРАВЛЕНЫ 2026-06-05.

---

### 🔴 Критические (страница падает в белый экран)

**B1. `Profile.jsx` — крах профиля, обращение к `profile` до объявления (TDZ)** — ✅ ИСПРАВЛЕНО (2026-06-05)

`Profile.jsx:180-184` — `useSEO(...)` вызывается ВЫШЕ объявления стейта `profile`:
```jsx
const [userData, setUserData] = useState(null)
useSEO({
  title: userData?.full_name ? `${userData.full_name} — Фрилансер` : 'Профиль',
  description: profile?.bio ? profile.bio.slice(0, 120) : undefined,   // ← profile ещё не объявлен
})
const [profile, setProfile] = useState(null)                          // ← объявляется ТУТ
```
`profile` — это `const` в temporal dead zone, обращение к нему до строки объявления →
`ReferenceError: Cannot access 'profile' before initialization` на КАЖДОМ рендере.
ErrorBoundary в проекте нет → падает всё приложение (белый экран) при заходе в любой профиль
(и фрилансера, и заказчика).

Исправление: перенести вызов `useSEO(...)` ниже всех `useState` (после объявления `profile`).

✅ Сделано: `useSEO` перенесён под `const [profile, setProfile] = useState(null)`.
Заодно исправлен источник описания — `userData?.bio` вместо `profile?.bio`
(в `ProfileResponse` поля `bio` нет, оно лежит на user → раньше описание всё равно было бы пустым).

**B2. `Profile.jsx` — `user is not defined` в ReportModal** — ✅ ИСПРАВЛЕНО (2026-06-05)

`Profile.jsx:1057`:
```jsx
<ReportModal ... targetName={user?.full_name || ''} />
```
В компоненте auth-пользователь деструктурирован как `me` (`const { user: me } = useAuthStore()`, стр. 175).
Переменной `user` в области видимости НЕТ → `ReferenceError: user is not defined`.
Плюс это семантически неверно: `targetName` должно быть именем владельца профиля, на которого жалуются,
т.е. `userData?.full_name`, а не текущего пользователя.

Исправление: `targetName={userData?.full_name || ''}`.
(Был замаскирован багом B1, который падал раньше.)

✅ Сделано: заменено на `targetName={userData?.full_name || ''}` в `Profile.jsx`.

---

### 🟡 Важные (фича молча не работает)

**B3. `is_online` не доходит до фронтенда — индикатор онлайна всегда выключен** — ✅ ИСПРАВЛЕНО (2026-06-05)

`profiles/views.py:70` — `_build_profile_response` вычисляет `is_online` из Redis
(`_redis.exists(f"online:{user_id}")`), причём в `/profiles/top` это N запросов в Redis на список.
Но схема `ProfileResponse` (`profiles/schemas.py:44-62`), которая стоит в `response_model` всех
profile-роутов, поля `is_online` НЕ содержит → Pydantic его выбрасывает при сериализации.

Итог: `Freelancers.jsx:30` (`online={profile?.is_online ?? false}`) и профиль всегда показывают офлайн,
а Redis дёргается впустую на каждый профиль в списке.

Исправление: добавить `is_online: bool = False` в `ProfileResponse`.

✅ Сделано: поле `is_online: bool = False` добавлено в `ProfileResponse` (`profiles/schemas.py`).
`_build_profile_response` его уже возвращал — теперь оно доходит до фронта,
зелёный индикатор онлайна на `/freelancers` и в профиле работает.

---

### 🟢 Минорное (визуал / мелочи)

**B4. Снежинка в Navbar улетает вниз через весь экран** — ✅ ИСПРАВЛЕНО (2026-06-05)

`Navbar.jsx:96-103` — бейдж ❄ рядом с лого использует `animation: 'snowfall 4s ... infinite'`,
а кейфрейм `snowfall` (`Snowflakes.jsx:17-23`) задаёт `transform: translateY(105vh)`.
В результате снежинка каждые 4 секунды «падает» от лого вниз на всю высоту экрана,
а не мягко покачивается на месте.

Исправление: завести отдельный лёгкий кейфрейм (плавное вращение/качание на месте)
для бейджа в навбаре, либо убрать у него анимацию.

✅ Сделано: добавлен локальный кейфрейм `navFlake` (лёгкое покачивание + поворот на месте),
❄ рядом с лого больше не падает вниз.

**B5. Пустой тултип у снежных точек глобуса** — ✅ ИСПРАВЛЕНО (2026-06-05)

`Globe.jsx:221` — `pointLabel` для `role === 'snow'` возвращает пустую строку `''`.
react-globe.gl при наведении на снежную точку всё равно может отрисовать пустой контейнер тултипа.
Проверить; при необходимости отдавать `false`/`undefined` или не включать снег в hover-слой.

✅ Сделано: `pointLabel` для снега возвращает `false` вместо `''` — пустой тултип не появляется.

**B6. `Favorites.jsx` — счётчик отзывов всегда пустой** — ✅ ИСПРАВЛЕНО (2026-06-05)

`Favorites.jsx:220` — `<Rating ... count={profile.reviews_count} />`, но в `ProfileResponse`
поля `reviews_count` нет (есть `total_jobs`). Счётчик у звёзд в избранном всегда пустой.

✅ Сделано: убран мёртвый проп `count={profile.reviews_count}` из `Favorites.jsx`.
По факту был безвреден — `Rating` и так скрывает счётчик при `count === undefined`,
но проп ссылался на несуществующее поле.

---

## ПОВТОРНАЯ ПРОВЕРКА #2 (2026-06-05) — ЭСКРОУ / СТАТУСЫ / РЕЙТИНГ

> Второй проход: денежный поток, статусы проекта, рейтинг, axios-интерсептор, ProtectedRoute.
> B1–B6 выше уже закрыты. Здесь — что нашёл дополнительно.

### 🟡 Медиум

**C1. `total_jobs` перезаписывается — два конфликтующих писателя** — ✅ ИСПРАВЛЕНО (2026-06-05)

> ✅ Убрал `profile.total_jobs = count` из `create_review` — отзыв обновляет только `rating`.
> `total_jobs` теперь принадлежит только `accept_delivery` (счётчик завершённых проектов).

`projects/views.py:137` (`accept_delivery`) делает `fp.total_jobs = (fp.total_jobs or 0) + 1`
(счётчик завершённых проектов), а `reviews/views.py:59` (`create_review`) делает
`profile.total_jobs = count`, где `count` — число полученных **отзывов**.

Итог: после первого же отзыва «работ» у фрилансера превращается в число отзывов.
Пример: 5 завершённых проектов → `total_jobs=5`; пришёл 1 отзыв → `total_jobs=1` (просело).
Также искажает ранжирование в `get_top_freelancers` (`rating * ln(total_jobs+2)`).

Фикс: `create_review` не должен трогать `total_jobs` — пусть обновляет только `rating`.
Счётчик завершённых проектов оставить за `accept_delivery`; для числа отзывов завести
отдельное поле или считать на лету (`COUNT(reviews)`).

### 🟢 Минорное

**C2. Два пути релиза эскроу с разными сайд-эффектами** — ✅ ИСПРАВЛЕНО (2026-06-05)

> ✅ Добавил `total_jobs++` в `escrow.release` — теперь оба пути релиза дают одинаковые сайд-эффекты.

`/projects/{id}/accept-delivery` (его зовёт фронт) = выплата + `total_jobs++` + ачивки.
`/escrow/{tx_id}/release` (фронт НЕ зовёт) = выплата + ачивки, но БЕЗ `total_jobs++`.
Двойной выплаты нет (защита по статусу транзакции), но если дёрнуть `release` напрямую —
статистика фрилансера разъедется. Убрать неиспользуемый путь или объединить логику.

**C3. Два пути «сдать работу»** — ✅ НЕ БАГ / BY-DESIGN (2026-06-05)

> Проверил `media.upload_delivery`: гардит `in_progress` + только назначенный фрилансер, ставит
> `delivered` и шлёт то же уведомление — полностью согласован с `deliver_project`. Это осознанная
> вторая точка (сдача файлом, описана в CLAUDE.md), фронт её сейчас не зовёт. Менять код не нужно.

`PUT /projects/{id}/deliver` (текст/ссылки, это и зовёт фронт) и
`POST /api/media/{project_id}/deliver` (сдача файлом) оба ставят статус `delivered`.
Дублирование логики; для демо ок, но стоит держать в голове.

**C4. Проект остаётся `open` после принятия заявки (до заморозки эскроу)** — ✅ ИСПРАВЛЕНО (2026-06-05)

> ✅ `create_bid` теперь отклоняет заявку, если `assigned_freelancer_id` уже задан;
> `get_projects` фильтрует `assigned_freelancer_id IS NULL` — назначенный (но ещё не
> профинансированный) проект пропадает из ленты `/projects` и не принимает новые заявки.

`accept_bid` назначает фрилансера, но статус остаётся `open` до `freeze`. В окне между
«заявку приняли» и «эскроу заморожен» проект всё ещё висит в общей ленте `/projects`,
и на него могут подать заявку новые фрилансеры. Не критично, но нелогично.

---

## ДОРАБОТКА АДМИНКИ (2026-06-05) — статус по ходу

> Делаю пункты 1–4 + график + редизайн. Отмечаю галочками по мере готовности.

**Backend**
- [x] D1 AUDIT — модель `AdminAuditLog` + хелпер `log_admin_action`, логирование во всех админ-действиях, `GET /admin/audit-log` ✅
- [x] D2 PROJ — модерация проектов: `GET /admin/projects` (все статусы), `PUT /admin/projects/{id}/hide` (→cancelled), `DELETE /admin/projects/{id}` (с зачисткой зависимостей) ✅
- [x] D3 FIN — реестр `GET /admin/transactions`; в `/admin/stats` добавлены доход платформы, разбивка ролей, 14-дневная динамика ✅
- [x] D4 REPORT — бан из жалобы с причиной (`PUT /users/{id}/ban` принимает `reason` → в audit log) ✅

**Frontend**
- [x] D5 CHART — SVG line-chart в «Обзоре» (14 дней: новые юзеры/проекты) + карточка дохода и разбивки ✅
- [x] D6 UI-PROJ — секция «Проекты» (поиск, фильтр статуса, скрыть/удалить с подтверждением) ✅
- [x] D7 UI-FIN — секция «Транзакции» (реестр всех операций, фильтр по статусу, оборот) ✅
- [x] D8 UI-AUDIT — секция «Журнал» (лог действий админов с иконками) ✅
- [x] D9 UI-REPORT — в «Жалобах»: ссылки на нарушителя/проект + «Забанить» с причиной ✅
- [x] D10 POLISH — новые секции в едином стиле (SectionHeader/карточки/Spinner/Empty), nav расширен ✅

**Проверено:** `npm run build` ✅ (595 модулей), `import main` ✅ (роутеры без ошибок). Таблица `admin_audit_log`
создаётся автоматически на старте (`create_all`) — миграция не нужна, просто перезапустить backend.

---

## AI-АССИСТЕНТ — УЛУЧШЕНИЯ (2026-06-05)

- [x] Отдельный эндпоинт `POST /ai/rank-bids` с JSON-only system-промптом для «AI Rank» на /projects/:id ✅
  Раньше AI Rank дёргал общий `/ai/chat`: разговорный промпт («отвечай только по-русски», «верни к теме») мешал
  выдавать чистый JSON, а `''` передавался как `history` (не как context). Теперь — надёжно и по контексту проекта.
- [x] Чат стал ролевым — фронт передаёт контекст роли (заказчик/фрилансер), ответы адаптируются ✅
- [x] В знания ассистента добавлена шпаргалка «СТРАНИЦА ПРОЕКТА /projects/:id — что там и что делать»
  по ролям и статусам (open → in_progress → delivered → completed) — на вопросы про эту страницу AI даёт точные шаги ✅
- [x] Убран хардкод «/ai — ты сейчас здесь» (чат вызывается и из других мест) ✅

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

*Workflow TZ v7.0 | 2026-06-05 | AzizSaidov*