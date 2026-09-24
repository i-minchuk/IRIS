# ДокПоток IRIS — Файл памяти

> Краткий сводный анализ проекта для AI-агентов. Обновлять при значимых изменениях.

---

## Сводка

**ДокПоток IRIS** — система управления технической документацией (DMS). MVP 4.7.0.
- **Backend**: FastAPI + async SQLAlchemy 2.0 (PostgreSQL/SQLite) + Alembic
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + React Router v7
- **AI**: OpenAI + Qdrant (RAG, inline suggestions, анализ документов)
- **Real-time**: WebSocket (collaboration + inline AI)

---

## Архитектура backend (модульная)

```
Level 0: core, db, auth
Level 1: projects, documents, tasks, workflow, remarks, variables, tenders
Level 2: time_tracking, collaboration, analytics, gamification, resources
```

**Ключевые модули:**
- **Auth**: JWT (access 24ч, refresh 7д), OAuth2, rate limiting, HttpOnly cookies
- **Documents**: CRUD, версионирование (Revision), замечания (DocumentRemark), согласование (ApprovalWorkflow), зависимости (DocumentDependency), подстановка переменных
- **Tasks**: 9 типов, статусная машина, синхронизация с Operation/Document, кэш статистики
- **Workflow**: шаблоны маршрутов (JSONB), инстансы, шаги, audit log, auto-transition
- **Remarks**: UUID PK, треды (parent_id), комментарии, теги, история (JSONB), CSV export
- **AI**: RAG-диалог (top-5 чанков → GPT-4o), inline suggestions, document analysis (JSON)

**База данных**: 35+ таблиц. Async SQLAlchemy. Dual: SQLite (dev) / PostgreSQL (prod).

---

## Архитектура frontend

```
app/router.tsx        → 9 маршрутов (lazy loading)
components/Layout.tsx   → sticky header, tabs, zoom, notifications, user menu
pages/                → Dashboard, Projects, Documents, Workflow, Remarks, Archive, Landing, Login
features/             → auth, ai, analytics, profile, documents, projects, remarks, tenders, etc.
components/ui/        → Badge, Button, Card, Tabs, Input, Select, Modal, Avatar
components/viewers/   → PDF, Excel, Word, DWG, CSV, Image
components/workspace/ → VS Code-like layout (explorer, tabs, inspector, bottom panel)
```

**Состояние**: Zustang only. 6 сторов. Auth — не persist. Zoom + Workspace — persist.

**API**: Axios с retry (3x), refresh on 401, Sentry для 5xx, toast (sonner) для ошибок.

**Тема**: Двойная (light/dark). CSS-переменные в `globals.css`. Tailwind `darkMode: 'class'`.

---

## Ключевые данные / бизнес-логика

- **Проект**: 4-уровневая иерархия Project → Stage → Kit → Section
- **Документ**: status enum, variable engine с `{{key}}` + safe eval
- **Замечание**: UUID, категории (КЖ, АР, КР, ЭОМ, ОВиК), severity, actions (assign/resolve/reject/defer/reopen/close)
- **Задача**: полиморфные ссылки (project, route, operation, document, work_center)
- **Workflow**: predefined templates (standard, fast, tender), soft delete
- **Геймификация**: 5 уровней, experience points, badges, daily quests, combos
- **Аналитика**: частично mock (shipments, sparklines), частично real (KPI, portfolio)

---

## Точки входа

```bash
# Backend
cd project-root/backend
uvicorn app.main:app --reload --port 8000

# Frontend
cd project-root/frontend
npm run dev        # порт 5173, прокси на localhost:8000

# Docker (полный стек)
docker compose up -d

# Windows
СТАРТ.bat
```

---

## Известные проблемы

1. **Миграции**: две миграции создают одни таблицы (`bb738b9eb80a` и `6bb361a0f4ae`)
2. **Task модель**: была merge conflict (исправлено)
3. **Archive API**: 500 на SQLite из-за UUID vs INTEGER
4. **time_sessions**: таблица отсутствует, дашборд без трекера
5. **Playwright**: нет конфига и тестов
6. **ProtectedRoute**: pass-through, нет реальной проверки
7. **AI таблицы**: только в raw SQL, не в Alembic
8. **ESLint**: отключён на frontend

---

## Безопасность (критично)

- `SECRET_KEY` min 32 символа, не дефолт
- Rate limit: `/login` 5/мин, `/refresh` 10/мин
- JWT через HttpOnly Secure SameSite=Lax cookies (prod)
- `variable_engine.py` использует safe eval — **не ослаблять**

---

## Правила для агентов

1. **Backend**: модуль N импортирует только ≤ N. Роутер → сервис → репозиторий → модель.
2. **Frontend**: фичи автономны, нет циклических зависимостей.
3. TypeScript strict: `noUnusedLocals`, `noUnusedParameters`.
4. Все импорты через `@/` алиас.
5. CSS-переменные проекта, не хардкодить цвета.
6. Миграция обязательна при изменении моделей.
7. Не менять публичные сигнатуры без согласования.

---

## Документация модулей

Подробная документация по каждому блоку: `docs/modules/`.
