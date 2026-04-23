# Разработка в DokPotok IRIS - Руководство разработчика

## Структура проекта

```
project-root/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── modules/           # Бизнес-модули
│   │   ├── core/              # Общие утилиты
│   │   └── db/                # Работа с БД
│   ├── tests/                 # Тесты
│   └── scripts/               # Утилиты
├── frontend/                  # React frontend
└── docs/                      # Документация
```

## Архитектура модулей

### Правила импортов

**✅ Разрешено:**
- Модули уровня 0 (`auth`, `core`, `db`) могут импортировать только себя
- Модули уровня 1 (`projects`, `documents`) могут импортировать уровень 0
- Модули уровня 2 (`analytics`, `collaboration`) могут импортировать уровни 0 и 1

**❌ Запрещено:**
- Циклические зависимости между модулями
- Импорты из будущего (уровень N → уровень N+1)
- Прямые импорты router в service

### Проверка архитектуры

```bash
# Ручная проверка
cd backend
python scripts/check_architecture.py

# Запуск тестов архитектуры
pytest tests/test_architecture.py -v

# Запуск всех тестов с архитектурой
pytest -v
```

## Создание нового модуля

### Шаг 1: Создать структуру

```bash
cd backend/app/modules
mkdir new_module
touch new_module/__init__.py
```

### Шаг 2: Создать файлы модуля

Используйте шаблон из `docs/MODULE_TEMPLATE.md`

### Шаг 3: Зарегистрировать зависимости

1. **Определить зависимости** в `docs/ARCHITECTURE.md`
2. **Обновить** `scripts/check_architecture.py`
3. **Добавить в** `app/main.py`:
   ```python
   from app.modules.new_module import router as new_module_router
   app.include_router(new_module_router, prefix=f"{settings.API_V1_STR}/new_module", tags=["new_module"])
   ```

### Шаг 4: Протестировать

```bash
# Проверить архитектуру
python scripts/check_architecture.py

# Запустить тесты
pytest tests/modules/test_new_module.py -v
```

## Изменение зависимостей между модулями

### Процесс

1. **Создать issue** с описанием необходимости новой зависимости
2. **Обсудить** архитектурный подход
3. **Обновить** `docs/ARCHITECTURE.md` с обоснованием
4. **Обновить** `scripts/check_architecture.py` с новой зависимостью
5. **Реализовать** функциональность
6. **Проверить** `python scripts/check_architecture.py`
7. **Добавить тест** в `tests/test_architecture.py`

### Пример

```python
# В check_architecture.py
allowed_deps = {
    "new_module": {"auth", "existing_module"},  # Добавить новую зависимость
}
```

## Тестирование

### Структура тестов

```
backend/tests/
├── test_architecture.py       # Проверка архитектуры
├── test_auth/                 # Тесты auth модуля
├── test_documents/            # Тесты documents модуля
└── ...
```

### Запуск тестов

```bash
# Все тесты
pytest -v

# Только юнит-тесты (без интеграционных)
pytest -m "not integration" -v

# Только тесты архитектуры
pytest -m architecture -v

# С покрытием
pytest --cov=app --cov-report=html -v
```

## Логирование и отладка

### Логи

```python
from app.core.logging_config import logger

logger.info("Информационное сообщение")
logger.warning("Предупреждение")
logger.error("Ошибка")
```

### Локальный запуск

```bash
# Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run dev
```

## Безопасность

### Аутентификация

- Используйте `get_current_active_user` dependency
- Токены через cookies (HttpOnly) или Bearer header

### Rate limiting

- `/login`: 5 запросов/минута
- `/refresh`: 10 запросов/минута

### Проверка безопасности

```bash
cd backend
python scripts/security_check.py
```

## Частые задачи

### Добавить новый endpoint

```python
# modules/your_module/router.py
@router.get("/items/")
async def list_items(
    service: YourService = Depends(get_your_service),
    current_user = Depends(get_current_active_user),
):
    return await service.get_all()
```

### Добавить бизнес-логику

```python
# modules/your_module/service.py
class YourService:
    async def create_item(self, data: ItemCreate, user_id: int):
        # Валидация
        if not data.name:
            raise HTTPException(400, "Name required")
        
        # Бизнес-правила
        return await self.repo.create(data)
```

### Доступ к БД

```python
# modules/your_module/repository.py
class YourRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, id: int):
        result = await self.db.execute(
            select(YourModel).where(YourModel.id == id)
        )
        return result.scalar_one_or_none()
```

## Code Review Checklist

- [ ] Нет циклических зависимостей
- [ ] Импорт следует правилам архитектуры
- [ ] Все слои модуля реализованы (model, schema, repo, service, router)
- [ ] Есть тесты для новой функциональности
- [ ] Логирование добавлено для критических операций
- [ ] Документация обновлена

## Troubleshooting

### Ошибка: "Cyclic dependency detected"

**Проблема:** Модуль A импортирует модуль B, а модуль B импортирует модуль A.

**Решение:**
1. Вынести общую логику в отдельный модуль
2. Использовать события вместо прямых импортов
3. Пересмотреть архитектуру

### Ошибка: "Unauthorized import"

**Проблема:** Модуль импортирует неразрешённый модуль.

**Решение:**
1. Проверить `docs/ARCHITECTURE.md`
2. Если зависимость обоснована - обновить матрицу
3. Если нет - убрать импорт

### Тесты не проходят

```bash
# Очистить кэш
pytest --cache-clear

# Запустить с подробным выводом
pytest -vv

# Проверить покрытие
pytest --cov=app --cov-report=term-missing
```

---

**Версия**: 1.0  
**Дата**: 2024  
**Поддерживается**: NLP-Core-Team
