# -*- coding: utf-8 -*-
"""Tag-based genealogy cache invalidation (no scan_iter)."""
from __future__ import annotations

import logging
import threading
import time
from typing import Any

logger = logging.getLogger("raqat.genealogy.cache")

_INVALIDATED_KEY = "genealogy:invalidated_paths"
_INVALIDATE_CHANNEL = "genealogy:invalidate"
_LOCAL_TTL_SEC = 60.0


class GenealogyCacheManager:
    """
    Redis: SADD path prefixes + PUBLISH.
    Local LRU of invalidated prefixes for workers without Redis.
    """

    def __init__(self) -> None:
        self._local_invalid: dict[str, float] = {}
        self._lock = threading.Lock()

    @staticmethod
    def path_tag(ltree_prefix: str) -> str:
        p = (ltree_prefix or "").strip().strip(".")
        return f"tag:genealogy:path:{p}" if p else "tag:genealogy:path:root"

    @staticmethod
    def cache_key_subtree(slug: str) -> str:
        return f"genealogy:subtree:{slug}"

    @staticmethod
    def cache_key_ancestors(slug: str) -> str:
        return f"genealogy:ancestors:{slug}"

    @staticmethod
    def cache_key_lca(a: str, b: str) -> str:
        lo, hi = sorted([a, b])
        return f"genealogy:lca:{lo}:{hi}"

    def invalidate_paths(self, prefixes: list[str], *, ttl_sec: int = 300) -> None:
        cleaned = [p.strip().strip(".") for p in prefixes if p and p.strip()]
        if not cleaned:
            return
        now = time.time()
        with self._lock:
            for p in cleaned:
                self._local_invalid[p] = now + _LOCAL_TTL_SEC
        client = self._redis()
        if client is None:
            return
        try:
            pipe = client.pipeline()
            for p in cleaned:
                pipe.sadd(_INVALIDATED_KEY, p)
            pipe.expire(_INVALIDATED_KEY, ttl_sec)
            for p in cleaned:
                pipe.publish(_INVALIDATE_CHANNEL, p)
            pipe.execute()
        except Exception:
            logger.exception("genealogy cache invalidate failed prefixes=%s", cleaned)

    def is_path_stale(self, ltree_prefix: str) -> bool:
        p = (ltree_prefix or "").strip().strip(".")
        now = time.time()
        with self._lock:
            self._prune_local(now)
            if not p:
                return any(v > now for v in self._local_invalid.values())
            for key, exp in self._local_invalid.items():
                if exp <= now:
                    continue
                if p == key or p.startswith(key + ".") or key.startswith(p + "."):
                    return True
        client = self._redis()
        if client is None:
            return False
        try:
            if client.sismember(_INVALIDATED_KEY, p):
                return True
            parts = p.split(".")
            for i in range(len(parts)):
                prefix = ".".join(parts[: i + 1])
                if client.sismember(_INVALIDATED_KEY, prefix):
                    return True
        except Exception:
            logger.exception("genealogy cache stale check failed prefix=%s", p)
        return False

    def _prune_local(self, now: float) -> None:
        dead = [k for k, v in self._local_invalid.items() if v <= now]
        for k in dead:
            del self._local_invalid[k]

    @staticmethod
    def _redis() -> Any | None:
        try:
            from app.infrastructure.redis_client import get_redis_client

            return get_redis_client()
        except ImportError:
            return None


_cache_manager: GenealogyCacheManager | None = None
_cache_lock = threading.Lock()


def get_genealogy_cache_manager() -> GenealogyCacheManager:
    global _cache_manager
    with _cache_lock:
        if _cache_manager is None:
            _cache_manager = GenealogyCacheManager()
        return _cache_manager
