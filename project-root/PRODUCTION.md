# DokPotok IRIS - Production Deployment Guide

## Быстрый старт для production

### 1. Генерация SECRET_KEY

```bash
cd backend
python scripts/generate_secret_key.py
```

Сохраните сгенерированный ключ в `.env`:
```env
SECRET_KEY=<сгенерированный_ключ>
```

### 2. Настройка окружения

```bash
# Backend
cp backend/.env.example backend/.env
# Отредактируйте backend/.env и установите:
# - SECRET_KEY (сгенерированный выше)
# - DATABASE_URL
# - BACKEND_CORS_ORIGINS=["https://yourdomain.com"]

# Frontend  
cp frontend/.env.example frontend/.env
# Установите VITE_API_URL=https://yourdomain.com/api
```

### 3. SSL сертификаты (Let's Encrypt)

```bash
# Установите certbot
sudo apt-get install certbot python3-certbot-nginx

# Получите сертификаты
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4. Запуск через Docker Compose

```bash
# Собрать и запустить
docker compose -f docker-compose.prod.yml up -d

# Проверить логи
docker compose -f docker-compose.prod.yml logs -f
```

### 5. Проверка безопасности

```bash
# Проверить SECRET_KEY
python backend/scripts/generate_secret_key.py --check <YOUR_KEY>

# Проверить зависимости на уязвимости
cd backend
pip install safety
safety check -r requirements.txt
```

---

## Архитектура безопасности

### Аутентификация

- **HttpOnly cookies** (рекомендуется для production)
- **JWT токены**: access (24ч) + refresh (7 дней)
- **Rate limiting**: 5 запросов/минута на /login

### Security Headers

Все API ответы содержат:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000`
- `Cache-Control: no-store`

### WebSocket

- **WSS** (через nginx)
- **Origin проверка**
- **Лимит**: 5 подключений на пользователя
- **Валидация**: Pydantic для всех сообщений

---

## Мониторинг

### Логи

```bash
# Backend логи
docker compose -f docker-compose.prod.yml logs backend

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Здоровье системы

```bash
curl https://yourdomain.com/health
```

---

## Troubleshooting

### Проблемы с cookies

Если cookies не устанавливаются:
1. Проверьте `Secure` флаг (нужен HTTPS)
2. Проверьте `SameSite` настройка
3. Убедитесь, что nginx передаёт `Set-Cookie`

### Rate limiting срабатывает слишком часто

Увеличьте лимиты в `backend/app/modules/auth/router.py`:
```python
@limiter.limit("10/minute")  # Вместо 5
```

### WebSocket не подключается

1. Проверьте, что nginx конфигурация для `/api/v1/ws` правильная
2. Убедитесь, что используется `wss://` вместо `ws://`
3. Проверьте Origin header в запросе

---

## Обновление

```bash
# Остановить контейнеры
docker compose -f docker-compose.prod.yml down

# Обновить код
git pull

# Пересобрать образы
docker compose -f docker-compose.prod.yml build

# Запустить
docker compose -f docker-compose.prod.yml up -d
```

---

## Откат

```bash
# Вернуть предыдущую версию
git revert HEAD
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```
