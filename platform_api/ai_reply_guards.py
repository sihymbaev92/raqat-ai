# -*- coding: utf-8 -*-
"""AI жауабының сапасы: кэшке жіберілмейтін уақытша қате мәтіндері."""
from __future__ import annotations

GEMINI_BUSY_REPLY_KK = (
    "AI сервері қазір бос емес. "
    "1-2 минуттан кейін қайта сұрап көріңіз."
)


def is_degraded_ai_reply(text: str | None) -> bool:
    """Gemini квота/503/бос жауап — нақты жауап емес, кэшке сақталмауы керек."""
    t = (text or "").strip().lower()
    if not t:
        return True
    if "бос емес" in t and "минут" in t:
        return True
    if "ai сервері" in t and ("бос" in t or "кейін" in t):
        return True
    if "ai уақытша жауап бере алмады" in t:
        return True
    if "жауап алынбады" in t and len(t) < 80:
        return True
    return False
