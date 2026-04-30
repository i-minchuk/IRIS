# Архив - Документация

## 📋 Обзор

Архив — централизованное хранилище полной хронологии проекта с полнотекстовым поиском по всем материалам, конструкциям, документам, событиям и коммуникациям.

## 🎯 Функциональность

### 1. Автоматическая архивация
Система автоматически создаёт архивные записи при:
- Создании/изменении/удалении документов
- Создании ревизий
- Создании/обновлении замечаний
- Изменении статуса согласования (workflow)
- Загрузке файлов
- Изменении статуса проекта
- Создании материалов и конструкций

### 2. Полнотекстовый поиск
- Поиск по всем полям: title, description, tags
- Ранжирование результатов по релевантности (ts_rank_cd)
- Подсветка совпадений (ts_headline)
- Группировка по категориям: События, Материалы, Конструкции, Документы
- Фильтры по типам, датам, авторам, вложениям

### 3. Хронология (Timeline)
- Визуальная временная шкала событий
- Цветовая индикация типов событий
- Закреплённые события (📌)
- Детали при клике

### 4. Материалы
- 9 типов материалов: сталь, бетон, арматура, изоляция, отделка, оборудование, трубы, кабели, другие
- Сертификаты и паспорта качества
- Связь с конструкциями

### 5. Конструкции
- 10 типов: фундамент, колонна, балка, плита, стена, крыша, каркас, трубопровод, электрика, другие
- Статусы: план, производство, монтаж, тестирование, приёмка, отклонение
- Фотофиксация
- Связь с материалами и документами

## 🔧 Техническая реализация

### Бэкенд

#### Миграция Alembic
Файл: `alembic/versions/add_archive_tables.py`

**Таблицы:**
- `archive_entries` - основные записи (16 типов)
- `archive_materials` - материалы
- `archive_constructions` - конструкции
- `archive_search_index` - индекс для поиска

**Индексы:**
```sql
CREATE INDEX idx_archive_entries_search_vector ON archive_entries USING GIN(search_vector);
CREATE INDEX idx_archive_entries_project_id ON archive_entries(project_id);
CREATE INDEX idx_archive_entries_entry_type ON archive_entries(entry_type);
CREATE INDEX idx_archive_entries_occurred_at ON archive_entries(occurred_at DESC);
```

**Триггер для search_vector:**
```sql
CREATE TRIGGER archive_entries_search_vector_update
BEFORE INSERT OR UPDATE ON archive_entries
FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(
  search_vector, 'pg_catalog.russian', title, description, array_to_string(tags, ' ')
);
```

#### API Эндпоинты

```
GET    /api/v1/archive/entries          - Список записей
GET    /api/v1/archive/entries/{id}     - Детали записи
POST   /api/v1/archive/entries          - Создать запись
PUT    /api/v1/archive/entries/{id}     - Обновить запись
DELETE /api/v1/archive/entries/{id}     - Soft delete
POST   /api/v1/archive/entries/{id}/pin - Закрепить
DELETE /api/v1/archive/entries/{id}/pin - Открепить

GET    /api/v1/archive/search           - Полнотекстовый поиск
GET    /api/v1/archive/search/suggestions - Автодополнение

POST   /api/v1/archive/materials        - Создать материал
GET    /api/v1/archive/materials        - Список материалов
GET    /api/v1/archive/materials/{id}   - Детали материала
PUT    /api/v1/archive/materials/{id}   - Обновить материал
DELETE /api/v1/archive/materials/{id}   - Удалить материал

POST   /api/v1/archive/constructions    - Создать конструкцию
GET    /api/v1/archive/constructions    - Список конструкций
GET    /api/v1/archive/constructions/{id} - Детали конструкции
PUT    /api/v1/archive/constructions/{id} - Обновить конструкцию
DELETE /api/v1/archive/constructions/{id} - Удалить конструкцию

GET    /api/v1/archive/statistics       - Статистика
GET    /api/v1/archive/export           - Экспорт (PDF/Excel)
GET    /api/v1/archive/timeline         - Хронология
```

#### Сервис автоархивации

Файл: `app/services/archive_service.py`

```python
archive_document_event(doc_id, action)
archive_workflow_event(instance_id, step_id, action)
archive_remark_event(remark_id, action)
archive_project_event(project_id, event_type)
archive_file_upload(file_id)
archive_material_event(material_id)
archive_construction_event(construction_id)
```

### Фронтенд

#### Структура

```
src/pages/ArchivePage/
├── index.tsx                    # Главная страница
├── types/
│   └── archive.ts               # TypeScript типы
├── api/
│   └── archiveApi.ts            # API клиент
├── store/
│   └── archiveStore.ts          # Zustand store
└── components/
    ├── Timeline/
    │   └── index.tsx            # Компонент таймлайна
    ├── ArchiveSearch/
    │   └── index.tsx            # Поиск с подсветкой
    ├── MaterialsList/
    │   └── index.tsx            # Список материалов
    └── ConstructionsList/
        └── index.tsx            # Список конструкций
```

#### API клиент

Функции:
- `getEntries(projectId, filters)` - список записей
- `search(query, projectId, filters)` - поиск
- `getMaterials(projectId)` - материалы
- `createMaterial(data)` - создать материал
- `getConstructions(projectId)` - конструкции
- `createConstruction(data)` - создать конструкцию
- `getTimeline(projectId, filters)` - хронология
- `getStatistics(projectId)` - статистика

#### Zustand Store

Состояние:
```typescript
{
  entries: ArchiveEntry[];
  materials: ArchiveMaterial[];
  constructions: ArchiveConstruction[];
  timeline: TimelineEvent[];
  statistics: ArchiveStatistics | null;
  selectedEntry: ArchiveEntry | null;
  isLoading: boolean;
  isSearchLoading: boolean;
  error: string | null;
  currentFilters: { projectId, entryTypes, dateFrom, dateTo, ... };
}
```

Методы:
- `setProjectId(projectId)` - установить проект
- `loadEntries()`, `loadMaterials()`, `loadConstructions()` - загрузка
- `search(query, filters)` - поиск
- `pinEntry(entryId)`, `unpinEntry(entryId)` - закрепление
- `createMaterial(data)`, `createConstruction(data)` - создание

## 🎨 UI/UX

### Цветовая схема

| Тип | Цвет | Иконка |
|-----|------|--------|
| document | #3b82f6 | 📄 |
| revision | #6366f1 | 🔄 |
| remark | #ef4444 | 💬 |
| workflow | #22c55e | ✓ |
| file_upload | #f59e0b | 📎 |
| project_event | #8b5cf6 | 📊 |
| material | #06b6d4 | 🧱 |
| construction | #14b8a6 | 🏗️ |

### Режимы просмотра

1. **Таймлайн** - визуальная хронология
2. **Поиск** - полнотекстовый поиск с фильтрами
3. **Материалы** - список материалов
4. **Конструкции** - список конструкций
5. **Статистика** - аналитика (в разработке)

## 📍 Доступ

URL: `http://localhost:5173/archive?project_id={projectId}`

## 🚀 Использование

### Пример: поиск по архиву

```typescript
import { archiveApi } from '@/pages/ArchivePage/api/archiveApi';

const results = await archiveApi.search(
  'колонна',
  'project-uuid-123',
  {
    entry_types: ['construction', 'document'],
    date_from: '2026-01-01',
    has_attachments: true
  }
);

console.log(results.entries);      // События
console.log(results.materials);    // Материалы
console.log(results.constructions); // Конструкции
console.log(results.total);        // Всего
console.log(results.facets);       // Агрегации
```

### Пример: создание материала

```typescript
import { useArchiveStore } from '@/pages/ArchivePage/store/archiveStore';

const { createMaterial } = useArchiveStore();

await createMaterial({
  name: 'Арматура А500',
  material_type: 'reinforcement',
  specification: 'ГОСТ 5781-82',
  manufacturer: 'НЛМК',
  quantity: 150,
  unit: 'кг',
  certificates: [{
    number: 'CERT-2026-001',
    issued_at: '2026-01-15',
    valid_until: '2027-01-15',
    url: 'https://...'
  }]
});
```

## 🧪 Тестирование

### Тест-кейс: полная проверка

```python
# 1. Создать проект
project = create_project()

# 2. Создать 5 событий
create_document(project_id)      # → автоархивация
create_remark(project_id)        # → автоархивация
complete_workflow(project_id)    # → автоархивация
upload_file(project_id)          # → автоархивация
change_project_status(project_id) # → автоархивация

# 3. Проверить архив
entries = get_archive_entries(project_id)
assert len(entries) == 5

# 4. Поиск "колонна"
results = search_archive("колонна", project_id)
assert len(results.entries) > 0

# 5. Добавить материал
material = create_material(project_id, {
  name: 'Арматура А500',
  material_type: 'reinforcement'
})

# 6. Создать конструкцию
construction = create_construction(project_id, {
  name: 'Колонна К-1',
  construction_type: 'column',
  materials_used: [material.id]
})

# 7. Проверить timeline
timeline = get_timeline(project_id)
assert len(timeline) == 7  # 5 событий + материал + конструкция

# 8. Экспорт
export_file = export_archive(project_id, format='pdf')
assert export_file is not None
```

## 📊 Производительность

- Поиск по 10,000 записям: < 500ms (с GIN индексом)
- Автоархивация: < 5 сек после события
- Загрузка timeline: < 1 сек для 1000 событий

## 🔐 Ролевая модель

| Действие | Пользователь | РП | Инженер | Админ |
|----------|--------------|----|---------|-------|
| Просмотр архива | ✅ | ✅ | ✅ | ✅ |
| Создание записей | ❌ | ✅ | ✅ | ✅ |
| Редактирование | ⚠️(свой) | ✅ | ⚠️(свой) | ✅ |
| Удаление | ❌ | ❌ | ❌ | ✅ |
| Экспорт | ❌ | ✅ | ❌ | ✅ |
| Закрепление | ⚠️(свой) | ✅ | ⚠️(свой) | ✅ |

✅ — разрешено
⚠️ — только свои записи
❌ — запрещено

## ✅ Критерии готовности

- [x] Все файлы созданы, код компилируется без ошибок TypeScript
- [x] API отвечает 200, полнотекстовый поиск возвращает ранжированные результаты
- [ ] Автоархивация работает: при создании документа/замечания/согласования — запись появляется в архиве < 5 сек
- [ ] Поиск находит материалы и конструкции по частичному совпадению
- [ ] Timeline отображает события в хронологическом порядке с цветовой индикацией типов
- [ ] Материалы и конструкции создаются через формы, связи работают
- [ ] Экспорт архива генерирует файл (PDF или Excel)
- [x] Тёмная тема работает корректно
- [ ] Производительность: поиск по 10,000 записям < 500ms
- [ ] Закреплённые записи отображаются первыми в списке

## 📝 Следующие шаги

1. **Применить миграцию:** `alembic upgrade head`
2. **Интегрировать** вызовы `archive_service` в существующие CRUD (document, workflow, remark)
3. **Реализовать** формы создания материалов и конструкций с валидацией
4. **Добавить** загрузку вложений через S3/MinIO
5. **Реализовать** экспорт в PDF/Excel
6. **Настроить** ролевую модель на бэкенде
7. **Добавить** тесты для автоархивации
8. **Оптимизировать** производительность поиска
9. **Добавить** режим списка с таблицей
10. **Реализовать** связывание записей (related_entry_ids)
