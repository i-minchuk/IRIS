# Бэкапы базы данных DokPotok IRIS

## Создание бэкапа

```bash
# Ручной бэкап
python backend/scripts/backup_db.py backup

# Автоматический бэкап (через cron)
0 2 * * * cd /path/to/dokpotok-iris && python backend/scripts/backup_db.py backup >> /var/log/iris_backup.log 2>&1
```

## Восстановление из бэкапа

```bash
# Показать список бэкапов
python backend/scripts/backup_db.py list

# Восстановить последний бэкап
python backend/scripts/backup_db.py restore

# Восстановить конкретный бэкап
python backend/scripts/backup_db.py restore backups/iris_20240115_120000.sql.gz
```

## Конфигурация

Переменные окружения в `.env`:

```env
DB_USER=iris
DB_PASSWORD=iris_secret_change_me
DB_NAME=iris
DB_HOST=localhost
DB_PORT=5432
BACKUP_DIR=./backups
```

## Хранение бэкапов

- Бэкапы хранятся 30 дней (автоматическая очистка)
- Формат: сжатый PostgreSQL custom dump
- Размер: обычно 10-100 MB в зависимости от данных

## Рекомендации

1. **Ежедневные бэкапы** - через cron в 2:00
2. **Хранение вне сервера** - копируйте на S3/другой сервер
3. **Тестирование восстановления** - раз в месяц проверяйте работоспособность
4. **Мониторинг** - настройте алерты при неудачном бэкапе

## Пример cron job

```bash
# Отредактируйте crontab
crontab -e

# Добавьте строку (ежедневно в 2:00)
0 2 * * * cd /opt/dokpotok-iris && VIRTUAL_ENV=/opt/dokpotok-iris/venv $VIRTUAL_ENV/bin/python backend/scripts/backup_db.py backup >> /var/log/iris_backup.log 2>&1
```
