# Модуль: Tasks (Задачи)

## Назначение
Производственный контроль: задачи разных типов с фильтрацией и статистикой. Уровень 1.

## Файлы
```
backend/app/modules/tasks/
  router.py     # CRUD, статистика, обновление статуса
  models.py     # Task (+ Enum: TaskType, TaskStatus, TaskPriority)
  schemas.py    # TaskCreate, TaskUpdate, TaskResponse, TaskFilters, TaskStatistics
  dto.py        # DTO
  service.py    # TaskService (бизнес-логика + кэш)
```

## Модель Task
- `title`, `description`, `type` (production, document, approval, review, issue, planning, meeting, other)
- `status` (draft, assigned, in_progress, review, approved, rejected, completed, cancelled, on_hold)
- `priority` (low, normal, high, critical, blocker)
- `due_date`, `assignee_id`, `creator_id`
- Полиморфные ссылки: `project_id`, `route_id`, `operation_id`, `document_id`, `work_center_id`
- `estimated_hours`, `actual_hours`, `percent_complete`
- `task_data` (JSONB)

## TaskService
- `_sync_on_status_change` — синхронизация Task → Operation / Document
- `_update_project_forecast` — обновление прогноза проекта
- Статистика с in-memory TTL кэшем (30 сек)

## Эндпоинты (`/api/v1/tasks`)
| Method | Path | Описание |
|--------|------|----------|
| GET  | `/` | Список с фильтрами |
| POST | `/` | Создать |
| GET  | `/statistics` | Статистика |
| GET  | `/{id}` | Получить |
| PUT  | `/{id}` | Обновить |
| DELETE | `/{id}` | Удалить |
| PATCH | `/{id}/status` | Сменить статус |

## Зависимости
- `auth`, `projects`, `documents`, `operations`

## Правила параллельной разработки
- **Индексы**: `idx_tasks_project_status`, `idx_tasks_assignee_status`, `idx_tasks_due_date_status`
- `task_data` — JSONB для расширяемости, можно добавлять новые поля без миграции
- Статусная машина не жёсткая (нет state machine библиотеки), проверка в service.py
