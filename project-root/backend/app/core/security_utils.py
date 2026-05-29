"""Security utilities: rate limiting and security headers."""
import secrets
from functools import wraps
from typing import Callable, Optional

import redis
from fastapi import Request, Response
from slowapi.errors import RateLimitExceeded
from slowapi.extension import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings


def is_secure_secret_key(secret_key: str) -> bool:
    """Проверка SECRET_KEY на безопасность для production."""
    if not secret_key or len(secret_key) < 32:
        return False

    default_keys = [
        "your-super-secret-key-change-in-production-please",
        "change-me-in-production-min-32-chars-long",
        "secret",
        "password",
        "12345678901234567890123456789012",
        "admin",
        "root",
        "toor",
        "qwerty",
        "12345678",
    ]

    if secret_key.lower() in [k.lower() for k in default_keys]:
        return False

    # Проверка энтропии
    has_upper = any(c.isupper() for c in secret_key)
    has_lower = any(c.islower() for c in secret_key)
    has_digit = any(c.isdigit() for c in secret_key)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in secret_key)

    score = sum([has_upper, has_lower, has_digit, has_special])
    return score >= 3  # Минимум 3 из 4 категорий


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


def get_limiter() -> Limiter:
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        redis_client.ping()
        storage_uri = settings.REDIS_URL
    except (redis.ConnectionError, redis.ResponseError):
        storage_uri = "memory://"
    return Limiter(key_func=get_client_ip, storage_uri=storage_uri)


limiter = get_limiter()


def rate_limit_auth_routes():
    """Декоратор для rate limiting на auth роутах."""
    return limiter.limit("5/minute")


def rate_limit_refresh_route():
    """Декоратор для rate limiting на refresh token endpoint."""
    return limiter.limit("10/minute")


def rate_limit_standard():
    """Декоратор для стандартного rate limiting на API endpoints."""
    return limiter.limit("60/minute")

