# Быстрый старт для разработки

## Проблема
PostgreSQL не запущен, поэтому регистрация и вход не работают.

## Решение 1: Запустить PostgreSQL через Docker (рекомендуется)

### Шаг 1: Установите Docker Desktop
Скачайте с: https://www.docker.com/products/docker-desktop

### Шаг 2: Запустите PostgreSQL
```bash
cd project-root
docker compose -f docker-compose.prod.yml up -d db
```

### Шаг 3: Примените миграции
```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Шаг 4: Создайте тестового пользователя
```bash
docker compose -f docker-compose.prod.yml exec backend \
  python -c "
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.db.session import AsyncSessionLocal
import asyncio

async def create_user():
    async with AsyncSessionLocal() as db:
        repo = UserRepository(db)
        user = await repo.create(UserCreate(
            email='test@example.com',
            password='test123',
            full_name='Test User'
        ))
        print(f'User created: {user.email}')

asyncio.run(create_user())
"
```

### Шаг 5: Запустите приложения
```bash
# Backend (в новом терминале)
cd project-root/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (в новом терминале)
cd project-root/frontend
npm run dev
```

---

## Решение 2: Использовать SQLite для быстрой разработки (без Docker)

### Шаг 1: Измените DATABASE_URL в .env
```bash
# backend/.env
DATABASE_URL=sqlite+aiosqlite:///./iris.db
```

### Шаг 2: Установите aiosqlite
```bash
cd backend
pip install aiosqlite
```

### Шаг 3: Создайте таблицы
```bash
cd backend
python -c "
from app.db.base import Base
from app.db.session import engine
import asyncio
from sqlalchemy import text

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Database created!')

asyncio.run(init_db())
"
```

### Шаг 4: Создайте тестового пользователя
```bash
cd backend
python -c "
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.db.session import AsyncSessionLocal
import asyncio

async def create_user():
    async with AsyncSessionLocal() as db:
        repo = UserRepository(db)
        user = await repo.create(UserCreate(
            email='test@example.com',
            password='test123',
            full_name='Test User'
        ))
        print(f'User created: {user.email}')
        print(f'Username: testuser')
        print(f'Password: test123')

asyncio.run(create_user())
"
```

### Шаг 5: Запустите приложения
```bash
# Backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (в новом терминале)
cd frontend
npm run dev
```

---

## Тестовые данные для входа

После создания пользователя используйте:

### Вариант 1: Вход по Email
- **Email**: `test@example.com`
- **Пароль**: `test123`

### Вариант 2: Вход по Логину
- **Логин**: `testuser` (если создан)
- **Пароль**: `test123`

---

## URL приложений

| Приложение | URL |
|------------|-----|
| Frontend UI | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

## Проверка работы

### 1. Проверьте health endpoint
```bash
curl http://localhost:8000/health
# Ожидаемый ответ: {"status":"ok","service":"DokPotok IRIS","version":"1.0.0"}
```

### 2. Проверьте регистрацию
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"password123","full_name":"New User"}'
```

### 3. Проверьте вход
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## Устранение проблем

### Ошибка подключения к БД
```
asyncpg.exceptions.ConnectionRefusedError
```
**Решение**: Убедитесь, что PostgreSQL запущен или используйте SQLite.

### Ошибка модуля
```
ModuleNotFoundError: No module named 'aiosqlite'
```
**Решение**: `pip install aiosqlite`

### Frontend не загружается
```
Port 5173 is already in use
```
**Решение**: `npm run dev -- --port 5174`

---

**Дата**: 2024  
**Статус**: Инструкция готова
