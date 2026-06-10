# -*- coding: utf-8 -*-
"""
halaldamu.kz WordPress JSON API — платформа прокси + серверлік кэш.

Мобильді/веб клиент Platform API арқылы сұрау жібереді (CORS, бір User-Agent, кэш).
"""
from __future__ import annotations

import json
import logging
import os
import time
from typing import Any
from urllib.parse import urlencode

import httpx

logger = logging.getLogger("raqat_platform.halal_damu")

_ALLOWED_PREFIXES = (
    "halal-bot/v1/companies",
    "halal-bot/v1/products",
    "halal-bot/v1/additives",
    "wp/v2/company",
)

# cache_key -> (expires_at, ttl_sec, status_code, body_bytes)
_CACHE: dict[str, tuple[float, int, int, bytes]] = {}
_MAX_CACHE_ENTRIES = 450


def halal_damu_proxy_enabled() -> bool:
    raw = (os.getenv("RAQAT_HALAL_DAMU_PROXY_ENABLED") or "1").strip().lower()
    return raw not in ("0", "false", "no", "off")


def halal_damu_origin() -> str:
    return (os.getenv("RAQAT_HALAL_DAMU_ORIGIN") or "https://halaldamu.kz").strip().rstrip("/")


def _int_env(key: str, default: int) -> int:
    raw = os.getenv(key)
    if raw is None or not str(raw).strip():
        return default
    try:
        return int(str(raw).strip())
    except ValueError:
        return default


def _float_env(key: str, default: float) -> float:
    raw = os.getenv(key)
    if raw is None or not str(raw).strip():
        return default
    try:
        return float(str(raw).strip())
    except ValueError:
        return default


def validate_halal_damu_path(path: str) -> str:
    """Allowlist — тек halal-bot / wp company JSON."""
    p = (path or "").strip().lstrip("/")
    if not p:
        raise ValueError("path_required")
    for prefix in _ALLOWED_PREFIXES:
        if p == prefix or p.startswith(prefix + "/"):
            return p
    if p.startswith("halal-bot/v1/companies/"):
        tail = p[len("halal-bot/v1/companies/") :].split("?", 1)[0]
        if tail.isdigit():
            return p
    raise ValueError("path_not_allowed")


def cache_ttl_for_path(path: str, query: dict[str, str]) -> int:
    """Секунд — маршрутқа қарай TTL."""
    base = _int_env("RAQAT_HALAL_DAMU_CACHE_TTL_SEC", 3600)
    p = path.split("?", 1)[0]
    if p.startswith("wp/v2/company"):
        return _int_env("RAQAT_HALAL_DAMU_CACHE_WP_COMPANY_SEC", 86400)
    if p.startswith("halal-bot/v1/companies/") and p.count("/") >= 4:
        return _int_env("RAQAT_HALAL_DAMU_CACHE_COMPANY_ID_SEC", 1800)
    if p.startswith("halal-bot/v1/companies"):
        if query.get("search", "").strip():
            return _int_env("RAQAT_HALAL_DAMU_CACHE_COMPANIES_SEARCH_SEC", 300)
        return base
    if p.startswith("halal-bot/v1/products"):
        if query.get("barcode", "").strip():
            return _int_env("RAQAT_HALAL_DAMU_CACHE_PRODUCTS_BARCODE_SEC", 900)
        return _int_env("RAQAT_HALAL_DAMU_CACHE_PRODUCTS_SEC", 300)
    if p.startswith("halal-bot/v1/additives"):
        return _int_env("RAQAT_HALAL_DAMU_CACHE_ADDITIVES_SEC", 600)
    return 300


def _cache_key(path: str, query: dict[str, str]) -> str:
    qs = urlencode(sorted(query.items())) if query else ""
    return f"{path}?{qs}" if qs else path


def _evict_cache_if_needed() -> None:
    now = time.time()
    expired = [k for k, (exp, _, _, _) in _CACHE.items() if exp <= now]
    for k in expired:
        del _CACHE[k]
    if len(_CACHE) <= _MAX_CACHE_ENTRIES:
        return
    ordered = sorted(_CACHE.items(), key=lambda item: item[1][0])
    for k, _ in ordered[: max(0, len(_CACHE) - _MAX_CACHE_ENTRIES)]:
        del _CACHE[k]


def cache_stats() -> dict[str, Any]:
    now = time.time()
    live = sum(1 for exp, _, _, _ in _CACHE.values() if exp > now)
    return {"entries": len(_CACHE), "live": live, "max": _MAX_CACHE_ENTRIES}


def clear_halal_damu_cache() -> int:
    n = len(_CACHE)
    _CACHE.clear()
    return n


def fetch_halal_damu_json(
    path: str,
    query: dict[str, str] | None = None,
    *,
    force_network: bool = False,
) -> tuple[int, dict[str, Any] | list[Any] | None, dict[str, str]]:
    """
    JSON жауап + response headers dict (X-Raqat-Halal-Cache, …).
 
    Raises ValueError on disallowed path.
    """
    safe_path = validate_halal_damu_path(path)
    q = {k: str(v) for k, v in (query or {}).items() if v is not None and str(v).strip() != ""}
    ck = _cache_key(safe_path, q)
    now = time.time()
    if not force_network and ck in _CACHE:
        exp, ttl, status, body = _CACHE[ck]
        if exp > now and body:
            age = int(ttl - (exp - now))
            try:
                parsed = json.loads(body.decode("utf-8"))
            except json.JSONDecodeError:
                parsed = None
            return (
                status,
                parsed,
                {
                    "X-Raqat-Halal-Cache": "hit",
                    "X-Raqat-Halal-Cache-Age-Sec": str(max(0, age)),
                },
            )

    upstream = f"{halal_damu_origin()}/wp-json/{safe_path}"
    if q:
        upstream = f"{upstream}?{urlencode(q)}"

    timeout = _float_env("RAQAT_HALAL_DAMU_FETCH_TIMEOUT_SEC", 120.0)
    headers = {
        "Accept": "application/json",
        "User-Agent": "Raqat-Platform/1.0 (Halal Damu proxy; +https://raqat.ai)",
    }
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            r = client.get(upstream, headers=headers)
    except httpx.HTTPError as exc:
        logger.warning("halal_damu upstream error path=%s: %s", safe_path, exc)
        stale = _CACHE.get(ck)
        if stale and stale[3]:
            exp, ttl, status, body = stale
            try:
                parsed = json.loads(body.decode("utf-8"))
            except json.JSONDecodeError:
                parsed = None
            return (
                status,
                parsed,
                {
                    "X-Raqat-Halal-Cache": "stale",
                    "X-Raqat-Halal-Cache-Age-Sec": str(int(ttl)),
                },
            )
        raise

    body = r.content or b""
    ttl = cache_ttl_for_path(safe_path, q)
    if r.status_code == 200 and body:
        _CACHE[ck] = (now + ttl, ttl, r.status_code, body)
        _evict_cache_if_needed()

    try:
        parsed: dict[str, Any] | list[Any] | None = json.loads(body.decode("utf-8")) if body else None
    except json.JSONDecodeError:
        parsed = None

    return (
        r.status_code,
        parsed,
        {
            "X-Raqat-Halal-Cache": "miss",
            "X-Raqat-Halal-Upstream-Status": str(r.status_code),
        },
    )
