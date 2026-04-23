#!/usr/bin/env python3
"""Скрипт для создания бэкапа PostgreSQL БД."""

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def get_env_var(name: str, default: str = "") -> str:
    """Получить переменную окружения."""
    return os.getenv(name, default)


def create_backup():
    """Создать бэкап БД."""
    # Конфигурация из .env
    db_user = get_env_var("DB_USER", "iris")
    db_password = get_env_var("DB_PASSWORD", "iris_secret_change_me")
    db_name = get_env_var("DB_NAME", "iris")
    db_host = get_env_var("DB_HOST", "localhost")
    db_port = get_env_var("DB_PORT", "5432")
    
    # Папка для бэкапов
    backup_dir = Path(get_env_var("BACKUP_DIR", "./backups"))
    backup_dir.mkdir(exist_ok=True)
    
    # Имя файла бэкапа
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"{db_name}_{timestamp}.sql.gz"
    
    print(f"📦 Создание бэкапа: {backup_file}")
    
    # Команда pg_dump
    env = os.environ.copy()
    env["PGPASSWORD"] = db_password
    
    cmd = [
        "pg_dump",
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "-F", "c",  # Custom format
        "-Z", "9",  # Compression level
        "-f", str(backup_file)
    ]
    
    try:
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            file_size = backup_file.stat().st_size / 1024 / 1024  # MB
            print(f"✅ Бэкап успешно создан: {backup_file.name} ({file_size:.2f} MB)")
            
            # Удалить старые бэкапы (старше 30 дней)
            cleanup_old_backups(backup_dir, days=30)
            return True
        else:
            print(f"❌ Ошибка при создании бэкапа:")
            print(result.stderr)
            return False
            
    except FileNotFoundError:
        print("❌ pg_dump не найден. Установите PostgreSQL client.")
        return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False


def cleanup_old_backups(backup_dir: Path, days: int = 30):
    """Удалить старые бэкапы."""
    print(f"\n🧹 Очистка бэкапов старше {days} дней...")
    
    now = datetime.now()
    deleted = 0
    
    for backup_file in backup_dir.glob("*.sql.gz"):
        age = now - datetime.fromtimestamp(backup_file.stat().st_mtime)
        if age.days > days:
            backup_file.unlink()
            deleted += 1
            print(f"  Удалено: {backup_file.name}")
    
    if deleted == 0:
        print("  Нет старых бэкапов для удаления")
    else:
        print(f"  Удалено {deleted} старых бэкапов")


def restore_backup(backup_file: str):
    """Восстановить БД из бэкапа."""
    db_user = get_env_var("DB_USER", "iris")
    db_password = get_env_var("DB_PASSWORD", "iris_secret_change_me")
    db_name = get_env_var("DB_NAME", "iris")
    db_host = get_env_var("DB_HOST", "localhost")
    db_port = get_env_var("DB_PORT", "5432")
    
    backup_path = Path(backup_file)
    if not backup_path.exists():
        print(f"❌ Файл бэкапа не найден: {backup_file}")
        return False
    
    print(f"🔄 Восстановление из: {backup_path}")
    
    env = os.environ.copy()
    env["PGPASSWORD"] = db_password
    
    cmd = [
        "pg_restore",
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "--clean",
        "--if-exists",
        "--no-owner",
        str(backup_path)
    ]
    
    try:
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0 or "WARNING" in result.stdout:
            print("✅ БД успешно восстановлена!")
            return True
        else:
            print(f"❌ Ошибка восстановления:")
            print(result.stderr)
            return False
            
    except FileNotFoundError:
        print("❌ pg_restore не найден. Установите PostgreSQL client.")
        return False


def main():
    """Основная функция."""
    if len(sys.argv) < 2:
        print("Использование:")
        print("  python backup_db.py backup   - создать бэкап")
        print("  python backup_db.py restore  - восстановить из бэкапа")
        print("  python backup_db.py list     - список бэкапов")
        sys.exit(1)
    
    action = sys.argv[1].lower()
    
    if action == "backup":
        success = create_backup()
        sys.exit(0 if success else 1)
    
    elif action == "restore":
        if len(sys.argv) < 3:
            # Показать последний бэкап
            backup_dir = Path(get_env_var("BACKUP_DIR", "./backups"))
            backups = sorted(backup_dir.glob("*.sql.gz"), reverse=True)
            if backups:
                print(f"Последний бэкап: {backups[0]}")
                confirm = input("Восстановить? (y/n): ")
                if confirm.lower() == "y":
                    success = restore_backup(str(backups[0]))
                    sys.exit(0 if success else 1)
            else:
                print("❌ Бэкапы не найдены")
                sys.exit(1)
        else:
            success = restore_backup(sys.argv[2])
            sys.exit(0 if success else 1)
    
    elif action == "list":
        backup_dir = Path(get_env_var("BACKUP_DIR", "./backups"))
        backups = sorted(backup_dir.glob("*.sql.gz"), reverse=True)
        
        if not backups:
            print("Бэкапы не найдены")
            sys.exit(0)
        
        print(f"\n{'Файл':<40} {'Размер':<10} {'Дата':<20}")
        print("-" * 70)
        
        for backup in backups[:10]:  # Показать последние 10
            size = backup.stat().st_size / 1024 / 1024
            mtime = datetime.fromtimestamp(backup.stat().st_mtime)
            print(f"{backup.name:<40} {size:>6.2f} MB  {mtime.strftime('%Y-%m-%d %H:%M')}")
        
        if len(backups) > 10:
            print(f"... и ещё {len(backups) - 10} бэкапов")
    
    else:
        print(f"Неизвестное действие: {action}")
        sys.exit(1)


if __name__ == "__main__":
    main()
