#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fatua.kz + Muftyat.kz → data/islamic_kb.sqlite3 (бір CLI)."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / "platform_api"
if str(API) not in sys.path:
    sys.path.insert(0, str(API))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from islamic_kb.config import islamic_kb_official_license, islamic_kb_sync_max_urls  # noqa: E402
from islamic_kb.db import ensure_db, kb_stats  # noqa: E402
from islamic_kb.ingest import ingest_url, sync_site  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser(description="Sync Fatua/Muftyat → RAQAT islamic_kb")
    p.add_argument(
        "--site",
        choices=("fatua", "muftyat", "all"),
        default="all",
        help="Қай сайтты индекстеу",
    )
    p.add_argument("--url", action="append", dest="urls", help="Бір мақала URL")
    p.add_argument("--max", type=int, default=None, help="Sitemap-тен max URL (әдепкі — config)")
    p.add_argument(
        "--full",
        action="store_true",
        help="Толық синхрон (RAQAT_ISLAMIC_KB_OFFICIAL_LICENSE=1 қажет; max=10000)",
    )
    args = p.parse_args()
    ensure_db()

    max_urls = args.max
    if max_urls is None:
        max_urls = islamic_kb_sync_max_urls()
    if args.full:
        if not islamic_kb_official_license():
            print(
                "Ескерту: RAQAT_ISLAMIC_KB_OFFICIAL_LICENSE=1 қойыңыз (ҚМДБ ресми рұқсат).",
                file=sys.stderr,
            )
        max_urls = max(max_urls, 10_000)
        print(f"full sync max_urls={max_urls}", file=sys.stderr)

    if args.urls:
        site = "fatua" if args.site == "all" else args.site
        for u in args.urls:
            r = ingest_url(u, source_site=None if site == "all" else site)
            print(f"{r.status}\t{r.url}\tchunks={r.chunks}")
    else:
        sites = ("fatua", "muftyat") if args.site == "all" else (args.site,)
        for site in sites:
            stats = sync_site(site, max_urls=max_urls)
            print(site, stats)

    print("kb_stats:", kb_stats())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
