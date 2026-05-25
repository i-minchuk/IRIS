# Модуль: Workflow (Маршруты согласования)

## Назначение
Шаблоны и инстансы маршрутов согласования документов. Уровень 1.

## Файлы
```
backend/app/modules/workflow/
  router.py    # CRUD шаблонов, запуск инстансов, approve/reject/delegate
  models.py    # WorkflowTemplate, WorkflowInstance, WorkflowStep, WorkflowComment, WorkflowAuditLog
  schemas.py   # PREDEFINED_TEMPLATES, ApprovalAction, RejectionAction, DelegationAction
  service.py   # WorkflowService
```

## Модели
- **WorkflowTemplate**: `name`, `code`, `steps_schema` (JSONB), `is_active`, `is_default`
- **WorkflowInstance**: `template_id`, `document_id`, `project_id`, `status`, `current_step_id`
- **WorkflowStep**: `instance_id`, `step_key`, `step_name`, `role`, `assignment_type` (sequential/parallel/any_of), `approval_type`, `deadline_hours`, `order_index`, `status`, `auto_transition`, `is_delegated`
- **WorkflowComment** → Step: `text`, `page_number`, `coordinates`
- **WorkflowAuditLog** → Step: `action`, `old/new status`, `audit_metadata`
- Association table: `workflow_step_assignees` (M2M Step↔User)

## PREDEFINED_TEMPLATES
- `standard` — стандартный маршрут
- `fast` — ускоренный
- `tender` — тендерный

## WorkflowService
- Создание инстанса из шаблона
- Approve / Reject / Delegate с аудит-логом
- Auto-transition между шагами
- Комментарии

## Эндпоинты (`/api/v1/workflows`)
- CRUD шаблонов (soft delete)
- Запуск инстанса
- Шаги: approve, reject, delegate
- Комментарии, audit log

## Зависимости
- `auth`, `projects`, `documents`

## Правила параллельной разработки
- `steps_schema` — JSONB, структура шага не валидируется жёстко
- Soft delete шаблонов: `is_active=False`, **НЕ удалять** из БД
- Audit log — **только дописывать**, не редактировать старые записи
