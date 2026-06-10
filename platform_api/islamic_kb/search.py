# -*- coding: utf-8 -*-
from __future__ import annotations

import re

from islamic_kb.config import (
    allowed_source_sites,
    islamic_kb_min_score,
    islamic_kb_search_excerpt_chars,
    islamic_kb_top_k,
)
from islamic_kb.db import connect
from islamic_kb.excerpt import make_excerpt
from islamic_kb.models import IslamicKbArticleResult, IslamicKbHit

_SITE_LABEL = {
    "fatua": "Fatua.kz",
    "muftyat": "Muftyat.kz",
}

_TOKEN = re.compile(r"[\w\u0400-\u04FF]+", re.UNICODE)


def _fts_query(user_query: str) -> str:
    tokens = _TOKEN.findall((user_query or "").lower())
    tokens = [t for t in tokens if len(t) >= 2][:12]
    if not tokens:
        return ""
    return " OR ".join(f'"{t}"' for t in tokens)


def search_islamic_kb(
    query: str,
    *,
    top_k: int | None = None,
    min_score: float | None = None,
    sources: frozenset[str] | None = None,
) -> list[IslamicKbHit]:
    q = _fts_query(query)
    if not q:
        return []
    k = top_k if top_k is not None else islamic_kb_top_k()
    min_s = min_score if min_score is not None else islamic_kb_min_score()
    sites = sources if sources is not None else allowed_source_sites()
    site_list = tuple(sites)
    if not site_list:
        return []

    placeholders = ",".join("?" for _ in site_list)
    sql = f"""
        SELECT
          chunk_id,
          document_id,
          source_site,
          canonical_url,
          title,
          snippet(islamic_kb_fts, 1, '', '', '…', 24) AS snip,
          bm25(islamic_kb_fts) AS rank
        FROM islamic_kb_fts
        WHERE islamic_kb_fts MATCH ?
          AND source_site IN ({placeholders})
        ORDER BY rank
        LIMIT ?
    """
    hits: list[IslamicKbHit] = []
    with connect() as conn:
        rows = conn.execute(sql, (q, *site_list, k * 3)).fetchall()
        for row in rows:
            rank = float(row["rank"] or 0)
            score = 1.0 / (1.0 + max(rank, 0.0))
            if score < min_s:
                continue
            chunk_id = int(row["chunk_id"])
            text_row = conn.execute(
                "SELECT text_plain FROM islamic_kb_chunks WHERE id = ?", (chunk_id,)
            ).fetchone()
            text = (
                str(text_row["text_plain"])
                if text_row
                else str(row["snip"] or "")
            )
            hits.append(
                IslamicKbHit(
                    chunk_id=chunk_id,
                    document_id=int(row["document_id"]),
                    source_site=str(row["source_site"]),
                    canonical_url=str(row["canonical_url"]),
                    title=str(row["title"] or ""),
                    text_plain=text,
                    score=score,
                )
            )
            if len(hits) >= k:
                break
    return hits


def search_islamic_kb_articles(
    query: str,
    *,
    limit: int = 10,
    top_k: int | None = None,
    min_score: float | None = None,
    sources: frozenset[str] | None = None,
) -> list[IslamicKbArticleResult]:
    """
    Мақала деңгейінде (document_id) дедуп — мобильді карточка: title, excerpt, url.
    """
    k = max(1, min(limit, 20))
    raw_hits = search_islamic_kb(
        query,
        top_k=top_k or max(k * 4, islamic_kb_top_k()),
        min_score=min_score,
        sources=sources,
    )
    excerpt_len = islamic_kb_search_excerpt_chars()
    best: dict[int, IslamicKbHit] = {}
    for h in raw_hits:
        prev = best.get(h.document_id)
        if prev is None or h.score > prev.score:
            best[h.document_id] = h

    rows = sorted(best.values(), key=lambda x: -x.score)[:k]
    out: list[IslamicKbArticleResult] = []
    with connect() as conn:
        for h in rows:
            label = _SITE_LABEL.get(h.source_site, h.source_site)
            img_row = conn.execute(
                "SELECT image_url, published_at FROM islamic_kb_documents WHERE id = ?",
                (h.document_id,),
            ).fetchone()
            image_url = (
                str(img_row["image_url"]).strip()
                if img_row and img_row["image_url"]
                else None
            )
            published_at = (
                str(img_row["published_at"]).strip()
                if img_row and img_row["published_at"]
                else None
            )
            out.append(
                IslamicKbArticleResult(
                    document_id=h.document_id,
                    source_site=h.source_site,
                    source_label=label,
                    title=(h.title or label).strip()[:200],
                    excerpt=make_excerpt(h.text_plain, max_len=excerpt_len),
                    url=h.canonical_url,
                    score=h.score,
                    published_at=published_at,
                    image_url=image_url,
                )
            )
    return out


def list_islamic_kb_documents(
    *,
    site: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[IslamicKbArticleResult]:
    """Каталог (сат): соңғы индекстелген мақалалар — іздеусіз тізім."""
    allowed = allowed_source_sites()
    site_filter = (site or "").strip().lower()
    if site_filter and site_filter not in allowed:
        site_filter = ""
    lim = max(1, min(int(limit), 30))
    off = max(0, int(offset))
    excerpt_len = islamic_kb_search_excerpt_chars()
    sql_base = """
        SELECT d.id, d.source_site, d.canonical_url, d.title, d.published_at, d.image_url,
          (SELECT c.text_plain FROM islamic_kb_chunks c
           WHERE c.document_id = d.id ORDER BY c.chunk_index LIMIT 1) AS excerpt_raw
        FROM islamic_kb_documents d
    """
    with connect() as conn:
        if site_filter:
            rows = conn.execute(
                sql_base
                + " WHERE d.source_site = ? ORDER BY (CASE WHEN d.image_url IS NOT NULL AND TRIM(d.image_url) != '' THEN 0 ELSE 1 END), d.id DESC LIMIT ? OFFSET ?",
                (site_filter, lim, off),
            ).fetchall()
        else:
            placeholders = ",".join("?" for _ in allowed)
            rows = conn.execute(
                sql_base
                + f" WHERE d.source_site IN ({placeholders}) ORDER BY (CASE WHEN d.image_url IS NOT NULL AND TRIM(d.image_url) != '' THEN 0 ELSE 1 END), d.id DESC LIMIT ? OFFSET ?",
                (*sorted(allowed), lim, off),
            ).fetchall()
    out: list[IslamicKbArticleResult] = []
    for r in rows:
        src = str(r["source_site"])
        label = _SITE_LABEL.get(src, src)
        pub = r["published_at"]
        img = r["image_url"]
        out.append(
            IslamicKbArticleResult(
                document_id=int(r["id"]),
                source_site=src,
                source_label=label,
                title=(r["title"] or label).strip()[:200],
                excerpt=make_excerpt(str(r["excerpt_raw"] or ""), max_len=excerpt_len),
                url=str(r["canonical_url"]),
                score=0.0,
                published_at=str(pub).strip() if pub else None,
                image_url=str(img).strip() if img else None,
            )
        )
    return out
