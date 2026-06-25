# ДокПоток IRIS — Контекст для AI-агентов

> Этот файл предназначен для AI-агентов, работающих с кодовой базой. Здесь собрана актуальная информация об архитектуре, стеке, командах и конвенциях проекта. Читатель этого файла не знает о проекте ничего — полагайтесь только на написанное ниже.
> 
> Последнее обновление: 2026-06-22.

---

## Обзор проекта

**ДокПоток IRIS** — система управления технической документацией (Document Management System), MVP версии 4.5.0.

Приложение состоит из:
- **Backend** — асинхронный API на FastAPI.
- **Frontend** — одностраничное приложение (SPA) на React 19 + TypeScript + Vite.
- **База данных** — PostgreSQL 15 (asyncpg) в production, SQLite для локальной разработки.
- **Векторная БД** — Qdrant (для AI/эмбеддингов).
- **Кэш / очереди** — Redis + Celery.

Основные функции: аутентификация и авторизация (JWT), управление проектами, документами, замечаниями, задачами, архивом, тендерами, геймификация, совместная работа через WebSocket, интеграция с OpenAI, учёт времени, аналитика.

### Структура репозитория

Репозиторий имеет вложенную структуру:
- **Корень репозитория** (`c:\Users\Novikova\Desktop\ДокПоток_IRIS\`) — инфраструктурные файлы: `docker-compose.yml`, `Dockerfile.backend`, `prometheus.yml`, `nginx.conf`, Windows-скрипты `scripts/СТАРТ.bat` и `scripts/СТОП.bat`, GitHub Actions в `.github/workflows/`.
- **`project-root/`** — основной код проекта:
  - `project-root/backend/` — Python backend.
  - `project-root/frontend/` — React frontend.
  - `project-root/docs/` — архитектурная и пользовательская документация.
  - `project-root/k8s/` — Kubernetes манифесты.
  - `project-root/systemd/` — systemd unit-файлы для бэкапов.
  - `project-root/docker-compose.dev.yml`, `project-root/docker-compose.prod.yml` — compose-файлы для разработки и production.

> Важно: не путать корневой `docker-compose.yml` с `project-root/docker-compose.*.yml`. Корневой compose предназначен для запуска полного стека, но содержит несоответствия путей (см. раздел «Известные проблемы»).

---

## Технологический стек

### Backend (`project-root/backend/`)

- **Python** 3.12+
- **FastAPI** 0.115.6 + **Uvicorn** 0.34.0
- **SQLAlchemy** 2.0.36 (async) + **Alembic** 1.14.0
- **Pydantic** 2.10.4 + **pydantic-settings** 2.7.0
- **Базы данных**: PostgreSQL 15 (asyncpg), SQLite для разработки
- **Auth**: JWT (python-jose, passlib/bcrypt), OAuth2PasswordBearer
- **Rate limiting**: slowapi 0.1.9 (Redis при доступности, иначе memory)
- **AI/LLM**: OpenAI API, tiktoken, langchain, langchain-openai
- **Векторный поиск**: qdrant-client
- **Документы**: PyMuPDF, python-docx
- **Кэш/очереди**: redis 5.0.1, celery[redis]
- **SAML/SSO**: python3-saml
- **Тестирование**: pytest 8.3.3, pytest-cov 5.0.0, pytest-asyncio 0.24.0
- **Линтинг**: Black (line-length 88), Ruff (line-length 88)
- **Security scanning**: safety 3.2.0

### Frontend (`project-root/frontend/`)

- **React** 19.2.4 + **React DOM** 19.2.4
- **TypeScript** ~5.9.3
- **Сборка**: Vite 8.0.1
- **Роутинг**: React Router DOM 7.14.1
- **Состояние**: Zustand 5.0.12
- **Стили**: TailwindCSS 3.4.19 + CSS-переменные `iris-*` (светлая/тёмная/contrast/sepia/midnight темы)
- **Анимации**: Framer Motion 12.38.0
- **Иконки**: Lucide React
- **Диаграммы**: Recharts 3.8.0
- **Документы**: React-PDF, Mammoth, pdfjs-dist, xlsx
- **Редактор**: TipTap (starter-kit, placeholder, underline)
- **Тестирование**: Playwright 1.52.0 (e2e)
- **Линтинг**: ESLint 9.39.4 + typescript-eslint + eslint-plugin-react-hooks (конфигурация есть, но правила не заданы — см. раздел «Известные проблемы»)
- **Мониторинг**: Sentry React

### Инфраструктура

- **Docker**: Docker Compose (dev / prod / staging), multi-stage образы backend и frontend.
- **Nginx**: обратный прокси + раздача статики.
- **CI/CD**: GitHub Actions (lint, test, security-scan, docker-build, integration, staging-deploy).
- **Мониторинг**: Prometheus + Grafana.
- **Бэкапы**: systemd timer (ежедневно в 02:00, хранение 30 дней).
- **Kubernetes**: k8s манифесты в `project-root/k8s/` (Postgres, Redis, backend, frontend, ingress, HPA).

---

## Структура проекта

### Backend

```
project-root/backend/
├── app/
│   ├── main.py              # Точка входа FastAPI
│   ├── api/router.py        # Центральный роутер /api/v1
│   ├── core/                # Конфиг, security, middleware, exceptions, logging, cache, metrics
│   ├── db/                  # Base, session, engine (async)
│   ├── models/__init__.py   # Регистрация всех моделей для Alembic
│   ├── modules/             # Бизнес-модули (23 модуля)
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── calendar/
│   │   ├── collaboration/
│   │   ├── core/
│   │   ├── documents/
│   │   ├── gamification/
│   │   ├── integrations/
│   │   ├── monitoring/
│   │   ├── notifications/
│   │   ├── operations/
│   │   ├── projects/
│   │   ├── remarks/
│   │   ├── reports/
│   │   ├── resources/
│   │   ├── routes/
│   │   ├── tasks/
│   │   ├── tenders/
│   │   ├── time_tracking/
│   │   ├── variables/
│   │   └── workflow/
│   ├── ai/                  # AI-сервис, промпты, эмбеддинги
│   ├── parser/              # Парсинг DOCX/PDF
│   ├── websocket/           # WebSocket-эндпоинты
│   ├── crud/                # Общие CRUD-операции
│   ├── services/            # Общие сервисы
│   └── schemas/             # Общие схемы
├── alembic/                 # Миграции
├── tests/                   # Тесты pytest
├── scripts/                 # Скрипты окружения и архитектуры
├── requirements.txt
└── pyproject.toml
```

### Frontend

```
project-root/frontend/
├── src/
│   ├── app/                 # Роутинг (router.tsx), ProtectedRoute
│   ├── features/            # Фичи по доменам (17 фич)
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── calendar/
│   │   ├── collaboration/
│   │   ├── documents/
│   │   ├── leaderboard/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── projects/
│   │   ├── remarks/
│   │   ├── resources/
│   │   ├── tenders/
│   │   ├── time_tracking/
│   │   ├── variables/
│   │   ├── workflow/
│   │   └── zoom/
│   ├── pages/               # Страницы-роуты
│   ├── components/          # Общие компоненты + ui/ + viewers/ + workspace/
│   ├── shared/              # API-клиент, стили, иконки, хуки
│   ├── providers/           # ThemeProvider, LanguageProvider
│   ├── stores/              # Дополнительные Zustand-сторы
│   ├── context/             # AuthContext
│   ├── types/               # Глобальные TypeScript-типы
│   └── api/                 # Legacy API-модули
├── public/
├── e2e/                     # Playwright e2e-тесты
├── package.json
├── vite.config.ts
├── playwright.config.ts
├── tailwind.config.js
├── tsconfig.json
└── eslint.config.js
```

---

## Архитектура backend

### Модульная структура

Каждый модуль в `app/modules/{name}/` по возможности следует слоистой архитектуре:
- `models.py` — SQLAlchemy-модели
- `schemas.py` — Pydantic-схемы (v2, `ConfigDict(from_attributes=True)`)
- `repository.py` — слой доступа к данным (DAL)
- `service.py` — бизнес-логика
- `deps.py` — зависимости FastAPI (DI)
- `router.py` — HTTP-обработчики

**Строгие правила импортов** (проверяются `scripts/check_architecture.py`):
- Роутер → сервис, сервис → репозиторий, репозиторий → модель
- Запрещено: сервис → роутер, репозиторий → сервис, роутер → модели других модулей
- `auth` не должен зависеть от других бизнес-модулей
- Модули не должны иметь циклических зависимостей
- Self-imports исключены из проверки

Разрешённые кросс-модульные зависимости определены в `scripts/check_architecture.py` (например, `documents` → `auth`, `projects`, `variables`; `analytics` → `auth`, `documents`, `projects`, `time_tracking` и т.д.).

### База данных

- Async SQLAlchemy 2.0: `create_async_engine` + `async_sessionmaker`
- `expire_on_commit=False`
- Поддержка SQLite (для разработки) и PostgreSQL (production)
- Для PostgreSQL настроены: `pool_size=20`, `max_overflow=30`, `pool_timeout=30s`, `pool_recycle=3600s`, `pool_pre_ping=True`
- Alembic с async-движком. Миграции запускаются при старте контейнера: `alembic upgrade head`

### Аутентификация и безопасность

- JWT с алгоритмом HS256
- Три типа токенов: access (24ч по умолчанию), refresh (7 дней), reset (30 мин)
- Токены содержат claims: `iss` (`iris-backend`), `aud` (`iris-frontend`), `jti`, `iat`, `type`
- Хранение: localStorage (dev) / HttpOnly Secure SameSite=Lax cookies (production)
- Rate limiting: `/login` 5/мин, `/refresh` 10/мин, стандартные API 60/мин
- WebSocket-аутентификация: JWT через query-параметр `?token=`
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, Referrer-Policy, Permissions-Policy, Cache-Control для API
- `SECRET_KEY` валидируется при старте: мин. 32 символа, не дефолтный, энтропия ≥3/4 категорий. В production небезопасный ключ вызывает `ValueError`, в `DEBUG` — `UserWarning`

### WebSocket

- `/ws` — совместная работа (presence, subscribe/unsubscribe документов, auto-unlock при отключении)
- `/ws/ai/inline/{client_id}` — AI-ассистент inline
- ConnectionManager в памяти, максимум 5 соединений на пользователя

### Конфигурация

- `app/core/config.py` — Pydantic Settings, загружает `.env` и `.env.local` из `project-root/backend/`
- Все AI-настройки имеют дефолты, чтобы CI не падал без API-ключей
- `BACKEND_CORS_ORIGINS` — список origins для CORS

---

## Архитектура frontend

### Организация кода

- **Feature-sliced design**: `features/` — доменные фичи, `shared/` — общий код, `pages/` — роуты, `components/` — общие компоненты.
- Два параллельных API-слоя: legacy `src/api/` и новый `src/features/*/api/`. Оба используют общий axios-клиент.
- Path alias: `@/` → `src/`

### Роутинг

- `createBrowserRouter` из React Router DOM v7
- Защищённые роуты обёрнуты в `ProtectedRoute` + `Layout`
- `ProtectedRoute` проверяет `localStorage.access_token` и валидирует через `/api/v1/auth/me`; при отсутствии токена редиректит на `/login`. Поддерживает `allowedRoles` (админы bypass).
- Все защищённые страницы загружаются через `React.lazy` + `Suspense`
- Редиректы legacy-путей (например, `/tenders` → `/portfolio?tab=tenders`)

### API-клиент

- `src/shared/api/client.ts` — axios-инстанс с `baseURL: '/api/v1'`
- Интерцепторы:
  - Автоматическая подстановка `Authorization: Bearer <token>`
  - Автоматический refresh при 401 (через `/api/v1/auth/refresh`)
  - Retry до 3 раз при сетевых ошибках
  - Toast-уведомления на русском для ошибок (403, 404, 422, 429, 500+)
  - Интеграция с Sentry для 5xx и сетевых ошибок
  - Demo mode пропускает logout на 401

### Состояние

- **Zustand** для всего состояния
- `useAuthStore` — токены, пользователь, гидратация, demo mode
- `useCollaborationStore` — WebSocket, presence, locked documents
- Дополнительные сторы в `src/stores/` и внутри `src/features/*/store/`
- Cross-cutting logout через `src/shared/api/authEvents.ts` (event emitter)

### Темизация

- Двойная тема: светлая / тёмная + дополнительные contrast, sepia, midnight
- CSS-переменные в `:root` и `[data-theme="dark"]` / `.dark`
- Tailwind `darkMode: 'class'`
- `ThemeProvider` управляет `data-theme` и классом `.dark` на `<html>`
- Дизайн-система: `iris-*` токены (фон, текст, границы, акценты, тени)

### Документ-вьювер

- Мультиформатный просмотрщик под `src/components/viewers/`: PDF, Excel, Word, DWG, Image, CSV
- Рабочее пространство (workspace) с Explorer, EditorTabs, BottomPanel, InspectorPanel

---

## Команды сборки и запуска

### Backend

```bash
cd project-root/backend

# Установка зависимостей
pip install -r requirements.txt

# Запуск (SQLite, dev)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Миграции
alembic upgrade head
alembic revision --autogenerate -m "description"

# Проверка архитектуры
python scripts/check_architecture.py
```

### Frontend

```bash
cd project-root/frontend

# Установка зависимостей
npm install

# Dev-сервер (порт 5173, прокси на localhost:8000)
npm run dev

# Сборка
npm run build

# Линт (ESLint запускается, но правила не заданы — см. известные проблемы)
npm run lint

# Preview production build
npm run preview

# E2E-тесты Playwright
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

### Docker

```bash
# Локальная разработка с PostgreSQL и Qdrant (только инфраструктура)
cd project-root
docker compose -f docker-compose.dev.yml up -d

# Полный стек из корня репозитория (внимание: есть несоответствия путей, см. известные проблемы)
cd /
docker compose up -d

# Production
cd project-root
docker compose -f docker-compose.prod.yml up -d

# Staging
docker compose -f docker-compose.staging.yml up -d
```

### Windows-скрипты

- `scripts/СТАРТ.bat` — запускает backend (uvicorn --reload), frontend (npm run dev) и открывает браузер. Ожидает venv в `project-root/backend/.venv/`.
- `scripts/СТОП.bat` — останавливает процессы python.exe и node.exe, освобождает порты 8000 и 5173.

---

## Тестирование

### Backend

```bash
cd project-root/backend

# Все тесты
pytest tests/ -v

# С покрытием (цель fail_under = 60 в pyproject.toml)
pytest tests/ --cov=app --cov-report=html

# Без интеграционных и медленных
pytest tests/ -m "not integration and not slow"

# Архитектурные проверки
pytest tests/ -m architecture -v
```

**Маркеры pytest** (определены в `pyproject.toml`):
- `integration` — тесты с реальной БД
- `e2e` — end-to-end тесты
- `slow` — медленные тесты
- `architecture` — проверка архитектурных ограничений

**Фикстуры** (`tests/conftest.py`):
- `mock_db` — `AsyncMock(spec=AsyncSession)`
- `client` — `TestClient` с переопределённым `get_db`
- `mock_user` — `MagicMock(spec=User)` с примитивными атрибутами
- `client_with_auth` — переопределяет и `get_db`, и `get_current_active_user`

**Важно**: `MagicMock`-атрибуты должны быть явно примитивами для корректной JSON-сериализации.

### Frontend

```bash
cd project-root/frontend

# E2E-тесты (Playwright)
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

Конфигурация Playwright (`playwright.config.ts`):
- Директория тестов: `./e2e`
- Проекты: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- `workers: 1`, `fullyParallel: false`
- Web server: `npm run dev` на `http://localhost:5173`

На текущий момент существуют 4 spec-файла (`auth.spec.ts`, `dashboard.spec.ts`, `landing.spec.ts`, `navigation.spec.ts`), суммарно ~200 строк. Unit-тесты не настроены.

### CI-проверки

- Backend: `pytest -m "not integration" --cov=app --cov-report=xml`
- Integration: `pytest -m integration` с сервисом PostgreSQL
- Architecture: `pytest -m architecture` + `scripts/check_architecture.py`
- Security: `safety check`, Trivy filesystem scan + SARIF

---

## Стиль кода и конвенции

### Backend

- **Black**: длина строки 88
- **Ruff**: длина строки 88, исключения `.git`, `.venv`, `build`, `dist`, `__pycache__`
- Типизация: используем аннотации типов, `from __future__ import annotations` где уместно
- Pydantic v2: `ConfigDict(from_attributes=True)`, `@field_validator`
- SQLAlchemy 2.0: `mapped_column`, `relationship` с явными `lazy`
- Предпочитать early return, минимальные изменения, сохранение контрактов
- Не менять публичные сигнатуры без явной просьбы
- Не вводить новые зависимости без необходимости

### Frontend

- TypeScript strict (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- Tailwind-классы в JSX
- CSS-переменные для темы (`var(--iris-bg-app)` и т.д.)
- Импорты через `@/` алиасы
- React 19, TypeScript 5.9

### Git и коммиты

- Базовая ветка: `develop`
- Фича-ветки: `feature/your-feature-name`
- Семантические префиксы:
  - `feat:` — новая функциональность
  - `fix:` — исправление бага
  - `refactor:` — рефакторинг без изменения поведения
  - `chore:` — инструменты, конфигурация
  - `docs:` — документация
  - `test:` — тесты

### Feature flags

Фичи, требующие постепенного включения, оформляются через:
```typescript
// frontend/src/shared/config/featureFlags.ts
export const featureFlags = {
  darkTheme: true,
  newProjectsUI: false,
  analytics: false,
};
```

---

## Безопасность

### Обязательные меры

- `SECRET_KEY` минимум 32 символа, не из списка дефолтных, энтропия ≥3/4 категорий
- HTTPS + WSS в production
- `BACKEND_CORS_ORIGINS` ограничен production-доменами
- Rate limiting активен на auth-эндпоинтах
- HttpOnly Secure SameSite=Lax cookies для токенов в production
- Логирование: все 401, WS-дисконнекты (1008), валидационные ошибки, rate limit
- Sentry: 5xx и сетевые ошибки

### Rate limits

| Endpoint | Лимит |
|---|---|
| `/api/v1/auth/login` | 5/мин |
| `/api/v1/auth/login/oauth2` | 5/мин |
| `/api/v1/auth/refresh` | 10/мин |
| Прочие API | 60/мин |

### Перед релизом

Обязательно пройти `project-root/docs/RELEASE_CHECKLIST.md`:
1. Сгенерировать `SECRET_KEY`
2. Настроить CORS
3. Включить HTTPS + HSTS
4. Активировать rate limiting
5. Аудит зависимостей (`safety check`, `npm audit`)
6. Настроить ротацию логов (10 МБ, 5 файлов)
7. Настроить бэкапы БД (systemd timer, 30 дней хранения)

### Инциденты

- Компрометация `SECRET_KEY`: перегенерировать, отозвать все токены, перезапустить
- Компрометация аккаунта: сбросить пароль, отозвать сессии, проверить логи

---

## Переменные окружения

### Backend (`project-root/backend/.env`)

```bash
SECRET_KEY=your-secure-secret-key-min-32-chars
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/iris
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
IRIS_LOG_LEVEL=INFO
IRIS_STORAGE_ROOT=/app/storage
OPENAI_API_KEY=sk-...
QDRANT_HOST=localhost
REDIS_URL=redis://localhost:6379/0
```

Шаблон: `project-root/backend/.env.example`.

### Frontend (`project-root/frontend/.env`)

```bash
VITE_API_URL=          # пусто = использовать Vite proxy
VITE_APP_VERSION=      # обычно задаётся через build arg APP_VERSION
```

---

## Деплой

### Docker-образы

- **Backend** (`Dockerfile.backend` в корне репозитория): multi-stage (`python:3.12-slim`), порт 8000, healthcheck `/health`, запуск `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- **Frontend** (`project-root/frontend/Dockerfile`): multi-stage (`node:20-alpine` → `nginx:alpine`), порт 80, healthcheck на `/`, копирует `nginx.conf` в `/etc/nginx/conf.d/default.conf`.

### Compose-файлы

- **`docker-compose.yml`** (корень): полный стек с PostgreSQL, Qdrant, Redis, backend, frontend, Celery worker/beat, Prometheus, Grafana.
- **`project-root/docker-compose.dev.yml`**: только PostgreSQL и Qdrant для локальной разработки.
- **`project-root/docker-compose.prod.yml`**: production с Nginx, Redis, log rotation, изолированной сетью.
- **`docker-compose.staging.yml`** (корень): staging с pre-built образами из registry.

### CI/CD (GitHub Actions)

- `ci.yml` — lint, test (unit + coverage), security-scan (Trivy + SARIF), docker-build, integration
- `integration-tests.yml` — миграции + интеграционные тесты + e2e smoke test (continue-on-error), расписание daily 02:00 UTC
- `staging-deploy.yml` — сборка образов, push в GHCR, деплой по SSH на staging, smoke-тесты
- `docs-check.yml` — проверка документации и service-locator
- `version.yml` — bump frontend версии при push в `main`

### Kubernetes

Манифесты в `project-root/k8s/`:
- Namespace `dokpotok`
- Postgres (1 replica, PVC 10 GiB), Redis (1 replica)
- Backend (3 replicas, HPA 3–10), Frontend (2 replicas, HPA 2–6)
- Ingress с TLS (Let's Encrypt), маршрутизация `/api`, `/docs`, `/openapi.json`, `/health`, `/ws` → backend
- ConfigMap и Secret с placeholder-значениями (Secret требует заполнения)

### Staging

- URL: `https://staging.iris.example.com` (placeholder, требует замены на реальный)
- Smoke-тесты после деплоя: `curl /health` и `/api/health`

---

## Известные проблемы и ограничения

### ✅ Решённые

1. **Archive API**: 500 на SQLite из-за несовместимости UUID vs INTEGER — исправлено кросс-БД типами и миграцией.
2. **`time_sessions`**: таблица существует в БД.
3. **Documents**: схема БД совпадает с моделью, работает полноценный `router.py` с `DocumentService`.
4. **Projects router**: `get_db(read_only=True)` заменено на `Depends(get_db)`.
5. **Projects/tests**: тесты обновлены под пагинированный ответ.
6. **Backend architecture test**: `scripts/check_architecture.py` проходит, обновлены `allowed_deps`.
7. **Performance**: добавлены индексы БД, устранены N+1 в analytics, настроен connection pool, добавлен `/metrics/db`.
8. **JWT hardening**: добавлены claims `iss`, `aud`, `jti`.
9. **Tenders**: Pydantic-схемы, пагинация, race condition в `update_tender_stage` исправлены через `with_for_update()`.
10. **Gamification N+1**: leaderboard переписан на JOIN-запрос.
11. **`hashed_password`**: убран из ответов API регистрации.
12. **Учёт времени на Dashboard**: добавлен endpoint `/analytics/time-tracking/team`, график «Учёт времени и качество работы» на странице аналитики и начисление бонусных points/XP при утверждении документа за скорость (до плановой даты) и качество (≤1 ревизия). `scripts/check_architecture.py` обновлён: модуль `analytics` теперь может импортировать `gamification` для кросс-доменной аналитики.

### ⚠️ Актуальные замечания и пробелы

1. **ESLint**: конфигурация `eslint.config.js` существует, но правила не заданы (пустой `rules`). `npm run lint` запускается, но практически не линтит. В файле всё ещё указано «ESLint temporarily disabled for MVP».
2. **Docker/CI пути**: 
   - `.github/actions/docker-build/action.yml` и `staging-deploy.yml` ссылаются на `Dockerfile.frontend` в корне репозитория, но такого файла нет — актуальный Dockerfile находится в `project-root/frontend/Dockerfile`.
   - Корневой `docker-compose.yml` использует `context: ./frontend` для frontend-сервиса, но директории `./frontend` в корне репозитория нет — код frontend в `project-root/frontend/`.
   - `project-root/frontend/Dockerfile` копирует `nginx.conf` из контекста сборки, но `project-root/frontend/nginx.conf` не существует. Актуальный nginx.conf: `project-root/nginx/nginx.conf`.
3. **README.md**: содержит устаревшие «известные проблемы» (Documents schema mismatch, Archive 500, time_sessions missing), которые уже решены. Требуется актуализация README отдельно.
4. **CODE_REVIEW.md (2026-06-15)**: часть рекомендаций выполнена, но остаются:
   - `data: dict` в POST/PATCH в модулях `variables`, `time_tracking`, `workflow`, `remarks`, `resources` (mass assignment риск).
   - N+1 в `resources/service.py`.
   - Отсутствие пагинации в `list_projects`, `list_documents`, `list_remarks`.
   - Router напрямую создаёт SQLAlchemy-модели в ряде модулей.
   - Расширить rate limiting на все state-changing endpoints.
   - Добавить обработку `SQLAlchemyError` в endpoints.
5. **K8s Secret**: `project-root/k8s/secret.yaml` содержит placeholder `<base64-encoded>` значения и должен быть заполнен перед деплоем.
6. **Staging URL**: `https://staging.iris.example.com` — placeholder.

### 🔄 Активные P1/P2

На данный момент активных P1/P2 проблем, блокирующих сборку или запуск, не выявлено при локальной разработке. Для production необходимо устранить placeholder'ы и несоответствия путей в Docker/CI-конфигурации.

---

## Строгие правила для AI-агентов (НЕ ИЗМЕНЯТЬ БЕЗ СОГЛАСОВАНИЯ)

### Правило №1: Адаптивность навигации и Layout
**ВСЕГДА** адаптировать показ навигационных элементов (табы, меню, кнопки) под ширину экрана **без горизонтального скроллинга**. Это строгое правило, применяется ко всем компонентам шапки, боковых панелей и любым навигационным элементам.

**Конкретные требования:**
- **< 1024px (lg)**: только иконки (с tooltip/title при наведении)
- **1024px — 1535px**: короткие подписи (`shortLabel` — макс. 10 символов)
- **≥ 1536px (2xl)**: полные тексты

**Запрещено:**
- Показывать полные длинные тексты («Производственный контроль», «Администрирование») на экранах < 1536px
- Использовать горизонтальный скроллинг для навигации
- Оставлять вкладки обрезанными (например, «Отчё...»)

**Как реализовать:**
1. У каждой навигационной ссылки ДОЛЖНЫ быть 3 варианта подписи: `label` (полный), `shortLabel` (сокращённый ≤ 10 симв.), `icon` (Lucide иконка)
2. Использовать Tailwind breakpoints: `hidden lg:inline-block 2xl:hidden` для коротких, `hidden 2xl:inline-block` для полных
3. Уменьшать `gap` и `padding` на меньших экранах: `gap-0.5 lg:gap-1 xl:gap-1.5`, `px-1 lg:px-1.5 xl:px-2`
4. При необходимости — группировать редкие пункты в dropdown «Ещё» (ellipsis menu)

**Это правило применяется ко ВСЕМ страницам и компонентам без исключений.** Если агент видит навигацию, которая не помещается — он обязан исправить её, следуя этому правилу.

---

## Контакты и поддержка

- Технический лидер: @i-minchuk
- Вопросы по архитектуре: open issue в GitHub
- Баги: open issue с тегом `bug`
- Документация: `project-root/docs/`, `DEVELOPER_GUIDE.md`, `SECURITY.md`, `RELEASE_CHECKLIST.md`
