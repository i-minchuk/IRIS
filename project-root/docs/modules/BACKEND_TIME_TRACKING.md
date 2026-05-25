# Модуль: Time Tracking (Учёт времени)

## Назначение
Сессии работы и аналитика эффективности сотрудников. Уровень 2.

## Файлы
```
backend/app/modules/time_tracking/
  router.py    # CRUD сессий, аналитика
  models.py    # TimeSession, EmployeeLoad
```

## Модели
- **TimeSession**: `user_id`, `document_id`, `project_id`, `started_at`, `ended_at`
  - `total_duration`, `active_time`, `idle_time`, `breaks`
  - `edit_count`, `blocks_modified`, `variables_changed`
  - `revisions_created`, `remarks_resolved`, `remarks_created`, `approvals_given`
  - `efficiency_score`, `complexity_index`, `normalized_hours`
- **EmployeeLoad**: `user_id`, `date`, `planned_hours`, `actual_hours`, `load_percentage`

## Эндпоинты (`/api/v1/time-tracking`)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/sessions` | Список сессий |
| POST | `/sessions/start` | Начать сессию |
| POST | `/sessions/{id}/stop` | Завершить |
| GET | `/analytics` | Аналитика сотрудника |

## Зависимости
- `auth`, `documents`, `tasks`

## Правила параллельной разработки
- `efficiency_score` — вычисляемое поле, формула в service/router
- `normalized_hours` — нормализация по сложности
