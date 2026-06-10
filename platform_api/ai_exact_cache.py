# -*- coding: utf-8 -*-
"""
AI чат үшін exact (prompt → жауап) Redis cache — L1 fast-path.

Key patterns (Sprint 1 #106):
  - Exact: ``raqat:ai:exact:v1:{sha256(normalized_prompt)}``
  - Semantic (L2): ``raqat:ai:semantic:v1:entries`` — ``ai_semantic_cache.py``

Env:
  - ``RAQAT_AI_EXACT_CACHE`` — 0/false to disable (default on when Redis up)
  - ``RAQAT_AI_CACHE_TTL_SECONDS`` — default 1800 (60..86400)
  - ``RAQAT_AI_CACHE_MAX_CHARS`` — default 12000 (500..50000)

Incident / stale KB: ``cache_flush_all_ai()`` or ``scripts/sprint1_redis_cache_drill.ps1``.
Write-through after ``platform_ai_chat_messages`` insert: ``ai_cache_invalidation.on_ai_chat_exchange_persisted``.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from typing import Any

_WS = re.compile(r"\s+")

EXACT_CACHE_KEY_PREFIX = "raqat:ai:exact:v1:"


def _normalized_prompt(prompt: str) -> str:
    return _WS.sub(" ", (prompt or "").strip())


def cache_key_for_prompt(prompt: str) -> str:
    """Public key builder (tests, invalidation, ops)."""
    return _cache_key(prompt)


def _cache_key(prompt: str) -> str:
    norm = _normalized_prompt(prompt)
    h = hashlib.sha256(norm.encode("utf-8")).hexdigest()
    return f"{EXACT_CACHE_KEY_PREFIX}{h}"


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
            txt = data["text"]
            try:
                from ai_reply_guards import is_degraded_ai_reply

                if is_degraded_ai_reply(txt):
                    return None
            except ImportError:
                pass
            return txt
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
        from ai_reply_guards import is_degraded_ai_reply

        if is_degraded_ai_reply(body):
            return
    except ImportError:
        pass
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


def cache_invalidate_prompt(prompt: str) -> bool:
    """Delete one exact-cache entry (prompt-normalized key)."""
    if not prompt or not str(prompt).strip():
        return False
    try:
        from app.infrastructure.redis_client import get_redis_client

        client = get_redis_client()
        if client is None:
            return False
        deleted = int(client.delete(_cache_key(prompt)) or 0)
        return deleted > 0
    except Exception:
        return False


def cache_flush_prefix(prefix: str = EXACT_CACHE_KEY_PREFIX) -> int:
    """SCAN+DEL keys matching prefix (incident / KB refresh). Returns delete count."""
    pfx = (prefix or EXACT_CACHE_KEY_PREFIX).strip()
    if not pfx:
        return 0
    try:
        from app.infrastructure.redis_client import get_redis_client

        client = get_redis_client()
        if client is None:
            return 0
        n = 0
        for key in client.scan_iter(f"{pfx}*", count=200):
            try:
                n += int(client.delete(key) or 0)
            except Exception:
                continue
        return n
    except Exception:
        return 0


def cache_flush_all_ai() -> dict[str, int]:
    """Flush exact + semantic AI caches. Safe on miss (origin regenerates)."""
    from ai_semantic_cache import cache_flush_semantic

    exact = cache_flush_prefix(EXACT_CACHE_KEY_PREFIX)
    semantic = 1 if cache_flush_semantic() else 0
    return {"exact_deleted": exact, "semantic_flushed": semantic}
