"""Redis cache implementation for performance optimization."""

import json
import time
from functools import wraps
from typing import Callable, Any

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.core.config import settings

redis_client = None

# Circuit breaker: если Redis недоступен, не дёргаем его на каждый запрос.
# Иначе каждый cache_response ждёт таймаут соединения (get + setex ≈ 8 сек).
_REDIS_RETRY_AFTER_SEC = 60
_redis_down_until = 0.0


def get_redis_client():
    global redis_client
    if redis_client is None:
        if not REDIS_AVAILABLE:
            return None
        try:
            redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=1.0,
                socket_timeout=1.0,
            )
        except Exception:
            return None
    return redis_client


def _redis_available() -> bool:
    """Redis есть и circuit breaker не открыт."""
    return time.monotonic() >= _redis_down_until


def _mark_redis_down() -> None:
    global _redis_down_until
    _redis_down_until = time.monotonic() + _REDIS_RETRY_AFTER_SEC


def cache_response(expire_seconds: int = 300):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            r = get_redis_client() if _redis_available() else None
            if r is None:
                return await func(*args, **kwargs)

            cache_key = f"cache:{func.__name__}:{hash(str(args) + str(kwargs))}"
            try:
                cached = await r.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception:
                # Redis недоступен — открываем circuit breaker и идём напрямую
                _mark_redis_down()

            result = await func(*args, **kwargs)
            if _redis_available():
                try:
                    await r.setex(cache_key, expire_seconds, json.dumps(result, default=str))
                except Exception:
                    _mark_redis_down()
            return result

        return wrapper

    return decorator


async def invalidate_cache(pattern: str = "cache:*"):
    if not _redis_available():
        return
    r = get_redis_client()
    if r is None:
        return
    try:
        async for key in r.scan_iter(match=pattern):
            await r.delete(key)
    except Exception:
        # Redis недоступен — открываем circuit breaker
        _mark_redis_down()
