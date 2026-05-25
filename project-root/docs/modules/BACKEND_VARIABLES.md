# Модуль: Variables (Переменные шаблонов)

## Назначение
Управление переменными документов: глобальные, проектные, документные. Уровень 1.

## Файлы
```
backend/app/modules/variables/
  router.py    # CRUD, подстановка в шаблон
  models.py    # Variable, VariableRevision
  schemas.py   # Variable schemas
```

## Модели
- **Variable**: `scope` (global/project/document), `project_id`, `document_id`
  - `key`, `value`, `default_value`, `description`, `validation_rule`
  - `is_computed`, `computed_expression`
- **VariableRevision**: `variable_id`, `from_value`, `to_value`, `reason`, `triggered_by`

## Эндпоинты (`/api/v1/variables`)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/` | Список (фильтр по scope/project) |
| POST | `/` | Создать |
| PUT | `/{id}` | Обновить (создаёт VariableRevision) |
| POST | `/substitute` | Подстановка в шаблон |

## Зависимости
- `auth`, `projects`, `documents`

## Правила параллельной разработки
- `computed_expression` — безопасный eval через `variable_engine.py`
- `key` — уникален в рамках scope+project_id+document_id
