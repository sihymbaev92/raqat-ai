# -*- coding: utf-8 -*-
import time
from typing import Any, Optional

from config.settings import (
    STATE_MAX_ENTRIES,
    TASBIH_TTL_SECONDS,
    USER_LANG_TTL_SECONDS,
    USER_STATE_TTL_SECONDS,
)


class SlidingTtlStore:
    """
    In-memory key store with sliding expiration and a hard cap on entries.
    Each get/set refreshes the TTL from last access. Expired keys are dropped
    on access and during periodic prune.
    """

    __slots__ = ("_ttl", "_max_entries", "_data")

    def __init__(self, ttl_seconds: float, max_entries: int = STATE_MAX_ENTRIES):
        self._ttl = float(ttl_seconds)
        self._max_entries = max(1000, int(max_entries))
        self._data: dict[int, tuple[Any, float]] = {}

    def _now(self) -> float:
        return time.monotonic()

    def _prune_expired(self) -> None:
        if not self._data:
            return
        cutoff = self._now() - self._ttl
        dead = [uid for uid, (_, t) in self._data.items() if t < cutoff]
        for uid in dead:
            del self._data[uid]

    def _evict_oldest_if_over_limit(self) -> None:
        if len(self._data) <= self._max_entries:
            return
        items = sorted(self._data.items(), key=lambda kv: kv[1][1])
        for uid, _ in items[: max(1, len(items) // 2)]:
            del self._data[uid]

    def get(self, uid: int, default: Any = None) -> Any:
        self._prune_expired()
        item = self._data.get(uid)
        if item is None:
            return default
        val, t = item
        if self._now() - t > self._ttl:
            del self._data[uid]
            return default
        self._data[uid] = (val, self._now())
        return val

    def __setitem__(self, uid: int, value: Any) -> None:
        self._prune_expired()
        if value is None:
            self._data.pop(uid, None)
            return
        self._data[uid] = (value, self._now())
        self._evict_oldest_if_over_limit()

    def __getitem__(self, uid: int) -> Any:
        self._prune_expired()
        item = self._data.get(uid)
        if item is None:
            raise KeyError(uid)
        val, t = item
        if self._now() - t > self._ttl:
            del self._data[uid]
            raise KeyError(uid)
        self._data[uid] = (val, self._now())
        return val

    def setdefault(self, uid: int, default: Any) -> Any:
        self._prune_expired()
        now = self._now()
        item = self._data.get(uid)
        if item is not None:
            val, t = item
            if now - t <= self._ttl:
                self._data[uid] = (val, now)
                return val
            del self._data[uid]
        self._data[uid] = (default, now)
        self._evict_oldest_if_over_limit()
        return default


USER_STATE = SlidingTtlStore(USER_STATE_TTL_SECONDS)
USER_LANG = SlidingTtlStore(USER_LANG_TTL_SECONDS)
USER_CONTENT_LANG = SlidingTtlStore(USER_LANG_TTL_SECONDS)
TASBIH_COUNT = SlidingTtlStore(TASBIH_TTL_SECONDS)
TASBIH_TARGET = SlidingTtlStore(TASBIH_TTL_SECONDS)
TASBIH_DHIKR_ID = SlidingTtlStore(TASBIH_TTL_SECONDS)
VOICE_CONTEXT = SlidingTtlStore(USER_STATE_TTL_SECONDS)
