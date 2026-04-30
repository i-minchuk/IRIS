# Реализация системы задач по проектам (ДокПоток IRIS)

## 1. Описание новой вкладки «Задачи по проектам»

### 1.1. Замена вкладки «Портфель проектов»

**Старая вкладка:** «Портфель проектов» — агрегированный дашборд с проектами и их статусами.

**Новая вкладка:** «Задачи по проектам» — единый рабочий стол для работы со всеми задачами по проектам, операциям и документам.

### 1.2. Маршрутизация и обратная совместимость

| Старый путь | Новый путь | Примечание |
|-------------|------------|------------|
| `/portfolio` | `/tasks` | Автоматический редирект |
| `/projects` | `/projects` | Оставлен без изменений |
| `/tasks` | `/tasks` | Новая страница |

**URL не ломаются:** Старые ссылки на `/portfolio` автоматически перенаправляются на `/tasks` через React Router.

### 1.3. Структура навигации

```
Dashboard → Аналитика
Portfolio → Портфель заказов
Tasks → Задачи по проектам (НОВАЯ)
Production → Производственный контроль
Projects → Портфель проектов
Documents → Документы
Approval → Согласования
Remarks → Замечания
Archive → Архив
```

---

## 2. Схема данных tasks

### 2.1. Основная таблица tasks

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type ENUM('production', 'document', 'approval', 'review', 'issue', 'planning', 'meeting', 'other'),
    status ENUM('new', 'in_progress', 'on_hold', 'done', 'cancelled', 'review', 'approval'),
    priority ENUM('low', 'normal', 'high', 'critical'),
    due_date TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    assignee_id INT REFERENCES users(id),
    creator_id INT REFERENCES users(id) NOT NULL,
    project_id INT REFERENCES projects(id),
    route_id INT REFERENCES routes(id),
    operation_id INT REFERENCES operations(id),
    document_id INT REFERENCES documents(id),
    work_center_id INT REFERENCES work_centers(id),
    estimated_hours FLOAT,
    actual_hours FLOAT,
    percent_complete INT DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2. Индексы для производительности

```sql
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date, status);
CREATE INDEX idx_tasks_type_status ON tasks(type, status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

### 2.3. Связи с производственными таблицами

```
tasks
├── projects (FK: project_id)
├── routes (FK: route_id)
├── operations (FK: operation_id)
├── documents (FK: document_id)
├── work_centers (FK: work_center_id)
└── users (FK: assignee_id, creator_id)
```

---

## 3. Бизнес-правила синхронизации

### 3.1. Production task → Operation sync

| Событие задачи | Действие на операции |
|----------------|---------------------|
| `status: new → in_progress` | `operations.status = in_progress`, `actual_start = NOW()` |
| `status: in_progress → done` | `operations.status = completed`, `actual_finish = NOW()`, обновить `projects.forecast_finish` |
| `status: in_progress → cancelled` | `operations.status = cancelled` |

### 3.2. Document task → Document sync

| Событие задачи | Действие на документе |
|----------------|----------------------|
| `type: document, status: done` | `documents.actual_ready = NOW()` |
| `type: document, due_date < NOW(), status != done` | `documents.status = overdue` |

### 3.3. Approval/Review task → Workflow sync

| Событие задачи | Действие |
|----------------|----------|
| `type: approval, status: done` | Обновить статус согласования документа |
| `type: review, status: done` | Обновить статус проверки документа |

### 3.4. Обновление forecast_finish проекта

Когда завершается последняя операция в маршруте:
1. Проверить `operation.actual_finish`
2. Если `actual_finish > project.forecast_finish`, обновить `project.forecast_finish`

---

## 4. Структура UI вкладки

### 4.1. Верхняя панель фильтров

**Фильтры:**
- Проект (выпадающий список)
- Заказчик (поиск)
- Тип задачи (production, document, approval, review, issue, other)
- Статус (new, in_progress, on_hold, done, cancelled, review, approval)
- Приоритет (low, normal, high, critical)
- Исполнитель (выпадающий список)
- Участок/рабочий центр (выпадающий список)
- Диапазон дедлайнов (date picker)
- Checkbox «Только просроченные»

**Быстрый поиск:** По номеру проекта/заказа, названию задачи.

### 4.2. Панель суммарных индикаторов

```
[Всего задач: 150] [Просрочено: 12 (8.0%)]

По статусам:
  ● Новых: 25
  ● В работе: 45
  ● На паузе: 10
  ● Выполнено: 70

По приоритетам:
  ● Критичных: 5
  ● Высоких: 15

Загрузка исполнителей:
  1. Иванов И.И. (30 задач, +5 просрочено)
  2. Петров П.П. (25 задач, +2 просрочено)
  3. Сидоров С.С. (20 задач, +0 просрочено)
```

### 4.3. Основная таблица задач

**Колонки:**
1. Проект (код, название с ссылкой)
2. Связь (операция/документ)
3. Заголовок задачи
4. Тип задачи (иконка)
5. Статус (dropdown для быстрого изменения)
6. Приоритет (цветной бейдж)
7. Ответственный (аватар + имя)
8. Дедлайн (иконка календаря + просрочка если есть)
9. Прогресс (progress bar + %)

**Интерактивность:**
- Клик по строке → открытие карточки задачи в правой панели
- Dropdown статуса → мгновенное обновление через API
- Пагинация: 50 задач на страницу

### 4.4. Карточка задачи (правая панель)

**Содержимое:**
- Название и описание
- Статус (dropdown с цветовым кодированием)
- Приоритет (иконка флага + цвет)
- Исполнитель (аватар, возможность сменить)
- Привязки: проект, операция, документ
- Дедлайн + просрочка (если есть)
- Плановое/фактическое время
- Прогресс (progress bar)
- Даты создания и обновления
- Кнопки: «Изменить задачу», «Добавить комментарий»

---

## 5. API и сервисы

### 5.1. Endpoints

```
GET    /api/tasks                  — Список задач с фильтрами
POST   /api/tasks                  — Создать задачу
GET    /api/tasks/{id}             — Получить задачу
PATCH  /api/tasks/{id}             — Обновить задачу
PATCH  /api/tasks/{id}/status      — Обновить статус (с синхронизацией)
DELETE /api/tasks/{id}             — Удалить задачу
GET    /api/tasks/statistics       — Статистика задач
```

### 5.2. Параметры фильтрации

```json
{
  "project_id": 1,
  "assignee_id": 5,
  "status": "in_progress",
  "type": "production",
  "priority": "high",
  "work_center_id": 3,
  "due_date_from": "2026-05-01T00:00:00Z",
  "due_date_to": "2026-05-31T23:59:59Z",
  "overdue_only": true,
  "search": "проект 001",
  "limit": 100,
  "offset": 0
}
```

### 5.3. Транзакционность

Все изменения задач с синхронизацией выполняются в рамках одной транзакции:

```python
def update_task_status(self, task_id: int, status_in: TaskStatusUpdate):
    with self.db.begin() as transaction:
        try:
            # 1. Обновить задачу
            task.status = status_in.status
            
            # 2. Синхронизировать с operations/documents
            self._sync_on_status_change(task, old_status, new_status)
            
            # 3. Commit
            self.db.commit()
        except Exception as e:
            # 4. Rollback при ошибке
            transaction.rollback()
            raise e
```

**Гарантии:**
- Если синхронизация с `operations` падает, изменения задачи не сохраняются
- Если обновление `projects.forecast_finish` падает, все изменения откатываются
- Внешние сущности (documents, operations, projects) обновляются атомарно с задачей

---

## 6. Файлы, созданные/обновлённые

### Backend

**Создано:**
- `backend/app/core/enums.py` — ENUM-ы для задач и операций
- `backend/app/modules/tasks/models.py` — Модель Task
- `backend/app/modules/tasks/service.py` — Сервис с бизнес-логикой
- `backend/app/modules/tasks/router.py` — API endpoints
- `backend/app/modules/tasks/dto.py` — DTO для API
- `backend/app/modules/routes/models.py` — Модель Route
- `backend/app/modules/operations/models.py` — Модели Operation, OperationAssignment, WorkCenter
- `backend/alembic/versions/20260501_090000_add_tasks_and_production_tables.py` — Миграция БД

**Обновлено:**
- `backend/app/modules/projects/models.py` — Добавлены поля `planned_finish`, `forecast_finish`, `manager_id`, связи
- `backend/app/modules/documents/models.py` — Добавлены поля `operation_id`, `planned_ready`, `actual_ready`, связь с tasks

### Frontend

**Создано:**
- `frontend/src/pages/ProjectTasksPage/index.tsx` — Главная страница
- `frontend/src/pages/ProjectTasksPage/types/index.ts` — TypeScript типы
- `frontend/src/pages/ProjectTasksPage/hooks/useTasks.ts` — React hook для данных
- `frontend/src/pages/ProjectTasksPage/hooks/taskApi.ts` — API client
- `frontend/src/pages/ProjectTasksPage/components/TaskFiltersPanel.tsx` — Фильтры
- `frontend/src/pages/ProjectTasksPage/components/TaskTable.tsx` — Таблица задач
- `frontend/src/pages/ProjectTasksPage/components/TaskStatisticsPanel.tsx` — Статистика
- `frontend/src/pages/ProjectTasksPage/components/TaskDetailPanel.tsx` — Карточка задачи

**Обновлено:**
- `frontend/src/app/router.tsx` — Добавлен маршрут `/tasks`, редирект `/portfolio` → `/tasks`
- `frontend/src/components/FolderTabs.tsx` — Добавлена вкладка «Задачи по проектам»

---

## 7. Инструкция по развёртыванию

### 7.1. Миграция БД

```bash
cd project-root/backend
alembic upgrade head
```

Проверка:
```sql
SELECT COUNT(*) FROM tasks;
SELECT COUNT(*) FROM routes;
SELECT COUNT(*) FROM operations;
SELECT COUNT(*) FROM work_centers;
```

### 7.2. Запуск backend

```bash
cd project-root/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7.3. Запуск frontend

```bash
cd project-root/frontend
npm run dev
```

### 7.4. Тестирование

1. Открыть `http://localhost:3000/tasks`
2. Проверить отображение фильтров и таблицы
3. Создать тестовую задачу через API:
   ```bash
   curl -X POST http://localhost:8000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Тестовая задача",
       "type": "production",
       "priority": "high",
       "due_date": "2026-05-15T17:00:00Z",
       "project_id": 1
     }'
   ```
4. Проверить синхронизацию: создать задачу типа `production` с `operation_id` и перевести в `in_progress` — операция должна обновиться.

---

## 8. Дальнейшие шаги

1. **Добавить CRUD для операций и маршрутов** — UI для создания/редактирования техкарт
2. **Интеграция с календарём** — Gantt chart для отображения задач по времени
3. **Уведомления** — WebSocket для real-time обновлений задач
4. **Экспорт/импорт** — Excel для массового создания задач
5. **Гамификация** — начисление баллов за выполнение задач (интеграция с существующей системой)

---

## 9. Контактные данные

**Разработчик:** NLP-Core-Team
**Проект:** ДокПоток IRIS
**Дата:** 2026-05-01
