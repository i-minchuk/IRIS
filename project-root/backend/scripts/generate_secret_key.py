#!/usr/bin/env python3
"""Скрипт для генерации безопасного SECRET_KEY."""

import secrets
import sys


def generate_key(length: int = 32) -> str:
    """Генерация безопасного ключа."""
    return secrets.token_urlsafe(length)


def check_key(key: str) -> tuple[bool, list[str]]:
    """Проверка безопасности ключа."""
    issues = []
    
    if len(key) < 32:
        issues.append(f"Ключ слишком короткий: {len(key)} символов (минимум 32)")
    
    default_keys = [
        "your-super-secret-key-change-in-production-please",
        "change-me-in-production-min-32-chars-long",
        "secret",
        "password",
        "12345678901234567890123456789012",
    ]
    
    if key in default_keys:
        issues.append("Используется дефолтное значение!")
    
    if not any(c.isalpha() for c in key):
        issues.append("Ключ должен содержать буквы")
    
    if not any(c.isdigit() for c in key):
        issues.append("Ключ должен содержать цифры")
    
    return len(issues) == 0, issues


def main():
    """Основная функция."""
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        if len(sys.argv) < 3:
            print("Usage: python generate_secret_key.py --check <KEY>")
            sys.exit(1)
        
        key = sys.argv[2]
        is_valid, issues = check_key(key)
        
        if is_valid:
            print("✓ Ключ безопасен для production")
            sys.exit(0)
        else:
            print("✗ Ключ небезопасен:")
            for issue in issues:
                print(f"  - {issue}")
            sys.exit(1)
    
    # Генерация нового ключа
    new_key = generate_key()
    
    print("=" * 60)
    print("Сгенерирован новый SECRET_KEY:")
    print("=" * 60)
    print()
    print(new_key)
    print()
    print("=" * 60)
    print("Добавьте в .env:")
    print("=" * 60)
    print(f"SECRET_KEY={new_key}")
    print()
    print("Или проверьте существующий ключ:")
    print(f"  python generate_secret_key.py --check <YOUR_KEY>")


if __name__ == "__main__":
    main()
