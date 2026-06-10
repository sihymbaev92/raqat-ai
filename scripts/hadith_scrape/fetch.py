# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
import time
from urllib.parse import urlparse

import httpx

from hadith_scrape.config import USER_AGENT, fetch_delay_sec, fetch_timeout_sec

logger = logging.getLogger("raqat.hadith_scrape.fetch")

_last_fetch_at = 0.0


def site_from_url(url: str) -> str:
    host = (urlparse(url).netloc or "").lower()
    if "fatua.kz" in host:
        return "fatua"
    if "muftyat.kz" in host:
        return "muftyat"
    if "islam.kz" in host:
        return "islam"
    if "muslim.kz" in host:
        return "muslim"
    return host.replace(".", "_")[:32] or "unknown"


def polite_sleep(delay: float | None = None) -> None:
    global _last_fetch_at
    sec = fetch_delay_sec() if delay is None else max(0.5, delay)
    now = time.monotonic()
    wait = sec - (now - _last_fetch_at)
    if wait > 0:
        time.sleep(wait)
    _last_fetch_at = time.monotonic()


def fetch_html(url: str, *, delay: float | None = None) -> str:
    polite_sleep(delay)
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "kk,ru;q=0.8",
    }
    timeout = fetch_timeout_sec()
    with httpx.Client(timeout=timeout, follow_redirects=True, headers=headers) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.text
