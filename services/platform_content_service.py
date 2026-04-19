# -*- coding: utf-8 -*-
from __future__ import annotations

from typing import Any

import httpx

from config.settings import (
    RAQAT_CONTENT_READ_SECRET,
    RAQAT_PLATFORM_API_BASE,
)


def _configured() -> bool:
    return bool(RAQAT_PLATFORM_API_BASE)


def _headers() -> dict[str, str]:
    h: dict[str, str] = {}
    if RAQAT_CONTENT_READ_SECRET:
        h["X-Raqat-Content-Secret"] = RAQAT_CONTENT_READ_SECRET
    return h


def _get(path: str, params: dict[str, Any], timeout: float = 25.0) -> tuple[int | None, dict[str, Any] | None]:
    if not _configured():
        return None, None
    url = f"{RAQAT_PLATFORM_API_BASE.rstrip('/')}{path}"
    try:
        r = httpx.get(url, params=params, headers=_headers(), timeout=timeout)
    except Exception:
        return None, None
    if r.status_code != 200:
        return r.status_code, None
    try:
        return r.status_code, r.json()
    except Exception:
        return r.status_code, None


def fetch_hadith_random(source: str, *, strict_sahih: bool, lang: str) -> tuple[dict[str, Any] | None, str | None]:
    status, data = _get(
        "/api/v1/hadith/random",
        {"source": source, "strict_sahih": 1 if strict_sahih else 0, "lang": lang},
    )
    if status == 404:
        return None, "not_found"
    if status != 200 or not data or not data.get("ok"):
        return None, "unavailable"
    row = data.get("hadith")
    if not isinstance(row, dict):
        return None, "unavailable"
    return row, None


def fetch_hadith_search(query: str, *, lang: str, limit: int = 60) -> list[dict[str, Any]] | None:
    status, data = _get("/api/v1/hadith/search", {"q": query, "lang": lang, "limit": int(limit)})
    if status != 200 or not data or not data.get("ok"):
        return None
    items = data.get("items")
    if not isinstance(items, list):
        return None
    return [i for i in items if isinstance(i, dict)]


def fetch_quran_search(
    query: str,
    *,
    lang: str,
    include_translit: bool,
    limit: int = 5,
) -> list[dict[str, Any]] | None:
    status, data = _get(
        "/api/v1/quran/search",
        {
            "q": query,
            "lang": lang,
            "include_translit": 1 if include_translit else 0,
            "limit": int(limit),
        },
    )
    if status != 200 or not data or not data.get("ok"):
        return None
    items = data.get("items")
    if not isinstance(items, list):
        return None
    return [i for i in items if isinstance(i, dict)]


def fetch_quran_surah(surah: int) -> tuple[list[dict[str, Any]] | None, str | None]:
    status, data = _get("/api/v1/quran/{0}".format(int(surah)), {})
    if status == 404:
        return None, "not_found"
    if status != 200 or not data or not data.get("ok"):
        return None, "unavailable"
    items = data.get("ayahs")
    if not isinstance(items, list):
        return None, "unavailable"
    return [i for i in items if isinstance(i, dict)], None
