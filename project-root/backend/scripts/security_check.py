#!/usr/bin/env python3
"""Проверка зависимостей на уязвимости."""

import subprocess
import sys


def run_security_check():
    """Запуск safety check."""
    print("=" * 60)
    print("Проверка зависимостей на уязвимости (safety check)")
    print("=" * 60)
    
    try:
        result = subprocess.run(
            ["safety", "check", "-r", "requirements.txt"],
            check=True,
            capture_output=False
        )
        print("\n✓ Все зависимости безопасны!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Обнаружены уязвимости: {e}")
        print("\nДля обновления используйте:")
        print("  safety fix")
        return False
    except FileNotFoundError:
        print("\n✗ safety не установлен. Установите через:")
        print("  pip install safety")
        return False


def check_secret_key():
    """Проверка SECRET_KEY."""
    print("\n" + "=" * 60)
    print("Проверка SECRET_KEY")
    print("=" * 60)
    
    import os
    from app.core.security_utils import is_secure_secret_key
    
    secret_key = os.getenv("SECRET_KEY", "")
    
    if is_secure_secret_key(secret_key):
        print("✓ SECRET_KEY безопасен для production")
        return True
    else:
        print("✗ SECRET_KEY небезопасен!")
        print("  Сгенерируйте новый через:")
        print("  python scripts/generate_secret_key.py")
        return False


def main():
    """Основная функция."""
    print("\n🔒 Security Check для DokPotok IRIS\n")
    
    results = []
    
    # Проверка SECRET_KEY
    results.append(check_secret_key())
    
    # Проверка зависимостей
    results.append(run_security_check())
    
    # Итог
    print("\n" + "=" * 60)
    if all(results):
        print("✅ Все проверки пройдены успешно!")
        sys.exit(0)
    else:
        print("❗ Есть проблемы, которые нужно исправить")
        sys.exit(1)


if __name__ == "__main__":
    main()
