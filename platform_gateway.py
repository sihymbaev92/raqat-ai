# -*- coding: utf-8 -*-
"""
Telegram бот → platform_api: бір дерек көзі стратегиясы.
`RAQAT_PLATFORM_URL` + опциялы `RAQAT_CONTENT_READ_SECRET`, `RAQAT_BOT_SYNC_SECRET`.
Сәтсіз болса әдепкіде бот жергілікті SQLite-ға өтеді (fallback).
`RAQAT_BOT_API_ONLY=1` болса контентті тек API арқылы — fallback жоқ (дерек тек серверде).
"""
from __future__ import annotations

import os
from typing import Any, List, Optional

import httpx


def platform_base_url() -> str:
    """`RAQAT_PLATFORM_URL` әдепкі; жоқ болса `RAQAT_PLATFORM_API_BASE` (мобильді/ескі .env)."""
    raw = (os.getenv("RAQAT_PLATFORM_URL") or os.getenv("RAQAT_PLATFORM_API_BASE") or "").strip()
    return raw.rstrip("/")


def platform_content_enabled() -> bool:
    return bool(platform_base_url())


def bot_sync_enabled() -> bool:
    return bool(platform_base_url() and (os.getenv("RAQAT_BOT_SYNC_SECRET") or "").strip())


def bot_api_content_only() -> bool:
    """Өндіріс: контентті тек platform_api-дан оқу; SQLite fallback болдырмау."""
    return (os.getenv("RAQAT_BOT_API_ONLY") or "").strip().lower() in ("1", "true", "yes", "on")


def _content_headers() -> dict[str, str]:
    h: dict[str, str] = {}
    s = (os.getenv("RAQAT_CONTENT_READ_SECRET") or "").strip()
    if s:
        h["X-Raqat-Content-Secret"] = s
    return h


def _bot_headers() -> dict[str, str]:
    h: dict[str, str] = {}
    s = (os.getenv("RAQAT_BOT_SYNC_SECRET") or "").strip()
    if s:
        h["X-Raqat-Bot-Sync-Secret"] = s
    return h


def _ayah_pick_lang(row: dict[str, Any], lang: str) -> str:
    lang = (lang or "kk").strip().lower()
    if lang == "ru":
        return (row.get("text_ru") or row.get("text_kk") or row.get("text_en") or "") or ""
    if lang == "en":
        return (row.get("text_en") or row.get("text_kk") or "") or ""
    return (row.get("text_kk") or row.get("text_kz") or row.get("text_en") or "") or ""


async def http_content_quran_search(
    client: httpx.AsyncClient,
    base: str,
    query: str,
    lang: str,
    limit: int = 3,
) -> Optional[List[dict[str, Any]]]:
    try:
        r = await client.get(
            f"{base}/api/v1/quran/search",
            params={"q": query, "lang": lang, "limit": limit, "include_translit": "true"},
            headers=_content_headers(),
        )
        r.raise_for_status()
        data = r.json()
        items = data.get("items") or []
        out: list[dict[str, Any]] = []
        for it in items:
            out.append(
                {
                    "surah": int(it["surah"]),
                    "ayah": int(it["ayah"]),
                    "surah_name": it.get("surah_name"),
                    "text_ar": it.get("text_ar") or "",
                    "text_lang": (it.get("text_tr") or it.get("text_kk") or "") or "",
                }
            )
        return out
    except Exception:
        return None


async def http_content_quran_surah(
    client: httpx.AsyncClient,
    base: str,
    surah: int,
    lang: str,
) -> Optional[List[dict[str, Any]]]:
    try:
        r = await client.get(
            f"{base}/api/v1/quran/{int(surah)}",
            headers=_content_headers(),
        )
        r.raise_for_status()
        data = r.json()
        ayahs = data.get("ayahs") or []
        out: list[dict[str, Any]] = []
        for it in ayahs:
            if not isinstance(it, dict):
                continue
            out.append(
                {
                    "surah": int(it.get("surah") or surah),
                    "ayah": int(it["ayah"]),
                    "surah_name": it.get("surah_name"),
                    "text_ar": it.get("text_ar") or "",
                    "text_lang": _ayah_pick_lang(it, lang),
                }
            )
        return out
    except Exception:
        return None


async def http_content_quran_ayah(
    client: httpx.AsyncClient,
    base: str,
    surah: int,
    ayah: int,
    lang: str,
) -> Optional[dict[str, Any]]:
    try:
        r = await client.get(
            f"{base}/api/v1/quran/{int(surah)}/{int(ayah)}",
            headers=_content_headers(),
        )
        r.raise_for_status()
        data = r.json()
        it = data.get("ayah")
        if not isinstance(it, dict):
            return None
        return {
            "surah": int(it.get("surah") or surah),
            "ayah": int(it.get("ayah") or ayah),
            "surah_name": it.get("surah_name"),
            "text_ar": it.get("text_ar") or "",
            "text_lang": _ayah_pick_lang(it, lang),
        }
    except Exception:
        return None


async def http_content_hadith_random(
    client: httpx.AsyncClient,
    base: str,
    lang: str,
) -> Optional[dict[str, Any]]:
    try:
        r = await client.get(
            f"{base}/api/v1/hadith/random",
            params={"lang": lang},
            headers=_content_headers(),
        )
        r.raise_for_status()
        data = r.json()
        h = data.get("hadith")
        if not isinstance(h, dict):
            return None
        return {
            "source": h.get("source") or "",
            "text_ar": h.get("text_ar") or "",
            "text_lang": (h.get("text_tr") or h.get("text_kk") or "") or "",
            "grade": h.get("grade") or "",
        }
    except Exception:
        return None


async def http_bot_user_upsert(
    client: httpx.AsyncClient,
    base: str,
    user_id: int,
    lang: str,
    username: str,
    full_name: str,
) -> bool:
    try:
        r = await client.post(
            f"{base}/api/v1/bot/sync/user",
            json={
                "user_id": int(user_id),
                "lang": lang,
                "username": username or None,
                "full_name": full_name or None,
            },
            headers=_bot_headers(),
        )
        r.raise_for_status()
        return True
    except Exception:
        return False


async def http_bot_user_lang(
    client: httpx.AsyncClient,
    base: str,
    user_id: int,
) -> Optional[str]:
    try:
        r = await client.get(
            f"{base}/api/v1/bot/sync/user/{int(user_id)}/lang",
            headers=_bot_headers(),
        )
        r.raise_for_status()
        data = r.json()
        return str(data.get("lang") or "kk")
    except Exception:
        return None


async def http_bot_bookmarks_list(
    client: httpx.AsyncClient,
    base: str,
    user_id: int,
    limit: int = 20,
) -> Optional[List[dict[str, Any]]]:
    try:
        r = await client.get(
            f"{base}/api/v1/bot/sync/bookmarks/{int(user_id)}",
            params={"limit": limit},
            headers=_bot_headers(),
        )
        r.raise_for_status()
        data = r.json()
        return list(data.get("items") or [])
    except Exception:
        return None


async def http_bot_bookmark_add(
    client: httpx.AsyncClient,
    base: str,
    user_id: int,
    surah: int,
    ayah: int,
    text_ar: str,
    text_lang: str,
) -> bool:
    try:
        r = await client.post(
            f"{base}/api/v1/bot/sync/bookmark",
            json={
                "user_id": int(user_id),
                "surah": int(surah),
                "ayah": int(ayah),
                "text_ar": text_ar,
                "text_lang": text_lang,
            },
            headers=_bot_headers(),
        )
        r.raise_for_status()
        return True
    except Exception:
        return False


async def http_bot_stats(
    client: httpx.AsyncClient,
    base: str,
) -> Optional[tuple[int, int]]:
    try:
        r = await client.get(f"{base}/api/v1/bot/sync/stats", headers=_bot_headers())
        r.raise_for_status()
        data = r.json()
        return int(data.get("users") or 0), int(data.get("bookmarks") or 0)
    except Exception:
        return None


async def http_bot_user_ids(
    client: httpx.AsyncClient,
    base: str,
) -> Optional[List[int]]:
    try:
        r = await client.get(f"{base}/api/v1/bot/sync/user-ids", headers=_bot_headers())
        r.raise_for_status()
        data = r.json()
        raw = data.get("user_ids") or []
        return [int(x) for x in raw]
    except Exception:
        return None
