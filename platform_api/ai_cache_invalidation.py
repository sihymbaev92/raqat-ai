# -*- coding: utf-8 -*-
"""
AI Redis cache ↔ ``platform_ai_chat_messages`` write-through hook (Sprint 1 #106).

After a chat exchange is persisted, refresh exact/semantic entries so Redis matches DB.
Ops incident: ``cache_flush_all_ai()`` (see ``ai_exact_cache.py`` key prefixes).
"""
from __future__ import annotations

import logging

logger = logging.getLogger("raqat.ai_cache_invalidation")


def on_ai_chat_exchange_persisted(user_text: str, assistant_text: str) -> None:
    """
    Called from ``append_ai_exchange`` after assistant row insert.
    Write-through: update cache from authoritative DB text (idempotent with ai_routes).
    """
    u = (user_text or "").strip()
    a = (assistant_text or "").strip()
    if not u or not a:
        return
    try:
        from ai_reply_guards import is_degraded_ai_reply
    except ImportError:
        is_degraded_ai_reply = lambda _t: False  # type: ignore[misc, assignment]
    if is_degraded_ai_reply(a):
        return
    try:
        from ai_exact_cache import cache_invalidate_prompt, cache_set_reply
        from ai_semantic_cache import cache_set_semantic

        # Drop stale entry if normalization differs, then write-through both variants.
        cache_invalidate_prompt(u)
        cache_invalidate_prompt(f"quick:{u}")
        cache_set_reply(u, a)
        cache_set_reply(f"quick:{u}", a)
        cache_set_semantic(u, a)
    except Exception:
        logger.debug("ai cache write-through skipped", exc_info=True)
