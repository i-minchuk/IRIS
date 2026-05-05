# Переход на PostgreSQL

## Предварительные требования

- PostgreSQL 15+
- pgAdmin или другой SQL клиент (опционально)
- Docker Desktop (для быстрого запуска)

## Быстрый старт PostgreSQL

### Вариант 1: Docker (рекомендуется)

```bash
# В корне проекта
docker-compose up -d db

# Проверка
docker-compose ps
```

### Вариант 2: Локальная установка

Скачать с https://www.postgresql.org/download/

## Настройка подключения

1. Скопировать `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Изменить `DATABASE_URL` в `.env`:
```
DATABASE_URL=postgresql://iris:iris_pass@localhost:5432/iris_dev
```

3. Создать базу данных:
```bash
# Через psql
createdb -U postgres iris_dev

# Или через SQL
CREATE DATABASE iris_dev OWNER iris;
```

## Миграция данных

### Шаг 1: Экспорт из SQLite

```bash
cd backend
python export_sqlite_to_json.py
```

### Шаг 2: Применить Alembic миграции

```bash
# Синхронизировать версию Alembic
alembic stamp head

# Или создать новые миграции
alembic revision --autogenerate -m "Initial PostgreSQL schema"
alembic upgrade head
```

### Шаг 3: Импорт данных

```bash
python import_from_json.py
```

## Проверка

```bash
# Проверить подключение
python test_pg_connection.py

# Запустить seed data
python seed_all.py
```

## Откат

Если что-то пошло не так:

```bash
# Переключиться на SQLite
git checkout mvp-sqlite-stable

# Или изменить DATABASE_URL обратно на SQLite
DATABASE_URL=sqlite:///iris_dev.db
```
