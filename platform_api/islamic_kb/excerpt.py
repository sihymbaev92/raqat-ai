# -*- coding: utf-8 -*-
from __future__ import annotations

import re

_WS = re.compile(r"\s+")


def make_excerpt(text: str, *, max_len: int = 280) -> str:
    """Үзінді (толық мақала емес) — мобильді/карточка көрсету үшін."""
    t = _WS.sub(" ", (text or "").strip())
    if not t:
        return ""
    if len(t) <= max_len:
        return t
    cut = t[:max_len]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut.rstrip(".,;:") + "…"
