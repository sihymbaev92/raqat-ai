# -*- coding: utf-8 -*-
from __future__ import annotations

import os
from pathlib import Path


def _bool_env(key: str, default: bool = False) -> bool:
    raw = os.getenv(key)
    if raw is None or not str(raw).strip():
        return default
    return str(raw).strip().lower() not in ("0", "false", "no", "off")


def _int_env(key: str, default: int) -> int:
    raw = os.getenv(key)
    if raw is None or not str(raw).strip():
        return default
    try:
        return int(str(raw).strip())
    except ValueError:
        return default


def islamic_kb_enabled() -> bool:
    return _bool_env("RAQAT_ISLAMIC_KB_ENABLED", False)


def islamic_kb_db_path() -> Path:
    raw = (os.getenv("RAQAT_ISLAMIC_KB_DB_PATH") or "").strip()
    if raw:
        return Path(raw)
    base = (os.getenv("RAQAT_DB_PATH") or os.getenv("DB_PATH") or "").strip()
    if base:
        return Path(base).parent / "islamic_kb.sqlite3"
    return Path(__file__).resolve().parents[2] / "data" / "islamic_kb.sqlite3"


def islamic_kb_top_k() -> int:
    return max(1, min(_int_env("RAQAT_ISLAMIC_KB_TOP_K", 5), 12))


def islamic_kb_min_score() -> float:
    raw = os.getenv("RAQAT_ISLAMIC_KB_MIN_SCORE")
    if raw is None or not str(raw).strip():
        return 0.08
    try:
        return float(str(raw).strip())
    except ValueError:
        return 0.08


def islamic_kb_max_context_chars() -> int:
    return max(2000, min(_int_env("RAQAT_ISLAMIC_KB_MAX_CONTEXT_CHARS", 9000), 24_000))


def islamic_kb_chunk_chars() -> int:
    return max(400, min(_int_env("RAQAT_ISLAMIC_KB_CHUNK_CHARS", 1800), 4000))


def islamic_kb_fetch_timeout() -> float:
    raw = os.getenv("RAQAT_ISLAMIC_KB_FETCH_TIMEOUT_SEC")
    if raw is None or not str(raw).strip():
        return 12.0
    try:
        return float(str(raw).strip())
    except ValueError:
        return 12.0


def islamic_kb_official_license() -> bool:
    """ҚМДБ / Muftyat / Fatua ресми көшіру рұқсаты (жазбаша келісім)."""
    return _bool_env("RAQAT_ISLAMIC_KB_OFFICIAL_LICENSE", False)


def islamic_kb_license_note(source_site: str) -> str | None:
    if not islamic_kb_official_license():
        return None
    site = (source_site or "").strip().lower()
    if site == "fatua":
        return "Fatua.kz — ҚМДБ ресми порталы. RAQAT-қа мазмұнды көшіруге ресми рұқсат."
    if site == "muftyat":
        return "Muftyat.kz — ҚМДБ ресми порталы. RAQAT-қа мазмұнды көшіруге ресми рұқсат."
    return "ҚМДБ ресми дереккөз. RAQAT-қа мазмұнды көшіруге ресми рұқсат."


def islamic_kb_sync_max_urls() -> int:
    default = 10_000 if islamic_kb_official_license() else 80
    cap = 100_000 if islamic_kb_official_license() else 500
    return max(1, min(_int_env("RAQAT_ISLAMIC_KB_SYNC_MAX_URLS", default), cap))


def islamic_kb_fetch_delay_sec() -> float:
    """Скрейпер арасындағы кідіріс (rate limit / anti-bot)."""
    raw = os.getenv("RAQAT_ISLAMIC_KB_FETCH_DELAY_SEC")
    if raw is None or not str(raw).strip():
        return 1.2
    try:
        return max(0.0, min(float(str(raw).strip()), 30.0))
    except ValueError:
        return 1.2


def islamic_kb_search_excerpt_chars() -> int:
    default = 1200 if islamic_kb_official_license() else 280
    cap = 8000 if islamic_kb_official_license() else 600
    return max(80, min(_int_env("RAQAT_ISLAMIC_KB_EXCERPT_CHARS", default), cap))


def islamic_kb_max_listing_pages() -> int:
    """Fatua тізім беті: ?page=N — бір бөлім бойынша max бет."""
    default = 200 if islamic_kb_official_license() else 25
    cap = 500 if islamic_kb_official_license() else 100
    return max(1, min(_int_env("RAQAT_ISLAMIC_KB_MAX_LISTING_PAGES", default), cap))


def allowed_source_sites() -> frozenset[str]:
    raw = (os.getenv("RAQAT_ISLAMIC_KB_SOURCES") or "fatua,muftyat").strip()
    sites = {s.strip().lower() for s in raw.split(",") if s.strip()}
    return frozenset(sites or {"fatua", "muftyat"})
