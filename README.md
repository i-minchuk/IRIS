# ДокПоток IRIS v4.9.0 MVP

[![Regression UI](https://github.com/i-minchuk/IRIS/actions/workflows/regression.yml/badge.svg)](https://github.com/i-minchuk/IRIS/actions/workflows/regression.yml)

Система управления технической документацией: проекты, документы, тендеры,
замечания, задачи, документооборот с дедлайнами и геймификацией.

**Новое в 4.9.0** (подробности — [CHANGELOG](project-root/CHANGELOG.md)):
- Документооборот: запуск маршрутов из карточки документа, сценарии
  маршрутизации с автоподбором шаблона, автозапуск при создании документа.
- Дедлайны согласования: напоминания за 24 ч, эскалация при просрочке,
  страница «Мои задачи», обзор дедлайнов и виджет для руководителей.
- Геймификация: +10 XP за согласование в срок, +25 XP за отправку маршрута
  в срок, бейдж «Точный в срок», статистика в «Достижениях» и лидерборде.
- Устранены заглушки аналитики, отчётов, тендеров, уведомлений (email/Telegram).

## Быстрый старт (SQLite)

```bash
cd project-root/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

cd project-root/frontend
npm run dev
```

## Режимы работы (demo / prod)

Режим выбирается переменной окружения `MODE` (дефолт: `prod`), код не меняется:

```bash
# Демо для заказчика: вымышленные данные, экспорты/интеграции отключены
MODE=demo python -m uvicorn app.main:app --port 8000

# Рабочий режим для тестовой группы: полный функционал, логи в файл, метрики
MODE=prod python -m uvicorn app.main:app --port 8000
```

Windows: `scripts/СТАРТ.bat` (prod) и `scripts/СТАРТ_ДЕМО.bat` (demo).

Документация: `project-root/docs/DEMO_GUIDE.md` (сценарий презентации),
`project-root/docs/PILOT_CHECKLIST.md` (запуск тестовой группы),
`project-root/docs/DATA_LOADING.md` (демо-данные и загрузка реальных).

Проверка режима: `GET /api/v1/meta` → `{mode, version, features}`;
smoke-скрипт `project-root/backend/scripts/smoke_modes.py`.

## Доступ

- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Демо-вход (режим demo): demo@iris.local / demo1234

## Переход на PostgreSQL

См. docs/MIGRATION_TO_POSTGRES.md

# ДокПоток IRIS — QA suite

BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
DEMO_LOGIN=admin
DEMO_PASSWORD=your_password
HEADLESS=1
SLOW_MO=0