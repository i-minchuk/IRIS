"""Redis cache implementation for performance optimization."""

import json
from functools import wraps
from typing import Callable, Any

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.core.config import settings

redis_client = None


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
            )
        except Exception:
            return None
    return redis_client


def cache_response(expire_seconds: int = 300):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            r = get_redis_client()
            if r is None:
                return await func(*args, **kwargs)

            cache_key = f"cache:{func.__name__}:{hash(str(args) + str(kwargs))}"
            try:
                cached = await r.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception:
                # Redis unavailable — fall through to direct execution
                pass

            result = await func(*args, **kwargs)
            try:
                await r.setex(cache_key, expire_seconds, json.dumps(result, default=str))
            except Exception:
                # Redis unavailable — skip caching
                pass
            return result

        return wrapper

    return decorator


async def invalidate_cache(pattern: str = "cache:*"):
    r = get_redis_client()
    if r is None:
        return
    try:
        async for key in r.scan_iter(match=pattern):
            await r.delete(key)
    except Exception:
        # Redis unavailable — skip invalidation
        pass
