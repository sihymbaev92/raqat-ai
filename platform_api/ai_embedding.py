# -*- coding: utf-8 -*-
"""Gemini text embedding — семантикалық кэш үшін."""
from __future__ import annotations

import logging
import os

from ai_proxy import _get_client

logger = logging.getLogger("raqat_platform.ai_embedding")

_EMBED_MODEL = (os.getenv("RAQAT_AI_EMBED_MODEL") or "text-embedding-004").strip()


def embed_prompt_text(text: str) -> list[float] | None:
    """Бір мәтін үшін вектор; сәтсіздікке None."""
    t = (text or "").strip()
    if not t:
        return None
    max_chars = min(8000, int(os.getenv("RAQAT_AI_EMBED_MAX_CHARS", "8000")))
    t = t[:max_chars]
    client = _get_client()
    if client is None:
        return None
    try:
        resp = client.models.embed_content(model=_EMBED_MODEL, contents=t)
        em = getattr(resp, "embeddings", None)
        if not em:
            return None
        first = em[0]
        vals = getattr(first, "values", None)
        if vals is None and isinstance(first, dict):
            vals = first.get("values")
        if not vals or not isinstance(vals, (list, tuple)):
            return None
        return [float(x) for x in vals]
    except Exception as exc:
        logger.warning("embed_content failed: %s", exc)
        return None


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return -1.0
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(x * x for x in b) ** 0.5
    if na <= 0 or nb <= 0:
        return -1.0
    return dot / (na * nb)
