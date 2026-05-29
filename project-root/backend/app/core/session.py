import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import redis

from app.core.config import settings

redis_client = None


def get_session_redis():
    global redis_client
    if redis_client is None:
        try:
            client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            client.ping()
            redis_client = client
        except Exception:
            redis_client = "unavailable"  # Marker to avoid retrying every time
            return None
    if redis_client == "unavailable":
        return None
    return redis_client


class SessionStore:
    PREFIX = "session:"
    EXPIRE_DAYS = 7

    @classmethod
    def create_session(cls, user_id: int, user_data: Dict[str, Any]) -> str:
        r = get_session_redis()
        session_id = secrets.token_urlsafe(32)
        payload = {
            "user_id": user_id,
            "data": user_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if r:
            r.setex(
                f"{cls.PREFIX}{session_id}",
                timedelta(days=cls.EXPIRE_DAYS),
                json.dumps(payload),
            )
        else:
            _memory_sessions[session_id] = {
                "expires_at": datetime.now(timezone.utc) + timedelta(days=cls.EXPIRE_DAYS),
                **payload,
            }
        return session_id

    @classmethod
    def get_session(cls, session_id: str) -> Optional[Dict[str, Any]]:
        r = get_session_redis()
        if r:
            data = r.get(f"{cls.PREFIX}{session_id}")
            return json.loads(data) if data else None
        # Fallback to in-memory store
        mem = _memory_sessions.get(session_id)
        if not mem:
            return None
        if datetime.now(timezone.utc) > mem["expires_at"]:
            _memory_sessions.pop(session_id, None)
            return None
        return {k: v for k, v in mem.items() if k != "expires_at"}

    @classmethod
    def delete_session(cls, session_id: str) -> None:
        r = get_session_redis()
        if r:
            r.delete(f"{cls.PREFIX}{session_id}")
        _memory_sessions.pop(session_id, None)

    @classmethod
    def refresh_session(cls, session_id: str) -> None:
        r = get_session_redis()
        if r:
            r.expire(f"{cls.PREFIX}{session_id}", timedelta(days=cls.EXPIRE_DAYS))
        else:
            mem = _memory_sessions.get(session_id)
            if mem:
                mem["expires_at"] = datetime.now(timezone.utc) + timedelta(days=cls.EXPIRE_DAYS)


# Fallback for dev: in-memory store
_memory_sessions: Dict[str, Dict[str, Any]] = {}
