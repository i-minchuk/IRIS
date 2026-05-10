# ДокПоток IRIS v4.0.0 MVP

## Быстрый старт (SQLite)

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

cd frontend
npm run dev
```

## Доступ

- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Login: admin@iris.local / admin123

## Работает

✅ Auth (JWT, login/logout)
✅ Projects (CRUD, 2 проекта)
✅ Remarks (CRUD, 5 замечаний)
✅ Tasks (список)
✅ Archive (UI с мок-данными)

## Известные проблемы

⚠️ Documents: таблица имеет старую схему, не совпадает с моделью
⚠️ Archive API: 500 на SQLite из-за UUID vs INTEGER несовместимости
⚠️ time_sessions: таблица отсутствует, дашборд без трекера времени

## Переход на PostgreSQL

См. docs/MIGRATION_TO_POSTGRES.md