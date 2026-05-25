# Документация модулей ДокПоток IRIS

> Эта директория содержит документацию по каждому блоку проекта для параллельной разработки несколькими агентами.

## Backend модули

| Файл | Модуль | Уровень | Описание |
|------|--------|---------|----------|
| [BACKEND_AUTH.md](BACKEND_AUTH.md) | Auth | 0 | JWT, пользователи, авторизация |
| [BACKEND_CORE.md](BACKEND_CORE.md) | Core | 0 | Конфиг, безопасность, middleware, кэш |
| [BACKEND_DATABASE.md](BACKEND_DATABASE.md) | Database | 0 | SQLAlchemy, Alembic, миграции |
| [BACKEND_PROJECTS.md](BACKEND_PROJECTS.md) | Projects | 1 | Проекты, стадии, комплекты, разделы |
| [BACKEND_DOCUMENTS.md](BACKEND_DOCUMENTS.md) | Documents | 1 | Документы, ревизии, согласование |
| [BACKEND_TASKS.md](BACKEND_TASKS.md) | Tasks | 1 | Задачи, производственный контроль |
| [BACKEND_WORKFLOW.md](BACKEND_WORKFLOW.md) | Workflow | 1 | Маршруты согласования |
| [BACKEND_REMARKS.md](BACKEND_REMARKS.md) | Remarks | 1 | Замечания, комментарии, теги |
| [BACKEND_TENDERS.md](BACKEND_TENDERS.md) | Tenders | 1 | Тендерный портфель |
| [BACKEND_VARIABLES.md](BACKEND_VARIABLES.md) | Variables | 1 | Переменные шаблонов |
| [BACKEND_GAMIFICATION.md](BACKEND_GAMIFICATION.md) | Gamification | 2 | Геймификация, бейджи, квесты |
| [BACKEND_RESOURCES.md](BACKEND_RESOURCES.md) | Resources | 2 | Загрузка команды, теплокарта |
| [BACKEND_TIME_TRACKING.md](BACKEND_TIME_TRACKING.md) | Time Tracking | 2 | Учёт времени, эффективность |
| [BACKEND_ANALYTICS.md](BACKEND_ANALYTICS.md) | Analytics | 2 | Дашборд, KPI, отчёты |
| [BACKEND_COLLABORATION.md](BACKEND_COLLABORATION.md) | Collaboration | 2 | WebSocket, real-time |
| [BACKEND_AI.md](BACKEND_AI.md) | AI | — | RAG, inline suggestions, OpenAI |

## Frontend модули

| Файл | Модуль | Описание |
|------|--------|----------|
| [FRONTEND_ROUTING.md](FRONTEND_ROUTING.md) | Routing & Layout | Маршруты, Layout, защищённые роуты |
| [FRONTEND_PAGES.md](FRONTEND_PAGES.md) | Pages | Страницы приложения |
| [FRONTEND_FEATURES.md](FRONTEND_FEATURES.md) | Features | Фичи по доменам |
| [FRONTEND_COMPONENTS.md](FRONTEND_COMPONENTS.md) | Components | UI, viewers, workspace, ChromeBot |
| [FRONTEND_STATE.md](FRONTEND_STATE.md) | State | Zustand-сторы |
| [FRONTEND_API.md](FRONTEND_API.md) | API Client | Axios, интерцепторы, retry |
| [FRONTEND_THEME.md](FRONTEND_THEME.md) | Theme | Стили, Tailwind, тёмная/светлая тема |

## Правила параллельной разработки

1. **Backend**: модуль уровня N может импортировать только уровни ≤ N.
   - Уровень 0: core, db, auth
   - Уровень 1: projects, documents, tasks, workflow, remarks, variables, tenders
   - Уровень 2: time_tracking, collaboration, analytics, gamification, resources

2. **Frontend**: фичи автономны, **не создавать** циклические зависимости.

3. **НЕ менять** публичные сигнатуры без согласования.

4. **Всегда** создавать Alembic-миграцию при изменении моделей.

5. TypeScript strict: `noUnusedLocals`, `noUnusedParameters` — удалять неиспользуемое.
