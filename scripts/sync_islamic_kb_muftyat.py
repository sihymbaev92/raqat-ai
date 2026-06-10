#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Muftyat.kz мақалаларын islamic_kb.sqlite3 индекстеу."""
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

from islamic_kb.config import islamic_kb_sync_max_urls  # noqa: E402
from islamic_kb.db import ensure_db, kb_stats  # noqa: E402
from islamic_kb.ingest import ingest_url, sync_site  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser(description="Sync Muftyat.kz → RAQAT islamic_kb")
    p.add_argument("--url", action="append", dest="urls", help="Бір мақала URL")
    p.add_argument("--max", type=int, default=islamic_kb_sync_max_urls(), help="Sitemap-тен max URL")
    args = p.parse_args()
    ensure_db()
    if args.urls:
        for u in args.urls:
            r = ingest_url(u, source_site="muftyat")
            print(f"{r.status}\t{r.url}\tchunks={r.chunks}")
    else:
        stats = sync_site("muftyat", max_urls=args.max)
        print(stats)
    print("kb_stats:", kb_stats())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
