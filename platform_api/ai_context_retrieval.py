# -*- coding: utf-8 -*-
"""RAQAT AI: Құран / 99 есім үзінділері (ішкі контекст; Google Search — ai_proxy)."""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

from content_reader import quran_search

logger = logging.getLogger("raqat_platform.ai_context_retrieval")

_WS = re.compile(r"\s+")

_ASMA_CACHE: list[dict[str, Any]] | None = None


def _asma_rows() -> list[dict[str, Any]]:
    global _ASMA_CACHE
    if _ASMA_CACHE is not None:
        return _ASMA_CACHE
    path = os.path.join(os.path.dirname(__file__), "data", "asma-al-husna-kk.json")
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        _ASMA_CACHE = data if isinstance(data, list) else []
    except Exception as exc:
        logger.warning("asma json load failed: %s", exc)
        _ASMA_CACHE = []
    return _ASMA_CACHE


def _compact(s: str, max_len: int) -> str:
    t = _WS.sub(" ", (s or "").strip())
    if len(t) <= max_len:
        return t
    return t[: max_len - 1].rstrip() + "…"


def _search_query_from_prompt(prompt: str) -> str:
    """Іздеу жолы: халал/ұзақ системалық промптта пайдаланушы бөлігін алу."""
    raw = (prompt or "").strip()
    if not raw:
        return ""
    for sep in ("=== Пайдаланушы мәтіні ===", "=== Пайдаланушы сұрағы ==="):
        if sep in raw:
            tail = raw.split(sep, 1)[-1].strip()
            one = tail.split("\n")[0].strip()
            if len(one) >= 2:
                return one[:220]
    cut = raw.split("\n")[0].strip()
    return cut[:120]


def _fmt_quran_row(r: dict[str, Any]) -> str:
    surah = int(r["surah"])
    ayah = int(r["ayah"])
    ar = _compact(str(r.get("text_ar") or ""), 220)
    tr = r.get("text_tr")
    if tr is None:
        tr = r.get("text_kk") or r.get("text_ru") or r.get("text_en") or ""
    tr = _compact(str(tr), 400)
    return f"{surah}:{ayah}\n  AR: {ar}\n  KK/RU/EN: {tr}"


def _build_asma_context(qry: str, budget: int) -> str:
    if budget < 120:
        return ""
    rows = _asma_rows()
    if not rows:
        return ""
    q = qry.lower()
    hits: list[str] = []
    used = 0
    for row in rows:
        kk = str(row.get("kk") or "")
        ar = str(row.get("ar") or "")
        n = row.get("n")
        if q and q not in kk.lower() and q not in ar:
            continue
        block = f"{n}. {ar} — {kk}"
        if used + len(block) + 2 > budget:
            break
        hits.append(block)
        used += len(block) + 2
        if len(hits) >= 8:
            break
    if not hits:
        return ""
    return "[99 есім]\n" + "\n".join(hits)


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not str(raw).strip():
        return default
    try:
        return int(str(raw).strip())
    except ValueError:
        return default


def build_retrieved_context_parts(
    prompt: str,
    *,
    lang: str = "kk",
    quran_chars: int | None = None,
    asma_chars: int | None = None,
) -> dict[str, str]:
    """Құран / есімдер блогын бөлек қайтарады."""
    total = _int_env("RAQAT_AI_INTERNAL_CONTEXT_TOTAL", 5600)
    total = max(2000, min(total, 20_000))
    rq = float(os.getenv("RAQAT_AI_QURAN_RATIO", "0.55"))
    ra = float(os.getenv("RAQAT_AI_ASMA_RATIO", "0.15"))
    s = max(rq + ra, 1e-6)
    rq, ra = rq / s, ra / s

    q_budget = quran_chars if quran_chars is not None else _int_env("RAQAT_AI_QURAN_CONTEXT_CHARS", int(total * rq))
    a_budget = asma_chars if asma_chars is not None else _int_env("RAQAT_AI_ASMA_CONTEXT_CHARS", int(total * ra))

    q_budget = max(400, min(q_budget, 12_000))
    a_budget = max(200, min(a_budget, 4000))

    qry = _search_query_from_prompt(prompt)
    if len(qry) < 2:
        return {"quran": "", "asma": ""}

    q_lines: list[str] = []
    q_used = 0

    try:
        q_rows = quran_search(qry, lang=lang, include_translit=True, limit=12)
    except Exception as exc:
        logger.warning("quran_search failed: %s", exc)
        q_rows = []

    for r in q_rows:
        block = _fmt_quran_row(r)
        if q_used + len(block) + 2 > q_budget:
            break
        q_lines.append(block)
        q_used += len(block) + 2

    asma_block = ""
    try:
        asma_block = _build_asma_context(qry, a_budget)
    except Exception as exc:
        logger.warning("asma context failed: %s", exc)

    quran = ""
    if q_lines:
        quran = "[Құраннан табылған үзінділер]\n" + "\n\n".join(q_lines)
    return {
        "quran": quran.strip(),
        "asma": (asma_block or "").strip(),
    }


def build_retrieved_context(
    prompt: str,
    *,
    lang: str = "kk",
    quran_chars: int | None = None,
    asma_chars: int | None = None,
) -> str:
    """Ішкі дерекқор контексті: Құран + 99 есім."""
    p = build_retrieved_context_parts(
        prompt,
        lang=lang,
        quran_chars=quran_chars,
        asma_chars=asma_chars,
    )
    parts: list[str] = []
    if p["quran"]:
        parts.append(p["quran"])
    if p["asma"]:
        parts.append(p["asma"])
    return "\n\n".join(parts).strip()
