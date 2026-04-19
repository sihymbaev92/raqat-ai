# -*- coding: utf-8 -*-
"""RAQAT_REDIS_URL: redis://host:port → redis://host:port/0"""
from __future__ import annotations

from urllib.parse import urlparse, urlunparse


def normalize_redis_url(url: str) -> str:
    raw = (url or "").strip()
    if not raw:
        return "redis://127.0.0.1:6379/0"
    parsed = urlparse(raw)
    path = parsed.path or ""
    if path in ("", "/"):
        parsed = parsed._replace(path="/0")
    return urlunparse(parsed)
