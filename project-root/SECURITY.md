# Безопасность - ДокПоток IRIS

## Аутентификация и авторизация

### JWT Токены

| Параметр | Значение |
|----------|----------|
| Алгоритм | HS256 |
| Access token TTL | 24 часа |
| Refresh token TTL | 7 дней |
| Секретный ключ | Требуется через `SECRET_KEY` env (мин. 32 символа) |

#### Хранение токенов
- **Development**: localStorage (для удобства разработки)
- **Production**: HttpOnly cookies (рекомендуется)

**Переключение**: Используйте query параметр `?response_type=json` для JSON response вместо cookies.

### Пароли
- Алгоритм: bcrypt
- Соль: автоматическая
- Минимальная длина: 8 символов (рекомендуется)

## Rate Limiting

### Реализовано
| Endpoint | Лимит |
|----------|-------|
| `/api/v1/auth/login` | 5 запросов/минута |
| `/api/v1/auth/login/oauth2` | 5 запросов/минута |
| `/api/v1/auth/refresh` | 10 запросов/минута |

**Что происходит при превышении**: Возвращается `429 Too Many Requests`

## WebSocket Безопасность

### Аутентификация
- Токен передаётся через query параметр `?token=<access_token>`
- Проверка `type: "access"` в JWT payload
- Проверка `is_active` пользователя в БД

### Защита от атак

| Атака | Защита |
|-------|--------|
| CSRF | Проверка Origin header + SameSite cookies |
| DoS (много подключений) | Макс. 5 подключений на пользователя |
| DoS (большие сообщения) | Лимит 64KB на сообщение |
| Injection | Pydantic валидация всех сообщений |

### Допустимые Origin
Конфигурируется через `BACKEND_CORS_ORIGINS` в `.env`:
```env
BACKEND_CORS_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]
```

## HTTPS/WSS

### Production
- **Обязательно** использовать HTTPS
- WebSocket должен быть `wss://`
- Перенаправление HTTP → HTTPS на уровне nginx
- HSTS заголовок включён

### Nginx конфигурация
См. `nginx/dokpotok-iris` для готовой конфигурации.

## Security Headers

Все API ответы содержат следующие заголовки:

| Заголовок | Значение | Цель |
|-----------|----------|------|
| X-Content-Type-Options | nosniff | Защита от MIME sniffing |
| X-Frame-Options | DENY | Защита от clickjacking |
| X-XSS-Protection | 1; mode=block | XSS защита (старые браузеры) |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Принудительный HTTPS |
| Referrer-Policy | strict-origin-when-cross-origin | Контроль referrer |
| Permissions-Policy | geolocation=(), microphone=(), camera=() | Отключение ненужных функций |
| Cache-Control | no-store, no-cache, must-revalidate, private | Защита от кэширования |

## HttpOnly Cookies

### Преимущества перед localStorage
- **Защита от XSS**: Cookies недоступны через JavaScript
- **Автоматическая отправка**: Не нужно вручную добавлять в заголовки
- **SameSite защита**: Автоматическая защита от CSRF

### Как использовать
```bash
# Login с cookies (по умолчанию)
POST /api/v1/auth/login

# Login с JSON response (для совместимости)
POST /api/v1/auth/login?response_type=json
```

## SECRET_KEY

### Требования
- Минимум 32 символа
- Содержать буквы и цифры
- Не использовать дефолтное значение

### Генерация
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Проверка
При запуске backend проверяет SECURE_KEY и выводит предупреждение, если он небезопасен.

## Мониторинг безопасности

### Логи
- Все 401 ошибки логируются
- WebSocket disconnect с кодом 1008 логируются
- Ошибки валидации сообщений логируются
- Rate limit превышения логируются

### Sentry
- Ошибки 5xx отправляются в Sentry
- Критические ошибки WebSocket логируются в консоль

## Инциденты

### Если скомпрометирован SECRET_KEY
1. Сгенерировать новый SECRET_KEY (минимум 32 символа)
2. Реквартить все токены (они станут невалидными)
3. Обновить переменную окружения
4. Перезапустить backend

### Если скомпрометирован пользовательский аккаунт
1. Сбросить пароль пользователя
2. Отозвать все сессии (удалить cookies)
3. Проверить логи на подозрительную активность

## Проверки при каждом релизе

- [ ] SECRET_KEY не используется дефолтный (мин. 32 символа)
- [ ] BACKEND_CORS_ORIGINS содержит только доверенные домены
- [ ] HTTPS включён в production
- [ ] Rate limiting настроен для `/login` и `/refresh`
- [ ] Все зависимости обновлены (`safety check -r requirements.txt`)
- [ ] HttpOnly cookies включены (рекомендуется)
- [ ] HSTS заголовок включён
- [ ] Nginx конфигурация проверена
- [ ] **Архитектура проверена** (`python scripts/check_architecture.py`)

## Чеклист для production deployment

```markdown
1. Backend
   [ ] SECRET_KEY сгенерирован и установлен
   [ ] DATABASE_URL использует production БД
   [ ] BACKEND_CORS_ORIGINS настроен
   [ ] IRIS_LOG_LEVEL=INFO или WARNING

2. Frontend
   [ ] VITE_API_URL указывает на production API
   [ ] Построен через `npm run build`

3. Nginx
   [ ] SSL сертификаты установлены (Let's Encrypt)
   [ ] Конфигурация протестирована (`nginx -t`)
   [ ] Перенаправление HTTP → HTTPS работает

4. Docker
   [ ] docker-compose.prod.yml используется
   [ ] Все переменные окружения установлены
   [ ]Volumes настроены для БД

5. Мониторинг
   [ ] Логи собираются
   [ ] Sentry настроен (опционально)
   [ ] Backup БД настроен
```

## Контакты

По вопросам безопасности: `security@dokpotok.iris` (заменить на реальный email)

## История изменений

| Версия | Дата | Изменения |
|--------|------|-----------|
| 2.0 | 2024 | Добавлен rate limiting, HttpOnly cookies, security headers, архитектура |
| 1.0 | 2024 | Initial security documentation |
