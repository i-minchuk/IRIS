# Модуль: Remarks (Замечания)

## Назначение
Трекинг замечаний (remarks) с историей, комментариями, тегами, действиями. Уровень 1.

## Файлы
```
backend/app/modules/remarks/
  router.py    # CRUD, действия, комментарии, теги, CSV export
  models.py    # Remark (UUID PK), RemarkComment, RemarkTag
  schemas.py   # RemarkCreate/Update/Response, RemarkFilter, RemarkAction, RemarkStatistics
  service.py   # RemarkService
```

## Модели
- **Remark** (UUID PK): `project_id`, `document_id`, `revision_id`, `workflow_step_id`
  - `source`, `status`, `priority`, `category` (enums)
  - `title`, `description`, `location_ref`
  - `author_id`, `assignee_id`, `due_date`
  - `resolution`, `resolved_by`, `resolved_at`
  - `parent_id` (self-referencing для тредов)
  - `related_remark_ids` (ARRAY)
  - `attachments` (JSONB), `history` (JSONB)
  - `created_at`/`updated_at` — String для SQLite совместимости
- **RemarkComment**: `remark_id`, `author_id`, `text`, `is_internal`
- **RemarkTag**: `name`, `color`. Association `remark_tag_links`

## RemarkService
- Create с history entry
- List с комплексной фильтрацией/пагинацией
- Update с history tracking
- Действия: assign, resolve, reject, defer, reopen, close, change_priority
- Link remarks bidirectionally
- Statistics, Tag CRUD

## Эндпоинты (`/api/v1/remarks`)
| Method | Path | Описание |
|--------|------|----------|
| POST | `/` | Создать |
| GET  | `/` | Список (фильтры) |
| GET  | `/statistics` | Статистика |
| GET  | `/export` | CSV export |
| GET  | `/tags` | Теги |
| GET  | `/{id}` | Получить |
| PUT  | `/{id}` | Обновить |
| DELETE | `/{id}` | Удалить |
| POST | `/{id}/comments` | Комментарий |
| POST | `/{id}/actions` | Действие |

## Зависимости
- `auth`, `projects`, `documents`

## Правила параллельной разработки
- UUID PK — **НЕ менять** на Integer
- `history` — JSONB массив объектов `{action, timestamp, user_id, details}`
- `created_at` String — для SQLite; в PostgreSQL миграции `DateTime(timezone=True)`
