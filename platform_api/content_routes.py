# -*- coding: utf-8 -*-
"""Read-only: /api/v1/quran/*, /api/v1/hadith/*, /api/v1/metadata/changes (ETag, since)."""
from __future__ import annotations

import time
from email.utils import formatdate

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response

from ai_security import optional_content_read_secret
from app.infrastructure.cache import cache_get_json, cache_set_json
from content_reader import (
    content_fingerprint_v1,
    hadith_random_for_source,
    hadith_search,
    hadith_by_id,
    metadata_diff_for_since,
    quran_search,
    quran_one_ayah,
    quran_surah_index,
    quran_surah_slice,
)
from db_reader import resolve_db_path

router = APIRouter(prefix="/api/v1", tags=["content"])
SURAHS_CACHE_TTL_SECONDS = 120
HADITH_BY_ID_CACHE_TTL_SECONDS = 180
METADATA_CHANGES_CACHE_TTL_SECONDS = 30


def _weak_etag(token: str) -> str:
    return f'W/"{token}"'


def _etag_matches(if_none_match: str | None, etag: str) -> bool:
    def norm(x: str) -> str:
        x = (x or "").strip()
        if x.upper().startswith("W/"):
            x = x[2:].strip()
        return x.strip('"')

    if not if_none_match:
        return False
    for part in if_none_match.split(","):
        if norm(part) == norm(etag):
            return True
    return False


@router.get("/metadata/changes")
def metadata_changes(
    request: Request,
    response: Response,
    since: str | None = Query(
        None,
        description="ISO8601 (мысалы 2026-01-01T00:00:00Z). updated_at бар DB үшін quran_changed/hadith_changed.",
    ),
    _: None = Depends(optional_content_read_secret),
):
    since_key = (since or "").strip() or "none"
    cache_key = f"content:metadata:changes:v1:{since_key}"
    cached = cache_get_json(cache_key)
    if cached and isinstance(cached.get("etag"), str):
        etag_cached = str(cached.get("etag"))
        lm_cached = str(cached.get("last_modified_http") or "")
        response.headers["ETag"] = etag_cached
        if lm_cached:
            response.headers["Last-Modified"] = lm_cached
        response.headers["Cache-Control"] = "public, max-age=60"
        if _etag_matches(request.headers.get("if-none-match"), etag_cached):
            return Response(status_code=304)
        return cached

    token, meta = content_fingerprint_v1()
    etag = _weak_etag(token)
    path = resolve_db_path()
    try:
        mtime = path.stat().st_mtime if path.is_file() else time.time()
    except OSError:
        mtime = time.time()
    lm = formatdate(timeval=mtime, usegmt=True)
    response.headers["ETag"] = etag
    response.headers["Last-Modified"] = lm
    response.headers["Cache-Control"] = "public, max-age=60"

    if _etag_matches(request.headers.get("if-none-match"), etag):
        return Response(status_code=304)

    diff = metadata_diff_for_since(since)
    hint = (
        "Синхрон: ETag сақтаңыз; `since` + updated_at бойынша diff қолжетімді (миграция 005)."
        if diff.get("incremental_diff_available")
        else (
            "Кестеде updated_at жоқ немесе бот миграциясы орындалмаған: ETag бойынша толық қайта алу; "
            "db/migrations.py нұсқаушысы — schema_migrations 5."
        )
    )

    body: dict = {
        "ok": True,
        "since_query": since,
        "incremental_diff_available": bool(diff.get("incremental_diff_available")),
        "since_invalid": bool(diff.get("since_invalid")),
        "since_normalized_sqlite": diff.get("since_normalized_sqlite"),
        "quran_changed": diff.get("quran_changed") or [],
        "hadith_changed": diff.get("hadith_changed") or [],
        "hint_kk": hint,
        "etag": etag,
        "last_modified_http": lm,
        "fingerprint": meta,
    }
    cache_set_json(cache_key, body, METADATA_CHANGES_CACHE_TTL_SECONDS)
    return body


@router.get("/quran/surahs")
def quran_surahs(_: None = Depends(optional_content_read_secret)):
    cache_key = "content:quran:surahs:v1"
    cached = cache_get_json(cache_key)
    if cached and isinstance(cached.get("surahs"), list):
        return cached
    body = {"ok": True, "surahs": quran_surah_index()}
    cache_set_json(cache_key, body, SURAHS_CACHE_TTL_SECONDS)
    return body


@router.get("/quran/search")
def quran_search_endpoint(
    q: str = Query(..., min_length=1),
    lang: str = Query("kk"),
    include_translit: bool = Query(True),
    limit: int = Query(5, ge=1, le=100),
    _: None = Depends(optional_content_read_secret),
):
    rows = quran_search(q, lang=lang, include_translit=include_translit, limit=limit)
    return {"ok": True, "items": rows}


@router.get("/quran/{surah}")
def quran_surah(
    surah: int,
    from_ayah: int | None = Query(None, ge=1),
    to_ayah: int | None = Query(None, ge=1),
    _: None = Depends(optional_content_read_secret),
):
    if surah < 1 or surah > 114:
        raise HTTPException(400, detail="surah must be 1..114")
    rows = quran_surah_slice(surah, from_ayah, to_ayah)
    if not rows:
        raise HTTPException(404, detail="surah or range not found")
    return {"ok": True, "surah": surah, "count": len(rows), "ayahs": rows}


@router.get("/quran/{surah}/{ayah}")
def quran_ayah(
    surah: int,
    ayah: int,
    _: None = Depends(optional_content_read_secret),
):
    row = quran_one_ayah(surah, ayah)
    if not row:
        raise HTTPException(404, detail="ayah not found")
    return {"ok": True, "ayah": row}


@router.get("/hadith/random")
def hadith_random(
    source: str = Query(..., min_length=1),
    strict_sahih: bool = Query(False),
    lang: str = Query("kk"),
    unique: bool = Query(
        True,
        description="Тек бірегей жолдар (is_repeated=0). False — кітап ішіндегі қайталанулармен.",
    ),
    _: None = Depends(optional_content_read_secret),
):
    row = hadith_random_for_source(
        source, strict_sahih=strict_sahih, lang=lang, unique_only=unique
    )
    if not row:
        raise HTTPException(404, detail="hadith not found")
    return {"ok": True, "hadith": row}


@router.get("/hadith/search")
def hadith_search_endpoint(
    q: str = Query(..., min_length=1),
    lang: str = Query("kk"),
    limit: int = Query(60, ge=1, le=200),
    unique: bool = Query(
        True,
        description="Тек бірегей жолдар (is_repeated=0). False — толық кітап жолдары.",
    ),
    _: None = Depends(optional_content_read_secret),
):
    rows = hadith_search(q, lang=lang, limit=limit, unique_only=unique)
    return {"ok": True, "items": rows}


@router.get("/hadith/{hadith_id}")
def hadith_one(
    hadith_id: int,
    _: None = Depends(optional_content_read_secret),
):
    cache_key = f"content:hadith:one:v1:{hadith_id}"
    cached = cache_get_json(cache_key)
    if cached and cached.get("ok") and isinstance(cached.get("hadith"), dict):
        return cached
    row = hadith_by_id(hadith_id)
    if not row:
        raise HTTPException(404, detail="hadith not found")
    body = {"ok": True, "hadith": row}
    cache_set_json(cache_key, body, HADITH_BY_ID_CACHE_TTL_SECONDS)
    return body


