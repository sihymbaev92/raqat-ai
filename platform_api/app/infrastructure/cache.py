from __future__ import annotations

import json
from typing import Any

from app.infrastructure.redis_client import get_redis_client


def cache_get_json(key: str) -> dict[str, Any] | None:
    client = get_redis_client()
    if client is None:
        return None
    raw = client.get(key)
    if not raw:
        return None
    try:
        obj = json.loads(raw)
        if isinstance(obj, dict):
            return obj
    except Exception:
        return None
    return None


def cache_set_json(key: str, value: dict[str, Any], ttl_seconds: int) -> bool:
    client = get_redis_client()
    if client is None:
        return False
    try:
        client.setex(key, max(1, ttl_seconds), json.dumps(value, ensure_ascii=False))
        return True
    except Exception:
        return False

