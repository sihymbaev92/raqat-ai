# -*- coding: utf-8 -*-
"""AI чат үшін exact (prompt → жауап) Redis cache — L1 fast-path."""
from __future__ import annotations

import hashlib
import json
import os
import re
from typing import Any

_WS = re.compile(r"\s+")


def _normalized_prompt(prompt: str) -> str:
    return _WS.sub(" ", (prompt or "").strip())


def _cache_key(prompt: str) -> str:
    norm = _normalized_prompt(prompt)
    h = hashlib.sha256(norm.encode("utf-8")).hexdigest()
    return f"raqat:ai:exact:v1:{h}"


def _max_cached_chars() -> int:
    try:
        n = int(os.getenv("RAQAT_AI_CACHE_MAX_CHARS", "12000"))
    except ValueError:
        n = 12000
    return max(500, min(n, 50_000))


def _ttl_seconds() -> int:
    try:
        t = int(os.getenv("RAQAT_AI_CACHE_TTL_SECONDS", "1800"))
    except ValueError:
        t = 1800
    return max(60, min(t, 86400))


def exact_cache_enabled() -> bool:
    if (os.getenv("RAQAT_AI_EXACT_CACHE") or "1").strip().lower() in ("0", "false", "no", "off"):
        return False
    try:
        from app.infrastructure.redis_client import get_redis_client

        return get_redis_client() is not None
    except Exception:
        return False


def cache_get_reply(prompt: str) -> str | None:
    if not exact_cache_enabled():
        return None
    try:
        from app.infrastructure.redis_client import get_redis_client

        client = get_redis_client()
        if client is None:
            return None
        raw = client.get(_cache_key(prompt))
        if not raw:
            return None
        data = json.loads(raw)
        if isinstance(data, dict) and isinstance(data.get("text"), str):
            return data["text"]
    except Exception:
        return None
    return None


def cache_set_reply(prompt: str, text: str, *, extra: dict[str, Any] | None = None) -> None:
    if not exact_cache_enabled():
        return
    body = (text or "").strip()
    if not body or len(body) > _max_cached_chars():
        return
    try:
        from app.infrastructure.redis_client import get_redis_client

        client = get_redis_client()
        if client is None:
            return
        payload: dict[str, Any] = {"text": body}
        if extra:
            for k, v in extra.items():
                if isinstance(k, str) and k.isidentifier() and k != "text":
                    payload[k] = v
        client.setex(
            _cache_key(prompt),
            _ttl_seconds(),
            json.dumps(payload, ensure_ascii=False),
        )
    except Exception:
        return
