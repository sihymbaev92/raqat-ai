# -*- coding: utf-8 -*-
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

USER_AGENT = os.getenv(
    "RAQAT_HADITH_SCRAPE_UA",
    "RAQAT-HadithScrape/1.0 (+https://rahatomir.com; respectful indexer; contact=admin@rahatomir.com)",
)


def default_db_path() -> Path:
    raw = (os.getenv("RAQAT_HADITH_SCRAPE_DB") or "").strip()
    if raw:
        return Path(raw)
    return ROOT / "data" / "hadith_scrape.sqlite3"


def fetch_delay_sec() -> float:
    raw = os.getenv("RAQAT_HADITH_SCRAPE_DELAY_SEC")
    if raw is None or not str(raw).strip():
        return 1.5
    try:
        return max(0.5, min(float(str(raw).strip()), 30.0))
    except ValueError:
        return 1.5


def fetch_timeout_sec() -> float:
    raw = os.getenv("RAQAT_HADITH_SCRAPE_TIMEOUT_SEC")
    if raw is None or not str(raw).strip():
        return 25.0
    try:
        return max(5.0, min(float(str(raw).strip()), 120.0))
    except ValueError:
        return 25.0


def max_pages_default() -> int:
    raw = os.getenv("RAQAT_HADITH_SCRAPE_MAX_PAGES")
    if raw is None or not str(raw).strip():
        return 25
    try:
        return max(1, min(int(str(raw).strip()), 5000))
    except ValueError:
        return 25
