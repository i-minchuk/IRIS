# Модуль: Core (Ядро системы)

## Назначение
Конфигурация, безопасность, middleware, исключения, кэш, логирование, enums. Уровень 0.

## Файлы
```
backend/app/core/
  config.py          # Pydantic Settings
  security.py        # Хеширование, JWT
  security_utils.py  # Rate limiting, IP, secret key validation
  exceptions.py      # Глобальные обработчики исключений
  middleware.py      # PerformanceMiddleware
  cache.py           # RedisCache + InMemoryCache fallback
  logging_config.py  # Логирование
  enums.py           # Глобальные enums
```

## Settings (config.py)
- `PROJECT_NAME`, `VERSION`, `API_V1_STR`
- `DATABASE_URL`, `SECRET_KEY` (валидация: min 32 символа, не дефолт)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (1440 = 24ч), `REFRESH_TOKEN_EXPIRE_DAYS` (7)
- `BACKEND_CORS_ORIGINS` — список origins
- `REDIS_URL`
- AI: `OPENAI_API_KEY`, `LLM_MODEL`, `EMBEDDING_MODEL`, `QDRANT_HOST`, `CHUNK_SIZE`, `MAX_CONTEXT_TOKENS`

## Security
- JWT: HS256. Три типа токенов: access, refresh, reset
- Bcrypt для паролей
- Rate limiting: `/login` 5/мин, `/refresh` 10/мин (SlowAPI)

## Cache
- `RedisCache` — async Redis wrapper
- `InMemoryCache` — fallback с TTL
- Глобальный `cache` instance, инициализация через `init_cache()`

## Middleware
- `PerformanceMiddleware` — логирует запросы >1с, добавляет `X-Process-Time`

## Enums
- `TaskType`, `TaskStatus`, `TaskPriority`
- `OperationStatus`, `DocumentStatus`

## Правила параллельной разработки
- **НЕ менять** `SECRET_KEY` валидацию
- **НЕ менять** JWT алгоритм без миграции токенов
- Новые enums — добавлять сюда, импортировать в модули
- `cache` — глобальный singleton, можно использовать из любого модуля
