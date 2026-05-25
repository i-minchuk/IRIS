# Модуль: Database (База данных)

## Назначение
Async SQLAlchemy 2.0, Alembic миграции, seed-данные.

## Файлы
```
backend/app/db/
  base.py      # DeclarativeBase
  session.py   # async_engine, AsyncSessionLocal, get_db
  seed.py      # Seed demo data (3 users, 3 projects, 3 documents)
  seed_all.py  # Расширенный seed

backend/alembic/
  env.py       # Async Alembic config
  versions/    # Миграции
```

## Поддержка БД
- **SQLite**: `sqlite+aiosqlite`, `check_same_thread=False`, без пулинга
- **PostgreSQL**: `postgresql+asyncpg`, `pool_size`, `max_overflow`, `pool_timeout`, `pool_recycle`

## Миграции
- `bb738b9eb80a_initial_schema.py` — каноническая начальная миграция (~35 таблиц)
- `6bb361a0f4ae_create_all_tables_from_models.py` — дублирующая миграция (осторожно!)
- Docker: `alembic upgrade head` при старте контейнера

## Seed данные
- 3 пользователя: `admin`/`admin123`, `engineer`/`engineer123`, `reviewer`/`reviewer123`
- 3 проекта, 3 документа, замечания, тендеры

## Known Issues
1. **Две миграции создают одни и те же таблицы** — требует ручного управления историей Alembic
2. **Task модель** содержит merge conflict markers (исправлено)
3. **SQLite ↔ PostgreSQL**: `Remark.created_at` — String в модели, DateTime в миграциях
4. **AI таблицы** (`ai_documents`, `ai_chunks`, `ai_interactions`) — только в raw SQL (`app/db/migrations/001_add_ai_tables.sql`), не в Alembic

## Правила параллельной разработки
- Всегда создавать миграцию: `alembic revision --autogenerate -m "desc"`
- Тестировать на **SQLite** (быстро) и **PostgreSQL** (production)
- **НЕ удалять** существующие миграции
- Новые модели — регистрировать в `app/models/__init__.py`
