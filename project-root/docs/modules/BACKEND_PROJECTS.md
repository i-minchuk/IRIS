# Модуль: Projects (Проекты)

## Назначение
Иерархия проектов: Project → Stage → Kit → Section. Уровень 1.

## Файлы
```
backend/app/modules/projects/
  router.py   # CRUD проектов, дерево stages/kits/sections
  models.py   # Project, Stage, Kit, Section
  schemas.py  # Pydantic-схемы
  service.py, repository.py, dto.py  # Пустые
```

## Модели
- **Project**: `name`, `code`, `customer`, `contract`, `stage`, `status`, `manager_id`, `planned_finish`, `forecast_finish`
- **Stage** → belongs to Project → has Kits
- **Kit** → belongs to Stage → has Sections
- **Section** → belongs to Kit

## Эндпоинты (`/api/v1/projects`)
| Method | Path | Описание |
|--------|------|----------|
| GET  | `/` | Список проектов |
| POST | `/` | Создать проект |
| GET  | `/{id}` | Проект + stages + kits + sections |
| GET  | `/{id}/tree` | Полное дерево |
| POST | `/{id}/stages` | Добавить стадию |
| POST | `/{id}/stages/{stage_id}/kits` | Добавить комплект |
| POST | `.../kits/{kit_id}/sections` | Добавить раздел |

## Зависимости
- `auth` (level 0)

## Что зависит от projects
- `documents` (Document.project_id)
- `tasks` (Task.project_id)
- `tenders` (Tender связан с проектом)
- `workflow` (WorkflowInstance.project_id)
- `archive`

## Правила параллельной разработки
- Каскадное удаление: `Project` → `cascade="all, delete-orphan"` на stages
- **НЕ удалять** поля `code`, `customer`, `contract` — используются во frontend
- Можно добавлять новые поля в Project (миграция обязательна)
