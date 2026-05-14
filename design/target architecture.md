FastAPI

backend/
├── app/
│   ├── api/                 # роутеры (эндпоинты)
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   └── ...
│   │   └── deps.py          # зависимости (get_db, get_current_user)
│   ├── core/                # конфигурация, безопасность, общие утилиты
│   │   ├── config.py
│   │   ├── security.py
│   │   └── exceptions.py
│   ├── crud/                # функции работы с БД (CRUD)
│   ├── db/                  # сессия БД, базовый класс моделей
│   ├── models/              # SQLAlchemy модели
│   ├── schemas/             # Pydantic схемы
│   └── main.py              # точка входа


React + TypeScript

frontend/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── projects/
│   └── documents/
├── shared/
│   ├── ui/                  # переиспользуемые компоненты (Button, Input...)
│   ├── lib/                 # утилиты, axios-инстанс
│   └── styles/              # глобальные стили, Tailwind конфиг
├── app/                     # роутинг, главный layout, стор
└── main.tsx

