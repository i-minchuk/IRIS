# Модульная архитектура DokPotok IRIS - Анализ и рекомендации

## 📊 Текущее состояние

### Backend структура

```
backend/app/modules/
├── auth/           ✅ Хорошо изолирован
│   ├── api.py
│   ├── cookies.py
│   ├── deps.py
│   ├── dto.py
│   ├── models.py
│   ├── repository.py
│   ├── router.py
│   ├── schemas.py
│   └── service.py
├── documents/      ⚠️ Частично соответствует
│   ├── dependencies.py
│   ├── models.py
│   ├── router.py
│   ├── schemas.py
│   └── variable_engine.py
├── projects/       ⚠️ Требует доработки
│   ├── api.py
│   ├── dto.py
│   ├── models.py
│   ├── repository.py
│   ├── router.py
│   └── service.py
├── collaboration/  ✅ Хорошо изолирован
├── analytics/      ❓ Не проверено
├── gamification/   ❓ Не проверено
├── resources/      ❓ Не проверено
├── tasks/          ❓ Не проверено
├── tenders/        ❓ Не проверено
├── time_tracking/  ❓ Не проверено
├── variables/      ❓ Не проверено
└── core/           ✅ Общие утилиты
```

## ✅ Что реализовано правильно

### 1. Модуль `auth` - эталонная изоляция

**Плюсы:**
- ✅ Полная инкапсуляция: `models.py`, `schemas.py`, `repository.py`, `service.py`, `router.py`
- ✅ Собственные зависимости через `deps.py`
- ✅ DTO разделение (`dto.py`)
- ✅ Cookies логика вынесена в `cookies.py`
- ✅ Нет прямых импортов из других модулей (кроме `core`)

**Пример правильной структуры:**
```python
# router.py - только HTTP handlers
from app.modules.auth.schemas import User, Token
from app.modules.auth.repository import UserRepository
from app.modules.auth.deps import get_current_active_user

@router.post("/login")
async def login(...):
    repo = UserRepository(db)  # Свой репозиторий
    user = await repo.get_by_email(...)  # Свой модель
```

### 2. Модуль `collaboration` - хорошая изоляция

**Плюсы:**
- ✅ Собственный `ws_manager.py` для управления подключениями
- ✅ Схемы сообщений в `schemas.py`
- ✅ WebSocket логика изолирована
- ✅ Использует `auth.models.User` (допустимая зависимость)
- ✅ Использует `documents.models.Document` (допустимая зависимость)

## ⚠️ Проблемы и рекомендации

### 1. Модуль `documents` - отсутствует репозиторий

**Проблема:**
```
documents/
├── dependencies.py  # Смешивает логику
├── models.py
├── router.py
├── schemas.py
└── variable_engine.py  # Бизнес-логика в модуле
```

**Рекомендация:**
```
documents/
├── models.py
├── schemas.py
├── repository.py      # ⬅️ Добавить
├── service.py         # ⬅️ Добавить
├── router.py
├── dependencies.py    # ⬅️ Упростить
└── variable_engine.py # ⬅️ Оставить (специфичная логика)
```

**Действия:**
```python
# backend/app/modules/documents/repository.py
class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, id: int) -> Optional[Document]:
        result = await self.db.execute(select(Document).where(Document.id == id))
        return result.scalar_one_or_none()
    
    async def get_by_project(self, project_id: int) -> list[Document]:
        result = await self.db.execute(
            select(Document).where(Document.project_id == project_id)
        )
        return result.scalars().all()

# backend/app/modules/documents/service.py
class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DocumentRepository(db)
    
    async def create_document(self, data: DocumentCreate) -> Document:
        # Бизнес-логика валидации
        ...
        return await self.repo.create(...)
```

### 2. Модуль `projects` - пустые файлы

**Проблема:**
```python
# api.py и service.py пусты
```

**Рекомендация:**
```python
# backend/app/modules/projects/service.py
class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ProjectRepository(db)
    
    async def get_portfolio(self) -> PortfolioSummary:
        # Бизнес-логика агрегации
        projects = await self.repo.get_all()
        return calculate_portfolio_summary(projects)
    
    async def calculate_spi(self, project_id: int) -> float:
        # CPM планирование и расчёт SPI
        ...

# backend/app/modules/projects/api.py
@router.get("/portfolio")
async def get_portfolio(
    service: ProjectService = Depends(lambda: ProjectService(get_db())),
):
    return await service.get_portfolio()
```

### 3. Перекрёстные зависимости

**Проблема в `collaboration/router.py`:**
```python
from app.modules.auth.models import User       # ⚠️ OK
from app.modules.documents.models import Document  # ⚠️ OK
```

**Анализ:**
- ✅ Допустимо: `collaboration` зависит от `auth` и `documents` (явные зависимости)
- ⚠️ Риски: `documents` не должен зависеть от `collaboration` (циклическая зависимость)

**Рекомендация:**
```python
# docs/modules/collaboration/__init__.py
__all__ = ["router", "ConnectionManager", "WSMessage"]

# docs/modules/documents/__init__.py
__all__ = ["router", "Document", "DocumentSchema"]
# НЕ импортировать ничего из collaboration
```

## 📐 Best Practices для разделения ответственности

### 1. Слои в модуле

```
feature/
├── models.py         # SQLAlchemy модели (БД слой)
├── schemas.py        # Pydantic схемы (API слой)
├── repository.py     # Доступ к данным (DAL слой)
├── service.py        # Бизнес-логика (Business слой)
├── router.py         # HTTP handlers (API слой)
├── deps.py           # Зависимости FastAPI
└── dto.py            # Data Transfer Objects
```

### 2. Правила импортов

**✅ ДОПУСТИМО:**
```python
# router.py импортирует service
from app.modules.auth.service import AuthService

# service.py импортирует repository
from app.modules.auth.repository import UserRepository

# repository.py импортирует model
from app.modules.auth.models import User

# Любой модуль импортирует core
from app.core.config import settings
```

**❌ НЕДОПУСТИМО:**
```python
# service.py НЕ должен импортировать router
from app.modules.auth.router import router

# repository.py НЕ должен импортировать service
from app.modules.auth.service import AuthService

# Модуль A НЕ должен импортировать модуль B, если B импортирует A
# (циклическая зависимость)
```

### 3. Зависимости между модулями

```
auth           ← Базовый модуль (все могут зависеть)
    ↑
    ├── documents
    ├── projects
    ├── collaboration
    └── analytics

documents      ← Может зависеть от auth
    ↑
    ├── collaboration
    └── analytics
    (но НЕ обратно!)

projects       ← Может зависеть от auth
    ↑
    └── analytics

collaboration  ← Может зависеть от auth, documents
               (но НЕ projects, analytics, tenders)
```

## 🛠️ План доработок

### Приоритет 1: Критические модули

| Модуль | Задача | Файлы |
|--------|--------|-------|
| `documents` | Добавить repository + service | `repository.py`, `service.py` |
| `projects` | Заполнить service + api | `service.py`, `api.py` |
| `tenders` | Проверить структуру | Все файлы |

### Приоритет 2: Средние модули

| Модуль | Задача |
|--------|--------|
| `analytics` | Проверить изоляцию |
| `gamification` | Проверить изоляцию |
| `time_tracking` | Проверить изоляцию |
| `variables` | Проверить изоляцию |

### Приоритет 3: Документация

| Задача | Описание |
|--------|----------|
| `ARCHITECTURE.md` | Документировать правила импортов |
| `MODULE_GUIDE.md` | Шаблон для новых модулей |
| `tests/` | Проверить тесты на изоляцию |

## 📝 Шаблон нового модуля

```bash
# Создание нового модуля
mkdir -p backend/app/modules/{name}
touch backend/app/modules/{name}/__init__.py

# Структура модуля
backend/app/modules/{name}/
├── __init__.py      # Экспорт router, models, schemas
├── models.py        # SQLAlchemy модели
├── schemas.py       # Pydantic схемы
├── repository.py    # CRUD операции
├── service.py       # Бизнес-логика
├── router.py        # HTTP/WebSocket handlers
├── deps.py          # FastAPI зависимости
└── dto.py           # (опционально) DTO
```

```python
# backend/app/modules/{name}/__init__.py
from app.modules.{name}.router import router
from app.modules.{name}.models import *
from app.modules.{name}.schemas import *

__all__ = ["router", "ModelName", "SchemaName"]
```

## 🧪 Проверка изоляции

### Тест на циклические зависимости

```python
# tests/test_architecture.py
import ast
from pathlib import Path

def test_no_cyclic_dependencies():
    """Проверка отсутствия циклических импортов между модулями."""
    modules_dir = Path("backend/app/modules")
    imports = {}
    
    for module in modules_dir.iterdir():
        if module.is_dir() and not module.name.startswith("_"):
            imports[module.name] = set()
            
            for py_file in module.glob("*.py"):
                with open(py_file) as f:
                    tree = ast.parse(f.read())
                    
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            if alias.name.startswith("app.modules"):
                                imported_module = alias.name.split(".")[2]
                                if imported_module != module.name:
                                    imports[module.name].add(imported_module)
                    elif isinstance(node, ast.ImportFrom):
                        if node.module and node.module.startswith("app.modules"):
                            imported_module = node.module.split(".")[2]
                            if imported_module != module.name:
                                imports[module.name].add(imported_module)
    
    # Проверка на циклы
    for module, deps in imports.items():
        for dep in deps:
            if module in imports.get(dep, set()):
                pytest.fail(f"Cyclic dependency: {module} <-> {dep}")
```

### Lint правила для импортов

```toml
# pyproject.toml
[tool.ruff]
select = ["I", "E", "F"]

[tool.ruff.isort]
known-first-party = ["app"]
known-third-party = ["fastapi", "sqlalchemy", "pydantic"]

# Запрет импортов между модулями (кроме разрешённых)
[tool.ruff.per-file-ignores]
"app/modules/*/router.py" = ["I001"]
```

## 📊 Итоговая оценка

| Критерий | Оценка | Статус |
|----------|--------|--------|
| Изоляция `auth` | ✅ 10/10 | Эталонный модуль |
| Изоляция `collaboration` | ✅ 9/10 | Хорошая изоляция |
| Изоляция `documents` | ⚠️ 6/10 | Требует repository + service |
| Изоляция `projects` | ⚠️ 5/10 | Пустые service/api |
| Отсутствие циклов | ✅ 9/10 | Проверено вручную |
| Разделение слоёв | ⚠️ 7/10 | Не везде последовательно |

**Общая оценка**: **7.3/10** - Хорошая база, требуется доработка

---

**Версия**: 1.0  
**Дата**: 2024  
**Статус**: ⚠️ Требуются доработки (Приоритет 1)
