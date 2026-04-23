"""Redis cache implementation for performance optimization."""

import json
from typing import Optional, Any

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class RedisCache:
    """Simple Redis cache wrapper with TTL support."""
    
    def __init__(self, redis_url: str):
        if not REDIS_AVAILABLE:
            raise RuntimeError(
                "Redis is not installed. Install with: pip install redis"
            )
        self.redis = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True
        )
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        data = await self.redis.get(key)
        return json.loads(data) if data else None
    
    async def set(self, key: str, value: Any, expire: int = 300) -> None:
        """Set value in cache with expiration time (in seconds)."""
        await self.redis.set(key, json.dumps(value), ex=expire)
    
    async def delete(self, key: str) -> None:
        """Delete key from cache."""
        await self.redis.delete(key)
    
    async def clear(self) -> None:
        """Clear all cache (use with caution)."""
        await self.redis.flushdb()
    
    async def close(self) -> None:
        """Close Redis connection."""
        await self.redis.close()


# Global cache instance (initialized in main.py)
cache: Optional[RedisCache] = None


def init_cache(redis_url: str) -> None:
    """Initialize global cache instance."""
    global cache
    cache = RedisCache(redis_url)


def get_cache() -> RedisCache:
    """Get global cache instance."""
    if cache is None:
        raise RuntimeError("Cache not initialized. Call init_cache() first.")
    return cache


class InMemoryCache:
    """Simple in-memory cache for development (fallback when Redis not available)."""
    
    def __init__(self):
        self._cache: dict = {}
        self._timestamps: dict = {}
        self._TTL = 300  # 5 minutes
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key not in self._cache:
            return None
        if not self._is_valid(key):
            del self._cache[key]
            del self._timestamps[key]
            return None
        return self._cache[key]
    
    async def set(self, key: str, value: Any, expire: int = 300) -> None:
        """Set value in cache with expiration time (in seconds)."""
        from datetime import datetime, timedelta
        self._cache[key] = value
        self._timestamps[key] = datetime.utcnow() + timedelta(seconds=expire)
    
    async def delete(self, key: str) -> None:
        """Delete key from cache."""
        self._cache.pop(key, None)
        self._timestamps.pop(key, None)
    
    async def clear(self) -> None:
        """Clear all cache."""
        self._cache.clear()
        self._timestamps.clear()
    
    def _is_valid(self, key: str) -> bool:
        """Check if cache entry is still valid."""
        from datetime import datetime
        return self._timestamps.get(key, datetime.utcnow()) > datetime.utcnow()


# Fallback cache for development
_fallback_cache = InMemoryCache()


def get_fallback_cache() -> InMemoryCache:
    """Get fallback in-memory cache."""
    return _fallback_cache
