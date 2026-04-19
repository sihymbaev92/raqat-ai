from __future__ import annotations

from typing import Any

from app.core.config import settings

_redis_client: Any | None = None


def get_redis_client() -> Any | None:
    """Return Redis client or None when unavailable."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        import redis  # type: ignore

        client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
        client.ping()
        _redis_client = client
        return _redis_client
    except Exception:
        return None


def reset_redis_client() -> None:
    """Тесттер / қайта қосу үшін кэшті тазалау."""
    global _redis_client
    if _redis_client is not None:
        try:
            _redis_client.close()
        except Exception:
            pass
    _redis_client = None

