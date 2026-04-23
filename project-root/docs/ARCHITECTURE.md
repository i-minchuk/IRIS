# Архитектура DokPotok IRIS

## Обзор

Данная документация описывает архитектуру backend-проекта DokPotok IRIS, включая:
- Матрицу зависимостей между модулями
- Правила импортов
- Слои модулей
- Примеры правильной структуры
- Процесс проверки архитектуры

**Актуальность**: Документ обновлён после рефакторинга модулей `documents` и `resources` (2024).

---

## Матрица зависимостей между модулями

### Разрешённые зависимости

| Модуль | Может импортировать | Обоснование |
|--------|---------------------|-------------|
| `auth` | (ничего) | Базовый модуль, не зависит от других |
| `core` | (ничего) | Утилиты общего назначения |
| `db` | (ничего) | Работа с БД |
| `documents` | `auth`, `projects`, `variables` | Документы связаны с проектами и используют переменные |
| `projects` | `auth` | Проекты независимы от других бизнес-модулей |
| `tasks` | `auth`, `projects` | Задачи относятся к проектам |
| `time_tracking` | `auth`, `projects`, `tasks` | Учёт времени для задач и проектов |
| `tenders` | `auth`, `documents` | Тендеры работают с документами |
| `variables` | `auth` | Переменные независимы |
| `collaboration` | `auth`, `documents` | Совместная работа с документами |
| `analytics` | `auth`, `documents`, `projects`, `time_tracking` | Анализирует данные из всех модулей |
| `gamification` | `auth`, `documents`, `projects` | Геймификация на основе активности |
| `resources` | `auth`, `documents`, `projects`, `time_tracking` | Агрегирует данные для отчётности |

### Запрещённые зависимости

| Модуль A | Модуль B | Причина |
|----------|----------|---------|
| `auth` | `documents` | Циклическая зависимость |
| `projects` | `documents` | Проекты не должны зависеть от документов |
| `documents` | `analytics` | Документы не должны знать об аналитике |
| `analytics` | `tenders` | Аналитика не должна влиять на бизнес-процессы |
| `router` | `models` из других модулей | Router должен использовать service layer |

---

## Правила импортов

### ✅ Разрешено

```python
# router.py импортирует service
from app.modules.auth.service import AuthService

# service.py импортирует repository
from app.modules.auth.repository import UserRepository

# repository.py импортирует model
from app.modules.auth.models import User

# Любой модуль импортирует core, db
from app.core.config import settings
from app.db.session import get_db

# Router может импортировать User из auth для dependency
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User  # Разрешено для type hints
```

### ❌ Запрещено

```python
# service.py НЕ должен импортировать router
from app.modules.auth.router import router

# repository.py НЕ должен импортировать service
from app.modules.auth.service import AuthService

# Router НЕ должен импортировать модели из других модулей напрямую
from app.modules.projects.models import Project  # Запрещено в router.py

# Модуль A НЕ должен импортировать модуль B, если B импортирует A
# (циклическая зависимость)
```

### Правила для рефакторированных модулей

Для модулей `documents` и `resources`:

1. **Router** должен использовать **service layer** через dependency injection
2. **Router** не должен импортировать модели из других модулей напрямую
3. **Repository** отвечает за доступ к данным
4. **Service** отвечает за бизнес-логику

```python
# ✅ Правильно
# documents/router.py
from app.modules.documents.service import DocumentService
from app.modules.documents.deps import get_document_service

@router.get("/documents/")
async def list_documents(
    service: DocumentService = Depends(get_document_service),
):
    return await service.list_documents()
```

---

## Слои в модуле

### Стандартная структура

```
module_name/
├── models.py         # SQLAlchemy модели (БД слой)
├── schemas.py        # Pydantic схемы (API слой)
├── repository.py     # Доступ к данным (DAL слой)
├── service.py        # Бизнес-логика (Business слой)
├── deps.py           # Зависимости FastAPI
└── router.py         # HTTP handlers (API слой)
```

### Ответственность слоёв

| Слой | Ответственность | Пример |
|------|-----------------|--------|
| **models.py** | Определение таблиц БД | `class Document(Base): ...` |
| **schemas.py** | Валидация и сериализация | `class DocumentCreate(BaseModel): ...` |
| **repository.py** | CRUD операции с БД | `async def get_by_id(self, id: int): ...` |
| **service.py** | Бизнес-логика | `async def create(self, data): ...` |
| **deps.py** | Dependency injection | `async def get_service(): ...` |
| **router.py** | API endpoints | `@router.get("/documents/"): ...` |

### Рефакторированные модули

**documents/** и **resources/** имеют полную структуру с repository/service слоями.

---

## Иерархия модулей

```
Level 0 (базовые):
├── core              # Утилиты, конфигурация
├── db                # Работа с БД
└── auth              # Аутентификация и авторизация

Level 1 (бизнес-сущности):
├── projects          # Проекты
├── documents         # Документы (рефакторирован ✅)
├── variables         # Переменные
├── tasks             # Задачи
└── tenders           # Тендеры

Level 2 (надстройки):
├── time_tracking     # Учёт времени
├── collaboration     # Совместная работа
├── analytics         # Аналитика
├── gamification      # Геймификация
└── resources         # Отчётность (рефакторирован ✅)

Правило: модуль уровня N может импортировать только модули уровня ≤ N
```

---

## Примеры правильных импортов

### Пример 1: Создание документа

```python
# documents/router.py
from fastapi import APIRouter, Depends

from app.modules.documents.service import DocumentService
from app.modules.documents.deps import get_document_service

router = APIRouter(tags=["documents"])

@router.post("/documents/")
async def create_document(
    data: dict,
    service: DocumentService = Depends(get_document_service),
):
    return await service.create_document(data, user_id)
```

```python
# documents/service.py
from app.modules.documents.repository import DocumentRepository
from app.modules.projects.repository import ProjectRepository  # ✅ Разрешено

class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DocumentRepository(db)
        self.project_repo = ProjectRepository(db)
    
    async def create_document(self, data: dict, user_id: int):
        # Проверка, что проект существует
        project = await self.project_repo.get_by_id(data["project_id"])
        if not project:
            raise HTTPException(404, "Project not found")
        
        return await self.repo.create(data)
```

```python
# documents/repository.py
from app.modules.documents.models import Document

class DocumentRepository:
    async def create(self, data: dict) -> Document:
        doc = Document(**data)
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc
```

### Пример 2: Аналитика

```python
# analytics/service.py
from app.modules.documents.repository import DocumentRepository  # ✅ Разрешено
from app.modules.projects.repository import ProjectRepository   # ✅ Разрешено
from app.modules.time_tracking.repository import TimeTrackingRepository  # ✅ Разрешено

class AnalyticsService:
    async def get_project_stats(self, project_id: int):
        # Сбор данных из разных модулей
        docs = await self.doc_repo.get_by_project(project_id)
        time_logs = await self.time_repo.get_by_project(project_id)
        # Анализ и агрегация
```

### Пример 3: Resources (отчётность)

```python
# resources/router.py
from app.modules.resources.service import WorkloadService
from app.modules.resources.deps import get_workload_service

@router.get("/workload", response_model=WorkloadResponse)
async def get_workload(
    service: WorkloadService = Depends(get_workload_service),
):
    return await service.get_team_workload()
```

```python
# resources/service.py
from app.modules.resources.repository import WorkloadRepository

class WorkloadService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WorkloadRepository(db)
    
    async def get_team_workload(self):
        # Агрегация данных из time_tracking, documents, projects
        users = await self.repo.get_all_users()
        # ... бизнес-логика
```

```python
# resources/repository.py
from app.modules.time_tracking.models import TimeSession
from app.modules.documents.models import Document
from app.modules.projects.models import Project

class WorkloadRepository:
    async def get_user_stats(self, user_id: int):
        # Прямой доступ к моделям в repository ✅
        result = await self.db.execute(
            select(func.sum(TimeSession.active_time))
            .where(TimeSession.user_id == user_id)
        )
        return result.scalar()
```

---

## Проверка архитектуры

### Запуск проверки

```bash
# Ручная проверка
cd backend
python scripts/check_architecture.py

# Проверка через pytest
pytest tests/test_architecture.py -v

# Только тесты архитектуры
pytest -m architecture -v
```

### Что проверяет check_architecture.py

1. **Циклические зависимости** - Нет циклов между модулями
2. **Авторизованные зависимости** - Соответствие матрице зависимостей
3. **Чистота router-ов** - Router не импортирует модели из других модулей
4. **Наличие слоев** - У рефакторированных модулей есть repository/service/deps

### В CI/CD

```yaml
# .github/workflows/ci.yml
- name: Check architecture
  run: pytest -m architecture -v
```

### Пример вывода

```
$ python scripts/check_architecture.py

Architecture Check for DokPotok IRIS

Scanning modules in backend/app/modules...

Checking cyclic dependencies...
Checking authorized dependencies...
Checking router cleanliness...
Checking repository/service layers...

============================================================
Dependencies Report
============================================================

Module dependencies:
  analytics: auth, documents, projects, time_tracking
  auth: (no dependencies)
  ...

No errors found!
All checks passed!
```

---

## Изменения в архитектуре

### Процесс внесения изменений

1. **Создать issue** с описанием новой зависимости
2. **Обсудить** архитектурный подход
3. **Обновить ARCHITECTURE.md** с обоснованием
4. **Обновить check_architecture.py** с новой зависимостью
5. **Реализовать** функциональность
6. **Проверить** `python scripts/check_architecture.py`
7. **Добавить тест** в `tests/test_architecture.py`

### Формат записи изменений

```markdown
### Изменение: [Название]

**Дата**: YYYY-MM-DD  
**Автор**: Имя  
**Обоснование**: Почему нужна новая зависимость  
**Изменения**: 
- Модуль A теперь импортирует модуль B
- Это необходимо для...
**Риски**: Возможные проблемы
**Откат**: Как отменить изменение
```

---

## История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 2.0 | 2024-XX-XX | Добавлены проверки router cleanliness и repository/service layers | NLP-Core-Team |
| 1.5 | 2024-XX-XX | Рефакторинг модулей documents и resources | NLP-Core-Team |
| 1.0 | 2024 | Initial architecture | NLP-Core-Team |

---

**Версия**: 2.0  
**Дата**: 2024  
**Статус**: ✅ Утверждено
**Поддерживается**: NLP-Core-Team
