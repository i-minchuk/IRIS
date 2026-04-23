# 📋 Чеклист перед релизом DokPotok IRIS

## ✅ Выполнено

### 1. SECRET_KEY сгенерирован (не дефолтный)
- [x] Сгенерирован через `python scripts/generate_secret_key.py`
- [x] Установлен в `backend/.env`
- [x] Проверка при запуске приложения
- [ ] **Действие**: Замените на свой уникальный ключ

### 2. BACKEND_CORS_ORIGINS настроен
- [x] Валидация при запуске
- [x] По умолчанию только localhost (для development)
- [ ] **Действие**: Замените на ваши production домены в `backend/.env`:
  ```env
  BACKEND_CORS_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]
  ```

### 3. HTTPS включён
- [x] Nginx конфигурация с SSL (`nginx/dokpotok-iris`)
- [x] HSTS заголовок для HTTPS
- [x] Перенаправление HTTP → HTTPS
- [ ] **Действие**: Установите SSL сертификаты (Let's Encrypt):
  ```bash
  sudo certbot --nginx -d yourdomain.com
  ```

### 4. Rate limiting добавлен
- [x] `/login`: 5 запросов/минута
- [x] `/login/oauth2`: 5 запросов/минута
- [x] `/refresh`: 10 запросов/минута
- [x] Интеграция через `slowapi`
- [ ] **Действие**: Протестируйте лимиты

### 5. Все зависимости обновлены (`safety check`)
- [x] `safety` добавлен в `requirements.txt`
- [x] Скрипт проверки `scripts/security_check.py`
- [ ] **Действие**: Запустите проверку:
  ```bash
  cd backend
  pip install -r requirements.txt
  python scripts/security_check.py
  ```

### 6. Логи подключены к мониторингу
- [x] Логирование в файлы (`logs/app_YYYYMM.log`)
- [x] Отдельный лог для ошибок (`logs/error_YYYYMM.log`)
- [x] RotatingFileHandler (10 MB, 5 файлов)
- [x] Docker logging (json-file, 10 MB, 3 файла)
- [x] Health check endpoint
- [ ] **Действие**: Настройте сбор логов (ELK, CloudWatch, или аналог)

### 7. Backup БД настроен
- [x] Скрипт бэкапа `scripts/backup_db.py`
- [x] Автоматическая очистка старых бэкапов (30 дней)
- [x] Systemd service (`systemd/iris-backup.service`)
- [x] Systemd timer (`systemd/iris-backup.timer`)
- [x] Документация (`docs/BACKUP.md`)
- [ ] **Действие**: Настройте cron/systemd timer:
  ```bash
  # Скопируйте файлы в systemd
  sudo cp systemd/iris-backup.service /etc/systemd/system/
  sudo cp systemd/iris-backup.timer /etc/systemd/system/
  
  # Активируйте таймер
  sudo systemctl daemon-reload
  sudo systemctl enable iris-backup.timer
  sudo systemctl start iris-backup.timer
  
  # Проверьте статус
  sudo systemctl status iris-backup.timer
  ```

---

## 🚀 Дополнительные рекомендации

### Мониторинг
- [ ] Настройте Sentry для отслеживания ошибок
- [ ] Настройте Prometheus + Grafana для метрик
- [ ] Настройте алерты для критических ошибок

### Безопасность
- [ ] Регулярно обновляйте зависимости (`safety fix`)
- [ ] Проверяйте SECRET_KEY перед каждым релизом
- [ ] Тестируйте восстановление из бэкапа раз в месяц

### Производительность
- [ ] Настройте кэширование (Redis)
- [ ] Настройте CDN для статики
- [ ] Оптимизируйте SQL запросы

---

## 📝 Перед каждым релизом

```bash
# 1. Проверка SECRET_KEY
python backend/scripts/generate_secret_key.py --check $(grep SECRET_KEY backend/.env | cut -d'=' -f2)

# 2. Проверка зависимостей
cd backend && pip install -r requirements.txt && safety check -r requirements.txt

# 3. Запуск тестов
pytest -q --cov=app

# 4. Проверка бэкапа
python backend/scripts/backup_db.py backup

# 5. Проверка логов
tail -n 50 backend/logs/app_*.log
```

---

## 🆘 Экстренные ситуации

### Скомпрометирован SECRET_KEY
1. Сгенерировать новый ключ
2. Обновить `.env`
3. Перезапустить backend
4. Все токены станут невалидными

### Проблемы с БД
```bash
# Восстановить из бэкапа
python backend/scripts/backup_db.py restore

# Показать последние бэкапы
python backend/scripts/backup_db.py list
```

### Высокая нагрузка
```bash
# Проверить логи
tail -f backend/logs/error_*.log

# Проверить rate limiting
grep "429" backend/logs/app_*.log | wc -l
```

---

**Версия чеклиста**: 1.0  
**Последнее обновление**: 2024  
**Статус**: ✅ Готов к production
