# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
import re

from islamic_kb.config import islamic_kb_enabled, islamic_kb_max_context_chars
from islamic_kb.models import IslamicKbHit, IslamicKbSource
from islamic_kb.search import search_islamic_kb

logger = logging.getLogger("raqat_platform.islamic_kb.rag")

_SITE_LABEL = {
    "fatua": "Fatua.kz",
    "muftyat": "Muftyat.kz",
}


def _query_from_prompt(prompt: str) -> str:
    """Соңғы пайдаланушы сұрағын алу (чат тарихынан)."""
    p = (prompt or "").strip()
    m = re.search(r"(?im)жаңа сұрақ:\s*(.+)$", p, re.DOTALL)
    if m:
        return m.group(1).strip()
    m2 = re.search(r"(?im)пайдаланушы:\s*(.+)$", p, re.DOTALL)
    if m2:
        return m2.group(1).strip()
    lines = [ln.strip() for ln in p.splitlines() if ln.strip()]
    for ln in reversed(lines):
        if ln.lower().startswith("пайдаланушы:"):
            return ln.split(":", 1)[-1].strip()
    return p[-1200:].strip()


def hits_to_sources(hits: list[IslamicKbHit]) -> list[IslamicKbSource]:
    seen: set[str] = set()
    out: list[IslamicKbSource] = []
    for h in hits:
        if h.canonical_url in seen:
            continue
        seen.add(h.canonical_url)
        label = _SITE_LABEL.get(h.source_site, h.source_site)
        out.append(
            IslamicKbSource(
                site=h.source_site,
                title=(h.title or label)[:200],
                url=h.canonical_url,
            )
        )
    return out


def build_islamic_kb_context(prompt: str) -> tuple[str, list[dict]]:
    """
    Сұраққа байланысты Fatua/Muftyat үзінділері.
    Қайтарады: (контекст блогы, sources[] dict).
    """
    if not islamic_kb_enabled():
        return "", []
    query = _query_from_prompt(prompt)
    if not query:
        return "", []
    try:
        hits = search_islamic_kb(query)
    except Exception as exc:
        logger.warning("islamic_kb search failed: %s", exc)
        return "", []

    if not hits:
        return "", []

    sources = [s.as_dict() for s in hits_to_sources(hits)]
    parts: list[str] = []
    budget = islamic_kb_max_context_chars()
    used = 0
    for i, h in enumerate(hits, 1):
        label = _SITE_LABEL.get(h.source_site, h.source_site)
        block = (
            f"[{i}] {label} — {h.title or h.canonical_url}\n"
            f"URL: {h.canonical_url}\n"
            f"{h.text_plain.strip()}"
        )
        if used + len(block) > budget:
            remain = budget - used
            if remain < 120:
                break
            block = block[:remain] + "…"
        parts.append(block)
        used += len(block)
        if used >= budget:
            break

    header = (
        "Муфтият / Fatua дереккөз үзінділері (тек осы блокқа сүйен; ойдан үкім қоспа; "
        "жеткілікті дерек жоқ болса «сенімді пәтуа табылмады» деп айт):\n"
    )
    return header + "\n\n---\n\n".join(parts), sources
