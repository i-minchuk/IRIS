"""Security utilities: rate limiting and security headers."""
import secrets
from functools import wraps
from typing import Callable, Optional

from fastapi import Request, Response
from slowapi.errors import RateLimitExceeded
from slowapi.extension import Limiter
from slowapi.util import get_remote_address


def is_secure_secret_key(secret_key: str) -> bool:
    """Проверка SECRET_KEY на безопасность для production."""
    if not secret_key:
        return False
    
    # Минимальная длина 32 символа
    if len(secret_key) < 32:
        return False
    
    # Не должен быть дефолтным
    default_keys = [
        "your-super-secret-key-change-in-production-please",
        "change-me-in-production-min-32-chars-long",
        "secret",
        "password",
        "12345678901234567890123456789012",
    ]
    
    if secret_key in default_keys:
        return False
    
    # Должен содержать хотя бы буквы и цифры
    has_letters = any(c.isalpha() for c in secret_key)
    has_digits = any(c.isdigit() for c in secret_key)
    
    return has_letters and has_digits


def generate_secure_secret_key() -> str:
    """Генерация безопасного SECRET_KEY."""
    return secrets.token_urlsafe(32)


def get_client_ip(request: Request) -> str:
    """Get client IP address, considering proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    if request.client:
        return request.client.host
    return "unknown"


# Инициализация лимитера
limiter = Limiter(key_func=get_client_ip)


def rate_limit_auth_routes():
    """Декоратор для rate limiting на auth роутах."""
    return limiter.limit("5/minute")


def rate_limit_refresh_route():
    """Декоратор для rate limiting на refresh token endpoint."""
    return limiter.limit("10/minute")

