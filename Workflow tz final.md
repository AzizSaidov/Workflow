# Workflow — Финальное ТЗ
### Версия 3.0 | Всё что осталось сделать

> Это единственный актуальный документ. Все старые ТЗ устарели.
> Реализовывать строго по этапам. Один этап → проверка → следующий.

---

## Что уже готово (не трогать)

**Backend:** users, projects, bids, wallet, escrow, chats (WebSocket), reviews, profiles, stats, media, notifications, ai, search, reports, admin (частично)

**Frontend:** главная (глобус, статистика, категории), auth flow, dashboard client/freelancer, ProjectsFeed, ProjectDetail (частично), Profile (просмотр), Wallet, ChatsPage (рерайт), AdminPanel, EditProject, Favorites, смена роли в admin

---

## ЭТАП 1 — Критические баги и валюта

**1.1 Замена TJS → $ везде**
- BidCard.jsx — сумма заявки
- Profile.jsx — ставка фрилансера (TJS/час → $/hr)
- Wallet.jsx — все суммы
- CreateProject.jsx — поля бюджета
- seed.py — пересчитать: балансы 1000–8000$, ставки 20–120$/hr, бюджеты 500–15000$

**1.2 Исправить AI "Улучшить" в backend/ai/views.py**

Промпт для action=improve заменить на:
"Исправь грамматику и стиль текста, НЕ меняя смысл, факты, числа и намерение автора. Верни только исправленный текст без пояснений."

**1.3 Аватарки и имена везде**
- ProjectDetail — загрузить данные клиента (GET /api/users/{client_id}) и показать имя + аватар
- ProjectDetail — загрузить исполнителя (GET /api/users/{assigned_freelancer_id}) и показать
- BidCard — показывать аватарку фрилансера
- DashboardClient — имена фрилансеров в заявках
- AdminPanel — аватарки пользователей в таблице
- Правило: Avatar компонент всегда получает реальные name + avatar_url

**1.4 Улучшить seed.py**
- Рейтинги: разброс 3.8–4.95 (не все 5.0)
- Аватарки: https://i.pravatar.cc/150?u=EMAIL
- total_jobs: варьировать 2–120
- Позиционирование: убрать "Центральная Азия" из Hero badge → "Global Freelance Platform"

**ПРОВЕРКА: $ везде, AI не меняет смысл, имена и аватарки видны. СТОП.**

---

## ЭТАП 2 — Страница AI-ассистента (/ai)

**2.1 Создать pages/AIAssistant.jsx**

Три таба вверху:
- "Помощник" — чат помошник по платоформе (POST /api/ai/chat)
- "Создать проект" — форма: описание + бюджет → AI генерирует текст (POST /api/ai/help-project) — для client
- "Написать заявку" — форма: описание проекта + мой опыт → AI пишет cover letter (POST /api/ai/help-bid) — для freelancer

UI чата:
- История сообщений сверху, инпут снизу
- Своё сообщение справа (accent цвет), AI слева (card цвет)
- Typing-индикатор пока AI отвечает (3 точки)
- \n → параграфы, **текст** → жирный

Системный промпт в backend (ai/views.py):
```
Ты помощник платформы Workflow — фриланс-биржи. Помогаешь:
- Фрилансерам: написать заявку, составить профиль, разобраться с платформой
- Заказчикам: сформулировать проект, оценить бюджет, выбрать фрилансера
- Всем: разобраться как работает эскроу, споры, рейтинг
Отвечай по-русски. Давай конкретные советы.
```

**2.2 Добавить /ai в роутинг App.jsx**

ProtectedRoute, доступен всем ролям.

**2.3 Добавить в Navbar dropdown**

Для всех ролей (не только freelancer): { to: '/ai', icon: 'ti-robot', label: 'AI-ассистент' }

**ПРОВЕРКА: страница /ai открывается, чат работает, AI отвечает. СТОП.**

---

## ЭТАП 3 — Публичный доступ (без регистрации)

**3.1 Убрать ProtectedRoute с этих страниц:**
- /projects — лента проектов
- /projects/:id — страница проекта
- /profile/:id — профиль пользователя

**3.2 Ограниченный функционал для гостей**

Гость может: просматривать. Не может: подавать заявки, писать в чат, добавлять в избранное.

Если гость нажимает "Подать заявку" / "В избранное" / "Написать" → редирект на /login с toast "Войдите, чтобы продолжить"

В ProjectDetail для неавторизованных: вместо формы заявки → баннер "Войдите, чтобы подать заявку" + кнопка

**3.3 Обновить api/client.js**

Сейчас при 401 → window.location.href = '/login'. 
Добавить publicClient (копия axios без interceptor redirect) для публичных запросов.
Или: в interceptor проверять флаг config.public — если true, не редиректить.

**3.4 Бэкенд — сделать эндпоинты опциональными**

В users/permissions.py добавить:
```python
def get_optional_user(credentials = Security(HTTPBearer(auto_error=False)), db = Depends(get_db)):
    if not credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except:
        return None
```

Применить get_optional_user вместо get_current_user в:
- GET /api/projects/ и GET /api/projects/{id}
- GET /api/users/{id}
- GET /api/profiles/{user_id}
- GET /api/portfolio/{user_id}
- GET /api/reviews/user/{user_id}

**ПРОВЕРКА: незарегистрированный видит проекты и профили, но не может подать заявку. СТОП.**

---

## ЭТАП 4 — ProjectDetail полный цикл

**4.1 Таймлайн статуса проекта**

Визуальный прогресс под заголовком проекта:
```
[●]──[○]────[○]───[○]
Открыт → В работе → Сдан → Завершён
```
- Текущий статус: заполненный кружок + accent цвет
- Пройденные: зелёный
- Будущие: серый
- disputed = красный, cancelled = зачёркнут

и еше можно сделать чтобы фриалсер отмечал на каком проценет выполнения проэкт например 25-50-75-100%

**4.2 Секция сдачи работы (для фрилансера)**

Показывать если: user = assigned_freelancer И статус = in_progress

Кнопка "Сдать работу" → модалка:
- Поле описания (textarea)
- URL GitHub (опционально)
- URL демо (опционально)
- Загрузка файла (POST /api/media/project/{id}/delivery)
- Кнопка "Отправить"

После отправки: PUT /api/projects/{id}/deliver → статус → delivered, UI обновляется

**4.3 Секция приёмки (для заказчика)**

Показывать если: user = клиент И статус = delivered

Показывать что сдал фрилансер (GitHub, демо, файл, описание).

Три кнопки:
- "Принять работу" → POST /api/escrow/{tx_id}/release → статус completed → форма отзыва
- "Запросить доработку" → статус остаётся delivered + toast
- "Открыть спор" → POST /api/escrow/{tx_id}/dispute → подтверждение модалка

**4.4 Информация о сторонах в сайдбаре**

Заказчик: аватарка + имя + "На платформе с..." (из GET /api/users/{client_id})
Исполнитель (если in_progress/delivered/completed): аватарка + имя + рейтинг + ссылка на профиль

**4.5 Файлы проекта**

Секция внизу: список загруженных файлов (GET /api/projects/{id}/files) + скачивание

**ПРОВЕРКА: полный цикл работает — подача, принятие, сдача, приёмка. СТОП.**

---

## ЭТАП 5 — Portfolio CRUD + GitHub профиль

**5.1 GitHub поле — бэкенд**

В FreelancerProfile модели добавить:
```python
github_url = Column(String, nullable=True)
```
Alembic миграция. Добавить в FreelancerProfileUpdate и FreelancerProfileResponse схемы.

**5.2 GitHub — фронтенд Profile.jsx**

В форме редактирования: поле "Ваш GitHub" с иконкой ti-brand-github
Валидация: должно начинаться с https://github.com/

В сайдбаре профиля (если github_url): кнопка-ссылка:
[ti-brand-github] Мой GitHub [ti-external-link] → target="_blank"

**5.3 Добавление работ в портфолио**

В секции "Портфолио" своего профиля — кнопка "+ Добавить работу"

Модалка с полями:
- Название (обязательно)
- Описание (textarea)
- URL изображения
- Ссылка на проект (GitHub или demo)

API: POST /api/portfolio/ (уже существует)

**5.4 Редактирование и удаление портфолио**

На карточке портфолио (только владелец): иконки карандаша и корзины
Edit: та же модалка предзаполненная → PUT /api/portfolio/{id}
Delete: подтверждение → DELETE /api/portfolio/{id}

**5.5 Иконка PortfolioItem**

Если project_url содержит github.com → ti-brand-github
Иначе → ti-external-link

**ПРОВЕРКА: GitHub виден в профиле, CRUD портфолио работает. СТОП.**

---

## ЭТАП 6 — Страница активных работ (/my-work)

Только для freelancer.

**6.1 Создать pages/MyWork.jsx**

Три раздела:
- "В работе" — проекты in_progress где assigned_freelancer = me
- "Сданные" — статус delivered (ожидаем подтверждения)
- "Завершённые" — статус completed

Каждая карточка: название, бюджет $, дедлайн (красный если просрочен), кнопка "Открыть проект"

Для in_progress: кнопка "Сдать работу" прямо на карточке → переход на /projects/:id

Дедлайн: "осталось N дней" зелёным или "просрочен на N дней" красным

**6.2 Добавить в Navbar для freelancer**

{ to: '/my-work', icon: 'ti-briefcase', label: 'Мои работы' }

**ПРОВЕРКА: страница /my-work показывает активные работы фрилансера. СТОП.**

---

## ЭТАП 7 — SEO мета-теги

**7.1 Создать src/hooks/useSEO.js**

```javascript
export function useSEO(title, description) {
  useEffect(() => {
    document.title = title + ' — Workflow'
    const setMeta = (name, content, prop = false) => {
      let el = document.querySelector(`meta[${prop ? 'property' : 'name'}="${name}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute(prop ? 'property' : 'name', name); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    setMeta('description', description)
    setMeta('og:title', title, true)
    setMeta('og:description', description, true)
  }, [title, description])
}
```

**7.2 Применить во всех страницах:**

| Страница | title | description |
|----------|-------|-------------|
| Home | Global Freelance Platform | Find top freelancers worldwide. Escrow payments, AI assistant. |
| ProjectsFeed | Browse Projects | Find freelance projects in development, design, marketing. |
| ProjectDetail | {project.title} | {project.description первые 160 символов} |
| Profile | {user.full_name} — Freelancer | Rating {rating} · {total_jobs} jobs completed |
| Register | Join Workflow | Start freelancing or hire top talent today. |
| Login | Sign In | Welcome back to Workflow. |
| Dashboard | Dashboard | Your personal workspace on Workflow. |
| Wallet | My Wallet | Manage your balance and transactions. |
| AIAssistant | AI Assistant | Get help with projects and bids from AI. |
| AdminPanel | Admin Panel | Platform management. |

**ПРОВЕРКА: title вкладки меняется на каждой странице. СТОП.**

---

## ЭТАП 8 — Дизайн-полиш всех страниц

> Стиль не меняем — меняем расположение, добавляем анимации и эффекты.

**8.1 Общие улучшения для всех рабочих страниц**

Создать переиспользуемые компоненты:

EmptyState.jsx:
```jsx
// иконка + заголовок + текст + кнопка
<EmptyState icon="ti-folder-off" title="Нет проектов" text="Создайте первый проект" buttonText="Создать" onButton={() => navigate('/projects/new')} />
```

PageHeader.jsx:
```jsx
// заголовок страницы + breadcrumb + опциональная кнопка
<PageHeader title="Мои проекты" crumbs={['Главная', 'Проекты']} action={<Button>Создать</Button>} />
```

Toast система:
- Создать src/store/toastStore.js (Zustand)
- Создать components/ToastContainer.jsx
- Тост: плашка снизу-справа, иконка + текст, авто-скрытие 3 сек
- Цвета: зелёный (success), красный (error), фиолетовый (info)
- Показывать при: подаче заявки, избранном, загрузке аватара, сдаче работы

**8.2 DashboardClient — расположение**

Верх: 4 stat-карточки в ряд (проекты, в работе, завершено, потрачено $)
Центр-лево: список проектов с фильтром по статусу (большой блок)
Центр-право: последние 3 уведомления + кнопка "Создать проект" (CTA)
Низ: если нет проектов → EmptyState по центру с большой кнопкой

**8.3 DashboardFreelancer — расположение**

Верх: 4 stat-карточки (заявок, активных, заработано $, рейтинг)
Центр-лево: мои заявки (список BidCard)
Центр-право: рекомендуемые проекты (3 карточки из /api/stats/recent-projects)
Низ: баннер "Нужна помощь с заявкой? Спроси AI →" → /ai

**8.4 Wallet — расположение**

Верх: большой блок баланса по центру (крупное число с анимацией count-up)
Слева от числа: frozen средства
Справа: легенда (доступно / заморожено)
Ниже: фильтр "Все / Пополнения / Списания"
Таблица транзакций: дата, тип, сумма ($), статус-тег

**8.5 Profile — расположение**

Лево (сайдбар 1/3):
- Аватарка (большая) + кнопка загрузки
- Имя (Syne 800), заголовок (профессия), рейтинг
- Ставка $/hr
- Верификация бейдж (если is_verified)
- GitHub кнопка
- Навыки (теги)
- Языки
- Кнопки: "В избранное" / "Написать"

Право (контент 2/3):
- Вкладки: "О себе" / "Портфолио" / "Отзывы" / "Сертификаты"
- О себе: bio + опыт + образование
- Портфолио: сетка карточек + кнопка "Добавить" для владельца
- Отзывы: список
- Сертификаты: список

**8.6 ProjectDetail — расположение**

Верх: breadcrumb + таймлайн статуса
Основной блок (2/3): описание, требования, навыки
Сайдбар (1/3): бюджет, дедлайн, категория, заказчик (с аватаром), исполнитель
Вкладки снизу: "Заявки" (для client) / "Чат" (если in_progress) / "Файлы"
Для freelancer: форма заявки или кнопка "Сдать работу" (по статусу)

**8.7 Анимации (добавить везде)**

При монтировании страниц: fade-in + slide-up (CSS transition, 0.3s)
Карточки: hover translateY(-3px) + border glow (уже есть в STYLE_GUIDE)
Кнопки: hover opacity 0.85 + scale 0.98
Числа статистики: count-up анимация (как на главной — переиспользовать)
Stat-карточки в дашборде: появляются последовательно (stagger 0.1s)
Skeleton loading: серые мигающие плашки пока данные грузятся

**8.8 StarBackground интенсивность**

Добавить prop intensity в StarBackground:
- "full" — публичные страницы (/, /role, /register, /login): все звёзды
- "reduced" — рабочие страницы: звёзд в 2 раза меньше, падающие отключены

**ПРОВЕРКА: все страницы выглядят профессионально и согласованно. СТОП.**

---

## ЭТАП 9 — Онлайн-счётчик и геолокация на глобусе

**9.1 Онлайн-счётчик (бэкенд)**

В users/permissions.py в get_current_user:
```python
redis_client.setex(f"online:{user.id}", 300, 1)
```

Новый эндпоинт GET /api/stats/online-count:
```python
keys = redis_client.keys("online:*")
return {"count": len(keys)}
```

**9.2 Онлайн-счётчик (фронтенд)**

В Home.jsx: запрос GET /api/stats/online-count
Бейдж над глобусом: "● {count} онлайн" вместо статичного текста
Fallback если 0 или ошибка: "Global Freelance Platform"

**9.3 Геолокация (бэкенд)**

Новый эндпоинт POST /api/users/me/location:
```python
# принимает { lat: float, lng: float }
# сохраняет в User.latitude и User.longitude
```

**9.4 Геолокация (фронтенд)**

После логина (в authStore.login): однократный запрос геолокации браузера:
```javascript
if (!localStorage.getItem('geo-asked')) {
  navigator.geolocation.getCurrentPosition(
    pos => { usersApi.updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
    () => {}
  )
  localStorage.setItem('geo-asked', 'true')
}
```

В Globe.jsx добавить цвет для role='me': красный (#FF4444), чуть крупнее

**ПРОВЕРКА: счётчик онлайн работает, точка текущего юзера на глобусе. СТОП.**

---

## ЭТАП 10 — Пагинация и фильтры из URL

**10.1 Фильтры из URL в ProjectsFeed**

При заходе на /projects?category_id=X&search=Y — автоматически применять в useState
Показывать активные фильтры как chips с крестиком
Кнопка "Сбросить все"

**10.2 Пагинация в ProjectsFeed**

Первая загрузка: 12 проектов
Кнопка "Загрузить ещё 12" внизу (или intersection observer)

**10.3 Серверный поиск**

Поиск по фрилансерам через GET /api/search/freelancers?q=...
Не клиентский фильтр

**ПРОВЕРКА: пагинация и URL-фильтры работают. СТОП.**

---

## ЭТАП 11 — Финальная проверка и коммит

**11.1 Пройтись по всем страницам как пользователь**

Сценарий заказчика:
- Зарегистрироваться как client → попасть на dashboard
- Создать проект → опубликовать
- Найти фрилансера → посмотреть профиль → добавить в избранное
- Принять заявку → проверить что escrow заморожен
- Принять работу → оставить отзыв

Сценарий фрилансера:
- Зарегистрироваться как freelancer → заполнить профиль
- Добавить навыки → добавить GitHub → добавить работу в портфолио
- Найти проект → подать заявку через AI-помощь
- Зайти в /my-work → увидеть принятый проект
- Сдать работу

Сценарий гостя:
- Зайти на главную → увидеть глобус и статистику
- Зайти на /projects → увидеть список без логина
- Кликнуть "Подать заявку" → редирект на login

**11.2 Финальный коммит**

```powershell
git add .
git commit -m "feat: complete frontend - AI assistant, public access, full project cycle, portfolio CRUD, SEO, design polish"
git push
```

---

## Приоритеты

| Приоритет | Этапы | Время |
|-----------|-------|-------|
| КРИТИЧНО — делай первым | 1, 2 | ~2 часа |
| ВЫСОКИЙ | 3, 4, 5 | ~4 часа |
| ВЫСОКИЙ | 6, 7 | ~2 часа |
| СРЕДНИЙ | 8 | ~3 часа |
| НИЗКИЙ | 9, 10 | ~2 часа |
| ФИНАЛ | 11 | ~1 час |

---

## Технические детали

- api/client.js при 401 — не редиректить для публичных запросов (флаг config.public)
- Zustand toastStore: [{ id, message, type }] + ToastContainer в App.jsx
- useSEO хук через useEffect в каждой странице
- StarBackground принимает intensity="full"|"reduced"
- Все анимации CSS transitions (не библиотеки) — performance важнее
- Skeleton: простые div с animation: pulse CSS

---

## Что НЕ делаем

- Реальные платежи
- Async backend (в самом конце при необходисомти)
- Мобильная адаптация полная (desktop-first)
- Milestones (отложено)
- Частичный refund (отложено)
- Connects механика (отложено)

---

*Workflow TZ v3.0 | Финальный | Aziz Saidov | 2026-06-02*