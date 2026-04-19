# -*- coding: utf-8 -*-
"""
Per-user minimum interval between AI (Gemini) calls to limit abuse and API cost.
Uses monotonic time; old entries are pruned when the map grows large.
"""
import time
from typing import Optional, Tuple

from config.settings import AI_RATE_LIMIT_SECONDS, STATE_MAX_ENTRIES

_last_ai_mono: dict[int, float] = {}


def _prune_stale(now: float) -> None:
    if len(_last_ai_mono) <= STATE_MAX_ENTRIES:
        return
    # Drop entries not touched in the last hour (best-effort shrink)
    cutoff = now - 3600.0
    dead = [uid for uid, t in _last_ai_mono.items() if t < cutoff]
    for uid in dead:
        del _last_ai_mono[uid]
    if len(_last_ai_mono) > STATE_MAX_ENTRIES:
        sorted_uids = sorted(_last_ai_mono.items(), key=lambda kv: kv[1])
        for uid, _ in sorted_uids[: max(1, len(sorted_uids) // 2)]:
            del _last_ai_mono[uid]


def check_ai_rate_limit(user_id: int) -> Tuple[bool, Optional[str]]:
    """
    Returns (allowed, message_if_blocked).
    On allow, records the current time for this user.
    """
    now = time.monotonic()
    _prune_stale(now)

    last = _last_ai_mono.get(user_id)
    if last is not None and (now - last) < AI_RATE_LIMIT_SECONDS:
        wait = AI_RATE_LIMIT_SECONDS - (now - last)
        return False, f"⏳ Қысқа күте тұрыңыз ({wait:.0f} с кейін қайта жазыңыз)."

    _last_ai_mono[user_id] = now
    return True, None
