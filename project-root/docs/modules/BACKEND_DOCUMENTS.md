# Модуль: Documents (Документы)

## Назначение
Управление документами: CRUD, версионирование, замечания, согласование, зависимости. Уровень 1.

## Файлы
```
backend/app/modules/documents/
  router_simple.py   # Основной CRUD
  models.py          # Document, Revision, ChangeSheet, DocumentRemark, ApprovalWorkflow, ApprovalStage, DocumentDependency
  schemas.py         # Pydantic-схемы
  service.py         # DocumentService (основная бизнес-логика)
  repository.py      # DocumentRepository, RevisionRepository, RemarkRepository, ApprovalWorkflowRepository
  crud.py            # Базовый async CRUD
  variable_engine.py # Подстановка переменных {{key}} + eval
```

## Модели
- **Document**: `title`, `document_type`, `status`, `file_path`, `version`, `project_id`, `created_by_id`
- **Revision** → Document: `number`, `status`, `trigger_type`, `changes_summary`, `diff_before/after`
- **ChangeSheet** → Revision: `table_data`, `stamp_entries`
- **DocumentRemark** → Document: `remark_type`, `severity`, `category`, `status`, `resolution`
- **ApprovalWorkflow** → Document: `route_type`, `status`, `started/completed_at`
- **ApprovalStage** → ApprovalWorkflow: `stage_id`, `name`, `role`, `status`, `sla_hours`
- **DocumentDependency**: source/target doc, тип (FS, SS, FF, SF)

## DocumentService
- `list/get/create/update`
- `lock/unlock` — блокировка документа
- `create_revision` — новая ревизия
- `create/update remark` — замечания к документу
- `start_approval_workflow` — запуск маршрута
- `render_document` — рендер с подстановкой переменных
- `cascade_update` — каскадное обновление

## Эндпоинты (`/api/v1/documents`)
- Стандартный CRUD + фильтры (`project_id`, `status`, `document_type`)

## Зависимости
- `auth`, `projects`

## Что зависит от documents
- `workflow` (согласование документов)
- `remarks` (замечания к документам)
- `tasks` (задачи на документ)
- `archive` (архивация изменений)

## Правила параллельной разработки
- `variable_engine.py` использует `eval()` в sandbox — **НЕ ослаблять** безопасность
- Document.status — enum, новые статусы добавлять в `app.core.enums.DocumentStatus`
- `file_path` — относительный путь в `IRIS_STORAGE_ROOT`
