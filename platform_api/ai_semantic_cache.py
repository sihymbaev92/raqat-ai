# -*- coding: utf-8 -*-
"""
Семантикалық кэш (embedding + cosine similarity), exact cache кейін L2.
Redis: JSON тізім (max N жазба), әр жазба: embedding + жауап мәтіні.
"""
from __future__ import annotations

import json
import os

from ai_embedding import cosine_similarity, embed_prompt_text
from ai_exact_cache import _max_cached_chars, _ttl_seconds

_SEM_KEY = "raqat:ai:semantic:v1:entries"


def semantic_cache_enabled() -> bool:
    if (os.getenv("RAQAT_AI_SEMANTIC_CACHE") or "0").strip().lower() not in ("1", "true", "yes", "on"):
        return False
    try:
        from app.infrastructure.redis_client import get_redis_client

        return get_redis_client() is not None
    except Exception:
        return False


def _similarity_threshold() -> float:
    try:
        v = float(os.getenv("RAQAT_AI_SEM_CACHE_MIN_SIM", "0.88"))
    except ValueError:
        v = 0.88
    return max(0.75, min(v, 0.99))


def _max_entries() -> int:
    try:
        n = int(os.getenv("RAQAT_AI_SEM_CACHE_MAX_ENTRIES", "200"))
    except ValueError:
        n = 200
    return max(20, min(n, 2000))


def cache_get_semantic(prompt: str) -> str | None:
    if not semantic_cache_enabled():
        return None
    vec_q = embed_prompt_text(prompt)
    if not vec_q:
        return None
    try:
        from app.infrastructure.redis_client import get_redis_client

        r = get_redis_client()
        if r is None:
            return None
        raw = r.get(_SEM_KEY)
        if not raw:
            return None
        entries = json.loads(raw)
        if not isinstance(entries, list):
            return None
        thr = _similarity_threshold()
        best_sim = -1.0
        best_text: str | None = None
        for ent in entries:
            if not isinstance(ent, dict):
                continue
            ev = ent.get("e")
            txt = ent.get("t")
            if not isinstance(ev, list) or not isinstance(txt, str):
                continue
            try:
                evf = [float(x) for x in ev]
            except (TypeError, ValueError):
                continue
            sim = cosine_similarity(vec_q, evf)
            if sim > best_sim and sim >= thr:
                best_sim = sim
                best_text = txt.strip()
        return best_text or None
    except Exception:
        return None


def cache_set_semantic(prompt: str, text: str) -> None:
    if not semantic_cache_enabled():
        return
    body = (text or "").strip()
    if not body or len(body) > _max_cached_chars():
        return
    vec = embed_prompt_text(prompt)
    if not vec:
        return
    try:
        from app.infrastructure.redis_client import get_redis_client

        r = get_redis_client()
        if r is None:
            return
        raw = r.get(_SEM_KEY)
        entries: list = []
        if raw:
            try:
                entries = json.loads(raw)
            except json.JSONDecodeError:
                entries = []
        if not isinstance(entries, list):
            entries = []
        entries.append({"e": vec, "t": body})
        max_n = _max_entries()
        if len(entries) > max_n:
            entries = entries[-max_n:]
        ttl = _ttl_seconds()
        r.setex(_SEM_KEY, ttl, json.dumps(entries, ensure_ascii=False))
    except Exception:
        return
