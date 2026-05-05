# Архитектурные решения MVP

## SQLite для разработки
- Причина: скорость запуска, простота
- Риск: Archive модели используют UUID FK, SQLite projects.id = INTEGER
- Решение: Archive на frontend использует mock-данные до перехода на PostgreSQL

## Documents — известный техдолг
- Таблица создана ранее с другой схемой (старая версия)
- Модель Document в SQLAlchemy отличается от реальной таблицы
- Действие: таблица будет пересоздана при миграции на PostgreSQL

## Alembic stamp head
- Причина: таблицы созданы вручную/скриптами, Alembic не знал об этом
- Решение: `alembic stamp head` для синхронизации версий
- Дата: 2026-05-04

## JWT Authentication
- Решение: JWT access + refresh токены
- Хранение: localStorage на frontend
- WebSocket auth: JWT через query параметр

## Модульная структура

```
backend/app/modules/
├── auth/
├── projects/
├── tasks/
├── remarks/
├── documents/
├── archive/
└── analytics/
```

Каждый модуль содержит:
- `router.py` — API endpoints
- `models.py` — SQLAlchemy модели
- `schemas.py` — Pydantic схемы
- `service.py` — бизнес-логика

## Frontend архитектура

```
frontend/src/
├── features/       # Feature-based модули
├── pages/          # Страницы маршрутизации
├── shared/         # Общие компоненты и hooks
├── api/            # API клиенты
└── types/          # TypeScript типы
```

## Real-time Collaboration

- **WebSocket**: `/ws` endpoint
- **Auth**: JWT через query параметр
- **Messages**: presence_update, subscribe_document, unsubscribe_document, ping
- **ConnectionManager**: in-memory tracking

## Gamification

- **Points**: начисляются за действия (закрытие замечаний, завершение задач)
- **Levels**: на основе накопленных очков
- **Leaderboard**: топ сотрудников

## Дата: 2026-05-04