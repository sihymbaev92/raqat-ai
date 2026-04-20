# -*- coding: utf-8 -*-
"""RAQAT AI: Құран / хадис / 99 есім үзінділері (~35% / ~35% / ~10% ішкі контекст; ~20% Google Search)."""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

from content_reader import hadith_search, quran_search

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


def _fmt_hadith_row(r: dict[str, Any]) -> str:
    hid = int(r["id"])
    src = _compact(str(r.get("source") or ""), 40)
    gr = _compact(str(r.get("grade") or ""), 80)
    ar = _compact(str(r.get("text_ar") or ""), 200)
    tr = _compact(str(r.get("text_tr") or ""), 450)
    return f"id={hid} source={src} grade={gr}\n  AR: {ar}\n  TR: {tr}"


def _build_asma_context(qry: str, budget: int) -> str:
    if budget < 120:
        return ""
    rows = _asma_rows()
    if not rows:
        return ""
    qn = (qry or "").lower()
    tokens = [t for t in re.split(r"[^\w\u0600-\u06FF]+", qn) if len(t) >= 2]
    picked: list[dict[str, Any]] = []
    for r in rows:
        kk = str(r.get("kk") or "").lower()
        ar = str(r.get("ar") or "")
        if tokens and any(tok in kk or tok in ar.lower() for tok in tokens):
            picked.append(r)
    if len(picked) < 5:
        for n in (1, 5, 17, 19, 28, 42, 51, 63, 79, 84, 94):
            row = next((x for x in rows if int(x.get("n") or 0) == n), None)
            if row and row not in picked:
                picked.append(row)
    lines: list[str] = []
    used = 0
    header = (
        "[Аллаһтың есімдері (әл-Asmä ül-hüsnä) — сұрауға сәйкес немесе жалпы үзінді]\n"
    )
    used += len(header)
    for r in picked:
        line = f"{r.get('n')}. {r.get('ar')} — {r.get('kk')}"
        if used + len(line) + 1 > budget:
            break
        lines.append(line)
        used += len(line) + 1
    if not lines:
        return ""
    return header + "\n".join(lines)


def _int_env(key: str, default: int) -> int:
    raw = os.getenv(key)
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
    hadith_chars: int | None = None,
    asma_chars: int | None = None,
) -> dict[str, str]:
    """
    Құран / хадис / есімдер блогын бөлек қайтарады — кеңейтілген AI конвейерінде кезекпен пайдаланылады.
    """
    total = _int_env("RAQAT_AI_INTERNAL_CONTEXT_TOTAL", 5600)
    total = max(2000, min(total, 20_000))
    rq = float(os.getenv("RAQAT_AI_QURAN_RATIO", "0.35"))
    rh = float(os.getenv("RAQAT_AI_HADITH_RATIO", "0.35"))
    ra = float(os.getenv("RAQAT_AI_ASMA_RATIO", "0.10"))
    s = max(rq + rh + ra, 1e-6)
    rq, rh, ra = rq / s, rh / s, ra / s

    q_budget = quran_chars if quran_chars is not None else _int_env("RAQAT_AI_QURAN_CONTEXT_CHARS", int(total * rq))
    h_budget = hadith_chars if hadith_chars is not None else _int_env("RAQAT_AI_HADITH_CONTEXT_CHARS", int(total * rh))
    a_budget = asma_chars if asma_chars is not None else _int_env("RAQAT_AI_ASMA_CONTEXT_CHARS", int(total * ra))

    q_budget = max(400, min(q_budget, 12_000))
    h_budget = max(400, min(h_budget, 12_000))
    a_budget = max(200, min(a_budget, 4000))

    qry = _search_query_from_prompt(prompt)
    if len(qry) < 2:
        return {"quran": "", "hadith": "", "asma": ""}

    q_lines: list[str] = []
    h_lines: list[str] = []
    q_used = 0
    h_used = 0

    try:
        q_rows = quran_search(qry, lang=lang, include_translit=True, limit=12)
    except Exception as exc:
        logger.warning("quran_search failed: %s", exc)
        q_rows = []

    try:
        h_rows = hadith_search(qry, lang=lang, limit=14)
    except Exception as exc:
        logger.warning("hadith_search failed: %s", exc)
        h_rows = []

    for r in q_rows:
        block = _fmt_quran_row(r)
        if q_used + len(block) + 2 > q_budget:
            break
        q_lines.append(block)
        q_used += len(block) + 2

    for r in h_rows:
        block = _fmt_hadith_row(r)
        if h_used + len(block) + 2 > h_budget:
            break
        h_lines.append(block)
        h_used += len(block) + 2

    asma_block = ""
    try:
        asma_block = _build_asma_context(qry, a_budget)
    except Exception as exc:
        logger.warning("asma context failed: %s", exc)

    quran = ""
    if q_lines:
        quran = "[Құраннан табылған үзінділер]\n" + "\n\n".join(q_lines)
    hadith = ""
    if h_lines:
        hadith = "[Хадистерден табылған үзінділер]\n" + "\n\n".join(h_lines)
    return {
        "quran": quran.strip(),
        "hadith": hadith.strip(),
        "asma": (asma_block or "").strip(),
    }


def build_retrieved_context(
    prompt: str,
    *,
    lang: str = "kk",
    quran_chars: int | None = None,
    hadith_chars: int | None = None,
    asma_chars: int | None = None,
) -> str:
    """
    Ішкі дерекқор контексті: шамамен 35% Құран, 35% хадис, 10% есімдер
    (қалған ~20% Google Search — ai_proxy нұсқауы).
    """
    p = build_retrieved_context_parts(
        prompt,
        lang=lang,
        quran_chars=quran_chars,
        hadith_chars=hadith_chars,
        asma_chars=asma_chars,
    )
    parts: list[str] = []
    if p["quran"]:
        parts.append(p["quran"])
    if p["hadith"]:
        parts.append(p["hadith"])
    if p["asma"]:
        parts.append(p["asma"])
    return "\n\n---\n\n".join(parts)
