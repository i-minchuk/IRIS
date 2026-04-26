# ДокПоток IRIS — Руководство разработчика

## 📋 Содержание
- [Быстрый старт](#быстрый-старт)
- [Архитектура](#архитектура)
- [Разработка](#разработка)
- [Тестирование](#тестирование)
- [Деплой](#деплой)
- [Безопасность](#безопасность)

---

## Быстрый старт

### Требования
- Python 3.12+
- Node.js 20+
- PostgreSQL 15+ (или Docker Desktop)
- Git

### 1. Клонировать репозиторий
```bash
git clone https://github.com/i-minchuk/IRIS.git
cd IRIS
```

### 2. Настроить backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# или
.venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### 3. Настроить базу данных

#### Вариант A: PostgreSQL через Docker (рекомендуется)
```bash
docker compose -f docker-compose.prod.yml up -d db
```

#### Вариант B: SQLite для быстрой разработки
```bash
# Изменить backend/.env:
# DATABASE_URL=sqlite+aiosqlite:///./iris.db
pip install aiosqlite
```

### 4. Применить миграции
```bash
cd backend
alembic upgrade head
```

### 5. Создать тестовые данные
```bash
python scripts/seed_data.py
```

### 6. Запустить backend
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Настроить frontend
```bash
cd frontend
npm install
```

### 8. Запустить frontend
```bash
npm run dev
```

---

## Архитектура

### Backend
```
backend/
├── app/
│   ├── api/              # API роуты
│   ├── core/             # Конфигурация, security
│   ├── db/               # База данных, сессии
│   ├── modules/          # Бизнес-модули
│   │   ├── auth/         # Аутентификация
│   │   ├── projects/     # Проекты
│   │   ├── documents/    # Документы
│   │   └── ...
│   ├── utils/            # Утилиты
│   └── main.py           # Точка входа
├── alembic/              # Миграции БД
├── scripts/              # Скрипты (seed, checks)
└── tests/                # Тесты
```

### Frontend
```
frontend/
├── src/
│   ├── app/              # Роутинг, Layout
│   ├── features/         # Фичи по доменам
│   │   ├── auth/
│   │   ├── projects/
│   │   └── ...
│   ├── shared/           # Общие компоненты
│   ├── providers/        # ThemeProvider, etc.
│   └── api/              # API клиенты
└── public/               # Статические файлы
```

### Принцип разделения
- **Backend**: Модули не зависят друг от друга (проверяется `scripts/check_architecture.py`)
- **Frontend**: Feature-sliced design, чёткое разделение на features/shared

---

## Разработка

### Git workflow
```bash
# Создавать ветку от develop
git checkout develop
git checkout -b feature/your-feature-name

# Commit сёмантичный
git commit -m "feat: добавить CRUD проектов"

# Push и создать PR
git push origin feature/your-feature-name
```

### Правила коммитов
- `feat:` — новая функциональность
- `fix:` — исправление бага
- `refactor:` — рефакторинг без изменения поведения
- `chore:` — инструменты, конфигурация
- `docs:` — документация
- `test:` — тесты

### Feature flags
Использовать для постепенного включения фич:
```typescript
// frontend/src/shared/config/featureFlags.ts
export const featureFlags = {
  darkTheme: true,
  newProjectsUI: false,  // Включить в PR
  analytics: false,
};
```

---

## Тестирование

### Backend
```bash
# Все тесты
pytest tests/ -v

# С coverage
pytest tests/ --cov=app --cov-report=html

# Конкретный модуль
pytest tests/test_auth.py -v

# Исключить медленные тесты
pytest tests/ -m "not slow"
```

### Frontend
```bash
# Все тесты
npm run test

# С coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

### Требования к тестам
- Backend: ≥70% coverage (проверяется в CI)
- Frontend: критические компоненты (auth, projects)
- Интеграционные тесты для API endpoints

---

## Деплой

### Production requirements
- SECRET_KEY (мин. 32 символа)
- HTTPS/WSS
- PostgreSQL (не SQLite)
- BACKEND_CORS_ORIGINS настроен

### Docker production
```bash
# Build
docker compose -f docker-compose.prod.yml build

# Запустить
docker compose -f docker-compose.prod.yml up -d

# Логи
docker compose -f docker-compose.prod.yml logs -f
```

### Переменные окружения
См. `backend/.env.example` и `frontend/.env.example`

### Проверка перед релизом
См. `RELEASE_CHECKLIST.md`

---

## Безопасность

### Обязательное
- [ ] SECRET_KEY ≠ дефолтный
- [ ] HTTPS включён
- [ ] Rate limiting активен
- [ ] BACKEND_CORS_ORIGINS ограничен

### Проверки
```bash
# Проверка архитектуры
python backend/scripts/check_architecture.py

# Проверка зависимостей
safety check -r backend/requirements.txt
npm audit --audit-level=moderate
```

### Инциденты
См. `SECURITY.md`

---

## Полезные команды

### Backend
```bash
# Миграции
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Проверка архитектуры
python scripts/check_architecture.py

# Seed данных
python scripts/seed_data.py
```

### Frontend
```bash
# Lint
npm run lint

# Format
npm run format

# Build
npm run build

# Preview build
npm run preview
```

---

## Контакты

- **Технический лидер**: @i-minchuk
- **Вопросы по архитектуре**: open issue в GitHub
- **Баги**: open issue с тегом `bug`

---

**Последнее обновление**: 2024-04-25
