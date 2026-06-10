#!/usr/bin/env python3
"""VPS/local: Muftyat URL discovery sanity check."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "platform_api"))

from islamic_kb.ingest import discover_article_urls  # noqa: E402

urls = discover_article_urls("muftyat", max_urls=50)
print("count", len(urls))
if urls:
    print("first", urls[0])
