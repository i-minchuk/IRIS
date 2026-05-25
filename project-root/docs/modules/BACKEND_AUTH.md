# Модуль: Auth (Аутентификация)

## Назначение
JWT-аутентификация, авторизация, управление пользователями. Центральный модуль уровня 0 — от него зависят все остальные.

## Файлы
```
backend/app/modules/auth/
  router.py      # HTTP-эндпоинты
  models.py      # SQLAlchemy: User
  schemas.py     # Pydantic: UserCreate, Token, LoginRequest и т.д.
  service.py     # Пустой (логика в router.py)
  repository.py  # UserRepository
  deps.py        # get_current_user, get_current_active_user
  cookies.py     # set_auth_cookies, clear_auth_cookies
  api.py, dto.py # Пустые
```

## Модель User
- `id`, `email`, `username`, `hashed_password`, `full_name`
- `role` (enum: admin, engineer, reviewer, etc.)
- `is_active`, `is_superuser`, `email_verified`
- `reset_token`, `reset_token_expires`

## Эндпоинты (`/api/v1/auth`)
| Method | Path | Описание |
|--------|------|----------|
| POST | `/register` | Регистрация |
| POST | `/login` | Login (JSON или OAuth2 form) |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout (чистит cookies) |
| POST | `/forgot-password` | Запрос сброса |
| POST | `/reset-password` | Сброс по токену |
| GET  | `/me` | Текущий пользователь |
| GET  | `/users` | Список (admin only) |
| PUT  | `/users/{id}` | Обновление (admin only) |

## Зависимости
- `app.core.security` — хеширование, JWT
- `app.core.security_utils` — rate limiting (SlowAPI 5/мин на /login)

## Что зависит от auth
- Все модули через `get_current_active_user` в deps.py
- WebSocket авторизация через query-param `?token=`

## Правила параллельной разработки
- **НЕ менять** сигнатуру `get_current_active_user` без согласования
- **НЕ добавлять** обязательные поля в User без миграции
- Можно расширять `UserRepository` новыми методами
- Cookies: HttpOnly, Secure, SameSite=Lax (production)
