# ДокПоток IRIS v4.6.0 MVP

## Быстрый старт (SQLite)

```bash
cd project-root/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

cd project-root/frontend
npm run dev
```

## Режимы работы (demo / prod)

Режим выбирается переменной окружения `MODE` (дефолт: `prod`), код не меняется:

```bash
# Демо для заказчика: вымышленные данные, экспорты/интеграции отключены
MODE=demo python -m uvicorn app.main:app --port 8000

# Рабочий режим для тестовой группы: полный функционал, логи в файл, метрики
MODE=prod python -m uvicorn app.main:app --port 8000
```

Windows: `scripts/СТАРТ.bat` (prod) и `scripts/СТАРТ_ДЕМО.bat` (demo).

Документация: `project-root/docs/DEMO_GUIDE.md` (сценарий презентации),
`project-root/docs/PILOT_CHECKLIST.md` (запуск тестовой группы),
`project-root/docs/DATA_LOADING.md` (демо-данные и загрузка реальных).

Проверка режима: `GET /api/v1/meta` → `{mode, version, features}`;
smoke-скрипт `project-root/backend/scripts/smoke_modes.py`.

## Доступ

- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Демо-вход (режим demo): demo@iris.local / demo1234

## Переход на PostgreSQL

См. docs/MIGRATION_TO_POSTGRES.md
