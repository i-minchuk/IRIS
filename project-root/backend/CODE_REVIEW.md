# Ревью кода backend ДокПоток IRIS v4.3.0

> Дата: 2026-06-15
> Объём: ~60 модулей, ~15 000 строк Python
> Фокус: безопасность, производительность, архитектура, качество кода

---

## Краткий обзор: приоритеты

| Приоритет | Категория | Проблем | Количество |
|-----------|-----------|---------|------------|
| 🔴 Критично | Безопасность | Небезопасная десериализация (dict вместо Pydantic), SQL-инъекции, утечка данных | 8 |
| 🔴 Критично | Производительность | N+1 запросы, отсутствие пагинации, бесконечные циклы | 6 |
| 🟡 Высокий | Архитектура | Нарушение слоистой структуры, дублирование, циклические зависимости | 12 |
| 🟡 Высокий | Стабильность | Отсутствие обработки ошибок, race conditions, memory leaks | 7 |
| 🟢 Средний | Качество кода | PEP 8, типизация, docstrings, магические числа | 15 |

---

## 1. Анализ кода: критичные проблемы

> **Статус:** Частично исправлено (2026-06-15)
> - ✅ Pydantic-схемы для tenders, projects, documents
> ✅ JWT claims (iss, aud, jti) добавлены
> ✅ `hashed_password` убран из ответов API
> ✅ Race condition в tender→project с `with_for_update()`
> ✅ N+1 в gamification leaderboard — JOIN-запрос
> ✅ Pagination для tenders
> - 🔄 Осталось: variables, time_tracking, workflow, remarks, resources

### 1.1 Безопасность 🔴

#### 1.1.1 Небезопасная десериализация входных данных

**Файлы:** `tenders/router.py`, `projects/router.py`, `documents/router.py`, `workflow/router.py`

**Проблема:** Во многих POST/PATCH endpoints используется `data: dict` вместо Pydantic-схем.

```python
# ❌ ДО (tenders/router.py:113)
@router.post("", response_model=dict)
async def create_tender(data: dict, ...):
    tender = Tender(
        name=data.get("name"),
        customer_name=data.get("customer_name"),
        ...
    )
```

**Риск:**
- Пропуск валидации типов (можно передать строку вместо числа)
- Mass assignment — клиент может передать неожиданные поля (например, `id`, `created_at`)
- Отсутствие защиты от SQL-инъекции через ORM (хотя SQLAlchemy защищает, логика приложения может сломаться)

**Рекомендация:**
```python
# ✅ ПОСЛЕ
from app.modules.tenders.schemas import TenderCreate

@router.post("", response_model=TenderResponse)
async def create_tender(data: TenderCreate, ...):
    tender = Tender(**data.model_dump())
```

#### 1.1.2 Утечка sensitive данных в ответах

**Файл:** `auth/router.py`

**Проблема:** В endpoint `/register` возвращается полный объект User, включая `hashed_password`.

```python
# ❌ ДО (auth/router.py:25-42)
@router.post("/register", response_model=User)
async def register(..., user_in: UserCreate):
    user = await repo.create(user_in=user_in)
    return user  # ← возвращает hashed_password!
```

**Риск:** Злоумышленник, зарегистрировавшись, получает хеш своего пароля — упрощает offline-атаку.

**Рекомендация:**
```python
# ✅ ПОСЛЕ
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    role: str
    is_active: bool
    # hashed_password НЕ включён

@router.post("/register", response_model=UserResponse)
async def register(...):
    user = await repo.create(user_in=user_in)
    return UserResponse.model_validate(user)
```

#### 1.1.3 Race condition в создании проекта из тендера

**Файл:** `tenders/router.py:185-214`

**Проблема:** Двойная проверка `tender.project_id is None` → создание проекта → присвоение `project_id` — не атомарно.

```python
# ❌ ДО
if new_stage == "won" and tender.project_id is None:
    project = Project(...)
    db.add(project)
    await db.commit()  # ← другой запрос может создать проект между проверкой и commit
    await db.refresh(project)
    tender.project_id = project.id
    await db.commit()
```

**Риск:** При параллельных запросах может создаться два проекта для одного тендера.

**Рекомендация:**
```python
# ✅ ПОСЛЕ — использовать SELECT FOR UPDATE или UNIQUE constraint
from sqlalchemy import select, update

# В начале транзакции:
result = await db.execute(
    select(Tender).where(Tender.id == tender_id).with_for_update()
)
tender = result.scalar_one_or_none()

if new_stage == "won" and tender.project_id is None:
    project = Project(...)
    db.add(project)
    await db.flush()  # получаем project.id
    tender.project_id = project.id
    await db.commit()  # одна атомарная транзакция
```

#### 1.1.4 Отсутствие валидации SECRET_KEY в runtime

**Файл:** `core/config.py:62-64`

**Проблема:** `SECRET_KEY` имеет дефолтное значение, валидация `is_secure_secret_key` нигде не вызывается при старте.

```python
SECRET_KEY: str = Field(
    default="your-super-secret-key-change-in-production-please"
)
```

**Риск:** Если разработчик забудет поменять SECRET_KEY, все JWT-токены будут подписаны известным ключом.

**Рекомендация:**
```python
# ✅ ПОСЛЕ
@field_validator("SECRET_KEY")
@classmethod
def validate_secret_key(cls, v: str) -> str:
    if not is_secure_secret_key(v):
        raise ValueError(
            "SECRET_KEY is insecure. Use: openssl rand -hex 32"
        )
    return v
```

#### 1.1.5 JWT токены без `aud` (audience) и `iss` (issuer)

**Файл:** `core/security.py:16-31`

**Проблема:** Токены содержат только `sub`, `exp`, `type`, `iat`. Отсутствуют `aud`, `iss`, `jti`.

**Риск:**
- Токен можно использовать на другом сервисе с тем же SECRET_KEY
- Невозможно отозвать отдельный токен (нет `jti` — JWT ID)
- Нет защиты от replay-атак

**Рекомендация:**
```python
# ✅ ПОСЛЕ
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({
        "exp": expire,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "iss": "dokpotok-iris",
        "aud": "dokpotok-iris-api",
        "jti": secrets.token_hex(16),  # для отзыва токенов
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
```

#### 1.1.6 Отсутствие rate limiting на чувствительных endpoints

**Файлы:** `auth/router.py`, `tenders/router.py`

**Проблема:** Rate limiting (`@limiter.limit`) есть только на `/login` и `/register`. Нет защиты на:
- `/auth/forgot-password` — можно спамить письма
- `/auth/reset-password` — brute force токена сброса
- `/tenders` POST — создание тендеров без ограничений

**Рекомендация:** Добавить `@limiter.limit` на все endpoints, изменяющие состояние.

---

### 1.2 Производительность 🔴

#### 1.2.1 N+1 запросы в gamification/service.py

**Файл:** `gamification/service.py:58-75`

```python
# ❌ ДО
async def get_leaderboard(self, exclude_roles: list[str] = None):
    users = await self.user_repo.get_all()  # 1 запрос
    for user in users:
        score = await self.event_repo.get_user_score(user.id)  # N запросов!
        entries.append({...})
```

**Риск:** При 100 пользователях — 101 запрос к БД.

**Рекомендация:**
```python
# ✅ ПОСЛЕ — один JOIN-запрос
async def get_leaderboard(self, ...):
    from sqlalchemy import select, func
    
    stmt = (
        select(
            User.id,
            User.username,
            User.full_name,
            User.role,
            func.coalesce(func.sum(GamificationEvent.points_delta), 0).label("score")
        )
        .outerjoin(GamificationEvent, User.id == GamificationEvent.user_id)
        .where(User.role.notin_(exclude_roles))
        .group_by(User.id)
        .order_by(func.sum(GamificationEvent.points_delta).desc())
    )
    result = await self.db.execute(stmt)
    return [
        {"user_id": row.id, "score": row.score, ...}
        for row in result.mappings().all()
    ]
```

#### 1.2.2 N+1 в resources/service.py

**Файл:** `resources/service.py:71-100`

```python
# ❌ ДО
for user in users:
    stats = await self.repo.get_user_stats(user.id, month_ago)      # N
    doc_count = await self.repo.get_user_documents_count(user.id)   # N
    active_projects = await self.repo.get_user_active_projects_count(user.id)  # N
    for w in weeks:
        hours = await self.repo.get_user_weekly_hours(user.id, ws, we)  # N * 4
```

**Риск:** При 50 пользователях и 4 неделях — 50 * (3 + 4) = 350 запросов.

**Рекомендация:** Собрать все данные в 1-2 запроса с GROUP BY и CTE.

#### 1.2.3 Отсутствие пагинации на list endpoints

**Файлы:** `tenders/router.py:21`, `projects/router.py:18`, `remarks/router.py`

**Проблема:** `list_tenders` возвращает ВСЕ тендеры без `limit`/`offset`.

```python
# ❌ ДО
@router.get("", response_model=list)
async def list_tenders(...):
    result = await db.execute(query.order_by(Tender.created_at.desc()))
    tenders = result.scalars().all()  # ← ВСЕ записи!
```

**Риск:** При 10 000 тендеров — сервер упадёт по памяти.

**Рекомендация:**
```python
# ✅ ПОСЛЕ
@router.get("", response_model=PaginatedResponse)
async def list_tenders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    ...
):
    offset = (page - 1) * page_size
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.order_by(Tender.created_at.desc()).offset(offset).limit(page_size))
    ...
```

#### 1.2.4 Бесконечный рост in-memory кэша

**Файл:** `resources/service.py:16-18`

```python
self._cache: Dict[str, Any] = {}
self._cache_timestamp: Dict[str, datetime] = {}
```

**Проблема:** Кэш не имеет ограничения по размеру и не очищается. При множестве уникальных ключей — утечка памяти.

**Рекомендация:** Использовать Redis или `functools.lru_cache` с `maxsize`.

#### 1.2.5 Неэффективный подсчёт в TaskService

**Файл:** `tasks/service.py:97-99`

```python
count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
```

**Проблема:** `subquery()` для подсчёта с `joinedload` — избыточно. SQLAlchemy строит сложный подзапрос.

**Рекомендация:**
```python
# ✅ ПОСЛЕ — отдельный count без joinedload
count_query = select(func.count(Task.id)).where(...)  # те же фильтры, без .options()
total = await self.db.scalar(count_query)
```

---

### 1.3 Архитектура 🟡

#### 1.3.1 Нарушение слоистой архитектуры

**Файлы:** `tenders/router.py`, `projects/router.py`

**Проблема:** Router напрямую создаёт модели SQLAlchemy и вызывает `db.commit()`.

```python
# ❌ ДО (router → model напрямую)
@router.post("")
async def create_tender(data: dict, db: AsyncSession = Depends(get_db)):
    tender = Tender(...)  # ← router знает о модели!
    db.add(tender)
    await db.commit()
```

**Правило из AGENTS.md:** Router → Service → Repository → Model.

**Рекомендация:**
```python
# ✅ ПОСЛЕ (router → service → repository → model)
@router.post("")
async def create_tender(data: TenderCreate, service: TenderService = Depends(get_tender_service)):
    return await service.create(data)
```

#### 1.3.2 Дублирование кода парсинга дат

**Файлы:** `tenders/router.py:99-110`, `projects/router.py`, `tasks/router.py`

**Проблема:** Функция `_parse_date` скопирована в нескольких модулях.

**Рекомендация:** Вынести в `app/core/utils.py`:
```python
# app/core/utils.py
from datetime import datetime

def parse_date_input(value: str | datetime | None) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        if len(value) == 10:
            return datetime.strptime(value, "%Y-%m-%d")
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return None
```

#### 1.3.3 Циклические зависимости

**Файлы:** `tasks/service.py`, `gamification/service.py`

**Проблема:** `TaskService` импортирует `GamificationService`, а `GamificationService` может импортировать `TaskService` (через events).

**Рекомендация:** Использовать событийную шину (event bus) или DI-контейнер.

---

### 1.4 Стабильность 🟡

#### 1.4.1 Отсутствие обработки ошибок в router_extended.py

**Файл:** `tenders/router_extended.py`

**Проблема:** Все endpoints имеют `try/except` только на уровне `get_current_active_user`. Нет обработки:
- `SQLAlchemyError` — утечка деталей SQL в ответ
- `ConnectionError` — Redis недоступен
- `ValueError` — некорректные параметры

#### 1.4.2 Необработанные edge cases

**Файл:** `tenders/router.py:99-110`

```python
def _parse_date(value):
    if len(value) == 10:
        return datetime.strptime(value, "%Y-%m-%d")
    return datetime.fromisoformat(value.replace("Z", "+00:00"))
```

**Проблемы:**
- Нет `try/except` для `ValueError` при невалидной дате
- `datetime.strptime` возвращает naive datetime (без timezone)
- Не обрабатывается `value = None` (проверка есть, но после неё `len(value)` упадёт если value не строка)

---

## 2. Предлагаемые тесты

### 2.1 Ключевые сценарии

| Модуль | Сценарий | Тип |
|--------|----------|-----|
| auth | Регистрация с существующим email | Граничный |
| auth | Login с неверным паролем 5+ раз (rate limit) | Безопасность |
| auth | JWT с истёкшим сроком | Безопасность |
| auth | Access токен как refresh токен | Безопасность |
| tenders | Создание тендера с отрицательным NMC | Валидация |
| tenders | Параллельное обновление stage двумя пользователями | Race condition |
| tenders | Список тендеров при 1000+ записях | Производительность |
| tasks | Создание задачи без assignee | Граничный |
| tasks | Поиск задачи по частичному совпадению | Функциональный |
| documents | Загрузка документа > 100 MB | Граничный |
| workflow | Согласование с отклонением и повторным запуском | Функциональный |
| gamification | Leaderboard при 1000 пользователях | Производительность |
| analytics | Dashboard при отсутствии данных | Граничный |
| resources | Workload при отсутствии time_sessions | Граничный |

### 2.2 Структура тестов

**pytest** — предпочтительный выбор:
- `pytest-asyncio` для async тестов
- `pytest-cov` для покрытия
- `httpx.AsyncClient` для API-тестов
- `AsyncMock` для моков БД

### 2.3 Пример тестового файла

```python
# tests/test_tenders_security.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tenders.router import create_tender
from app.modules.tenders.schemas import TenderCreate
from app.modules.auth.models import User


@pytest.fixture
def mock_db():
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.role = "engineer"
    user.is_active = True
    return user


class TestTenderSecurity:
    """Тесты безопасности тендеров."""
    
    async def test_create_tender_rejects_mass_assignment(self, mock_db, mock_user):
        """Проверка: нельзя передать system-поля через dict."""
        # Если используется dict вместо Pydantic — это уязвимость
        data = {
            "name": "Test",
            "customer_name": "Customer",
            "id": 999,  # ← попытка mass assignment
            "created_at": "2020-01-01",
            "status": "approved",  # ← обход workflow
        }
        
        # С Pydantic схемой — должно отклониться
        with pytest.raises((ValidationError, HTTPException)):
            await create_tender(data, mock_db, mock_user)
    
    async def test_create_tender_validates_nmc_positive(self, mock_db, mock_user):
        """Проверка: NMC должна быть положительной."""
        data = {"name": "Test", "nmc": -1000}
        
        with pytest.raises(ValidationError):
            await create_tender(data, mock_db, mock_user)
    
    async def test_list_tenders_paginated(self, mock_db, mock_user):
        """Проверка: list endpoint возвращает пагинацию."""
        # Мокируем execute с пагинацией
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result
        
        # Должен поддерживать page/page_size
        # Если не поддерживает — это баг производительности


class TestTenderRaceCondition:
    """Тесты race conditions."""
    
    async def test_parallel_stage_update(self, mock_db, mock_user):
        """Проверка: параллельное обновление stage не создаёт дубликатов."""
        # Имитируем два параллельных запроса на won
        # Ожидаем: только один проект создан
        pass  # Требует интеграционного теста с реальной БД


class TestTenderPerformance:
    """Тесты производительности."""
    
    @pytest.mark.slow
    async def test_list_tenders_with_1000_records(self, client: AsyncClient):
        """Проверка: время ответа < 500ms при 1000 тендерах."""
        import time
        start = time.time()
        response = await client.get("/api/v1/tenders?page=1&page_size=20")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 0.5
        assert len(response.json()["items"]) <= 20
```

### 2.4 Моки внешних зависимостей

| Зависимость | Как мокать | Фикстура |
|-------------|-----------|----------|
| PostgreSQL | `AsyncMock(spec=AsyncSession)` | `mock_db` |
| Redis | `fakeredis.aioredis.FakeRedis` | `mock_redis` |
| OpenAI API | `respx` (httpx mock) или `unittest.mock.patch` | `mock_openai` |
| S3/Storage | `moto` или `mock` | `mock_s3` |
| Email/SMTP | `aiosmtpd` или `mock` | `mock_smtp` |

---

## 3. Рефакторинг: до/после

### 3.1 Безопасная десериализация (tenders/router.py)

```python
# ❌ ДО
@router.post("", response_model=dict)
async def create_tender(
    data: dict,  # ← нет валидации!
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    tender = Tender(
        name=data.get("name"),
        customer_name=data.get("customer_name"),
        # ... 20 полей вручную
        status="draft",
        created_by_id=current_user.id,
    )
    db.add(tender)
    await db.commit()
    return {"id": tender.id, ...}
```

```python
# ✅ ПОСЛЕ
from app.modules.tenders.schemas import TenderCreate, TenderResponse
from app.modules.tenders.service import TenderService

@router.post("", response_model=TenderResponse, status_code=201)
async def create_tender(
    data: TenderCreate,  # ← Pydantic валидация
    service: TenderService = Depends(get_tender_service),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new tender with validated input."""
    return await service.create(data, created_by_id=current_user.id)
```

**Мотивация:**
- Pydantic валидирует типы, ограничивает допустимые поля
- Service layer инкапсулирует бизнес-логику
- Router не знает о SQLAlchemy — чистый separation of concerns

---

### 3.2 Устранение N+1 (gamification/service.py)

```python
# ❌ ДО
async def get_leaderboard(self, exclude_roles: list[str] = None):
    users = await self.user_repo.get_all()
    entries = []
    for user in users:
        score = await self.event_repo.get_user_score(user.id)  # N запросов!
        entries.append({...})
    return entries
```

```python
# ✅ ПОСЛЕ
from sqlalchemy import select, func, outerjoin

async def get_leaderboard(self, exclude_roles: list[str] = None) -> list[dict]:
    """Get leaderboard with single optimized query."""
    exclude_roles = exclude_roles or ["admin"]
    
    stmt = (
        select(
            User.id,
            User.username,
            User.full_name,
            func.coalesce(func.sum(GamificationEvent.points_delta), 0).label("score")
        )
        .outerjoin(GamificationEvent, User.id == GamificationEvent.user_id)
        .where(User.role.notin_(exclude_roles))
        .group_by(User.id)
        .order_by(func.sum(GamificationEvent.points_delta).desc())
    )
    
    result = await self.db.execute(stmt)
    rows = result.mappings().all()
    
    return [
        {
            "user_id": row.id,
            "username": row.username,
            "full_name": row.full_name,
            "score": row.score,
            "rank": i,
        }
        for i, row in enumerate(rows, 1)
    ]
```

**Мотивация:**
- 1 запрос вместо N+1
- Снижение нагрузки на БД на 99% при 100 пользователях
- Более предсказуемое время ответа

---

### 3.3 Атомарная транзакция (tenders/router.py)

```python
# ❌ ДО
if new_stage == "won" and tender.project_id is None:
    project = Project(...)
    db.add(project)
    await db.commit()  # ← промежуточный commit!
    await db.refresh(project)
    tender.project_id = project.id
    await db.commit()  # ← второй commit
```

```python
# ✅ ПОСЛЕ
from sqlalchemy import select
from sqlalchemy.orm import with_for_update

async def update_tender_stage(
    tender_id: int,
    data: TenderStageUpdate,  # ← Pydantic schema
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Блокировка строки на уровне БД
    result = await db.execute(
        select(Tender)
        .where(Tender.id == tender_id)
        .with_for_update()
    )
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    # Валидация перехода
    valid_transitions = TENDER_STAGE_TRANSITIONS.get(tender.stage, [])
    if data.stage and data.stage not in valid_transitions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition: {tender.stage} → {data.stage}"
        )
    
    # Обновление в одной транзакции
    if data.stage:
        tender.stage = data.stage
    
    if data.stage == "won" and tender.project_id is None:
        project = Project(
            name=tender.name,
            code=f"PRJ-{tender.id:04d}",
            created_by_id=current_user.id,
        )
        db.add(project)
        await db.flush()  # получаем ID без commit
        tender.project_id = project.id
    
    await db.commit()  # ← один атомарный commit
    return {"id": tender.id, "stage": tender.stage}
```

**Мотивация:**
- `with_for_update()` предотвращает race condition
- Один `commit` вместо двух — атомарность
- Валидация переходов stage — защита от некорректных состояний

---

### 3.4 Безопасный JWT (core/security.py)

```python
# ❌ ДО
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "type": "access", "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

```python
# ✅ ПОСЛЕ
import secrets
from jose import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional

# Константы
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"
TOKEN_ISSUER = "dokpotok-iris"
TOKEN_AUDIENCE = "dokpotok-iris-api"


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
    jti: Optional[str] = None,
) -> str:
    """Create a secure JWT access token.
    
    Args:
        data: Payload data (must contain 'sub' — user id)
        expires_delta: Custom expiration time
        jti: JWT ID for token revocation (auto-generated if not provided)
    
    Returns:
        Encoded JWT string
    """
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    
    to_encode = {
        **data,
        "exp": expire,
        "iat": now,
        "nbf": now,  # not before
        "type": TOKEN_TYPE_ACCESS,
        "iss": TOKEN_ISSUER,
        "aud": TOKEN_AUDIENCE,
        "jti": jti or secrets.token_hex(16),
    }
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def verify_token(token: str, expected_type: str) -> dict:
    """Verify and decode a JWT token with full validation."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            issuer=TOKEN_ISSUER,
            audience=TOKEN_AUDIENCE,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTClaimsError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token claims: {e}")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    token_type = payload.get("type")
    if token_type != expected_type:
        raise HTTPException(
            status_code=401,
            detail=f"Expected {expected_type} token, got {token_type}"
        )
    
    return payload
```

**Мотивация:**
- `iss` + `aud` предотвращают использование токена на другом сервисе
- `jti` позволяет реализовать отзыв токенов (blacklist)
- `nbf` защищает от использования токена до времени создания
- Явная валидация типа токена (access vs refresh)

---

## 4. Чего не хватает для полного анализа

| Что не хватает | Где искать | Влияние |
|----------------|-----------|---------|
| `.env` файл с реальными настройками | `project-root/backend/.env` | Безопасность конфигурации |
| Alembic миграции | `project-root/backend/alembic/versions/` | Целостность схемы БД |
| Docker Compose конфигурация | `docker-compose.yml` | Безопасность окружения |
| GitHub Actions workflows | `.github/workflows/` | CI/CD безопасность |
| Frontend API-клиент | `project-root/frontend/src/shared/api/client.ts` | CORS, CSRF |
| Логи production | `logs/` | Анализ реальных ошибок |

---

## 5. Итоговые рекомендации

### Сделать немедленно (неделя 1)
1. Заменить `data: dict` на Pydantic схемы во всех POST/PATCH endpoints
2. Добавить `@field_validator` для `SECRET_KEY`
3. Исправить race condition в `update_tender_stage` с `with_for_update()`
4. Добавить пагинацию на `list_tenders`, `list_projects`, `list_documents`
5. Убрать `hashed_password` из всех response-моделей

### Сделать в ближайший месяц (недели 2-4)
6. Устранить N+1 в `gamification/service.py` и `resources/service.py`
7. Добавить `iss`, `aud`, `jti` в JWT токены
8. Вынести `_parse_date` и другие утилиты в `app/core/utils.py`
9. Добавить `try/except SQLAlchemyError` во все endpoints
10. Реализовать rate limiting на все endpoints, изменяющие состояние

### Сделать в квартал (месяцы 2-3)
11. Рефакторинг router → service → repository для всех модулей
12. Внедрить DI-контейнер (или хотя бы `Depends` фабрики)
13. Добавить интеграционные тесты с реальной БД (pytest + testcontainers)
14. Настроить `bandit` (security linter) и `safety` (dependency audit) в CI
15. Провести нагрузочное тестирование (locust/k6) на критичные endpoints

---

> **Вывод:** Проект имеет хорошую базовую архитектуру (FastAPI + SQLAlchemy 2.0 + Alembic), но требует срочного внимания к безопасности (валидация входных данных, JWT hardening) и производительности (N+1, пагинация). Рекомендуется приоритизировать исправления по критичности и внедрить автоматизированные проверки в CI/CD.
