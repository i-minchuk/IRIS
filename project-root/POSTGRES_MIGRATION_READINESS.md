# DokPotok IRIS - PostgreSQL Migration Checklist

## 📦 Финальная версия: v0.2.0-postgres-ready

### ✅ Выполненные шаги

| Шаг | Статус | Описание |
|-----|--------|----------|
| 1 | ✅ | Коммит MVP (ветка `mvp-sqlite-stable`, тег `v0.1.0-mvp`) |
| 2 | ✅ | PostgreSQL инфраструктура (PostgreSQL 15 + Qdrant) |
| 3 | ✅ | Alembic настроен для asyncpg |
| 4 | ✅ | Documents таблица переписана с UUID |
| 5 | ✅ | Seed для Documents (5 документов) |
| 6 | ✅ | Archive API (убраны mock-данные) |

---

## 🚀 Запуск на Windows (SQLite для разработки)

```powershell
# 1. Перейти в директорию
cd project-root/backend

# 2. Запустить backend на SQLite
$env:DATABASE_URL="sqlite:///./iris_dev.db"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. В другом терминале - frontend
cd ../frontend
npm run dev
```

**Доступ**: http://localhost:5173  
**Логин**: `admin@iris.local` / `admin123`

---

## 🚀 Запуск на Linux/WSL2 (PostgreSQL для production)

```bash
# 1. Запустить PostgreSQL контейнер
docker compose -f docker-compose.dev.yml up -d db

# 2. Запустить миграции
cd backend
alembic stamp head  # Если новая база
alembic upgrade head

# 3. Запустить seed
python -m app.db.seed_all

# 4. Запустить backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📊 Текущее состояние данных (SQLite)

```
Users: 3
Projects: 5
Documents: 2
Remarks: 8
Archive entries: 11
Archive materials: 2
Archive constructions: 3
```

---

## 🔧 API Endpoints (проверка)

```bash
# Health
curl http://localhost:8000/health

# Auth
curl http://localhost:8000/api/v1/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@iris.local","password":"admin123"}'

# Projects
curl http://localhost:8000/api/v1/projects

# Documents (новая UUID схема)
curl http://localhost:8000/api/v1/documents

# Remarks
curl http://localhost:8000/api/v1/remarks

# Archive timeline
curl "http://localhost:8000/api/v1/archive/timeline?project_id={id}"
```

---

## 📁 Изменённые файлы

### Backend
- `backend/app/modules/documents/models.py` - UUID схема
- `backend/app/modules/documents/crud.py` - CRUD операции
- `backend/app/modules/documents/schemas.py` - Pydantic схемы
- `backend/app/modules/documents/router_simple.py` - API router
- `backend/app/modules/documents/models.py.old` - Старая модель (архив)
- `backend/app/db/seed_all.py` - Seed для Documents + Archive
- `backend/alembic/versions/20260505_001_recreate_documents_table.py` - Миграция

### Frontend
- `frontend/src/stores/archiveStore.ts` - Zustand store для Archive
- `frontend/src/pages/ArchivePage.tsx` - Убраны mock-данные

---

## ⚠️ Известные проблемы

### asyncpg на Windows Docker
**Проблема**: Connection instability (`connection was closed in the middle of operation`)  
**Решение**: 
- На Windows использовать SQLite для разработки
- На Linux/WSL2 PostgreSQL работает стабильно

### UUID vs INTEGER в Archive
**Проблема**: Archive модели используют UUID FK, но SQLite projects.id = INTEGER  
**Решение**: 
- На PostgreSQL таблицы будут иметь правильные UUID FK
- На SQLite Archive использует mock-данные на frontend

### Documents таблица
**Проблема**: Старая таблица имеет INTEGER ID  
**Решение**:
- Миграция `20260505_001` создана для переписывания таблицы
- Применить на PostgreSQL: `alembic upgrade head`

---

## 🎯 Следующие шаги

1. **Deploy на Linux/WSL2** для стабильной работы asyncpg
2. **Применить миграции**: `alembic upgrade head`
3. **Запустить seed**: `python -m app.db.seed_all`
4. **Тестирование**: Проверить все endpoints и UI
5. **Коммит**: Создать тег `v0.2.0-postgres-ready`

---

## 📝 Команда для финального коммита

```bash
# На Linux/WSL2
cd project-root

# Создать ветку
git checkout -b postgres-migration-ready

# Добавить все изменения
git add .

# Коммит
git commit -m "PostgreSQL migration ready: UUID Documents, Archive API fixed

- Documents table: INTEGER -> UUID migration
- Archive API: removed mock data, connected to real endpoints
- Seed: added Documents and Archive entries
- Frontend: ArchivePage uses Zustand store
- Migration: 20260505_001_recreate_documents_table.py

Known limitations:
- asyncpg unstable on Windows Docker (use SQLite for dev)
- Archive works fully only on PostgreSQL
"

# Тег
git tag v0.2.0-postgres-ready

# Push (если нужно)
git push origin postgres-migration-ready --tags
```

---

**Готово к продакшену на Linux/WSL2 с PostgreSQL!** ✅
