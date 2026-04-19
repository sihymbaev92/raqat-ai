# -*- coding: utf-8 -*-
"""
Намаз уақыттары: Aladhan ашық API (токен қажет емес).
https://aladhan.com/prayer-times-api
"""
from __future__ import annotations

import logging
import time
from datetime import UTC, datetime
from typing import Any

import requests
from config.settings import PRAYER_TIMES_CACHE_SECONDS, PRAYER_TIMES_TIMEOUT_SECONDS

logger = logging.getLogger("raqat_ai.prayer_times")

ALADHAN_BY_CITY = "https://api.aladhan.com/v1/timingsByCity"
_PRAYER_TIMES_CACHE: dict[tuple[str, str, int], dict[str, Any]] = {}


def _normalize_time(value: str) -> str:
    """API '05:23 (XXX)' форматынан уақытты алу."""
    if not value:
        return ""
    return value.split()[0].strip()


def _cache_key(city: str, country: str, method: int) -> tuple[str, str, int]:
    return (city.lower(), country.lower(), int(method))


def _checked_at_label(now_ts: float) -> str:
    return datetime.fromtimestamp(now_ts, UTC).strftime("%Y-%m-%d %H:%M UTC")


def _cache_copy(payload: dict[str, Any], cache_status: str) -> dict[str, Any]:
    copied = dict(payload)
    copied["cache_status"] = cache_status
    return copied


def clear_prayer_times_cache() -> None:
    _PRAYER_TIMES_CACHE.clear()


def fetch_prayer_times_by_city(
    city: str,
    country: str,
    method: int = 3,
    timeout: float | None = None,
) -> dict[str, Any] | None:
    """
    Қала/ел бойынша бүгінгі намаз уақыттарын алады.

    method: Aladhan есеп әдісі (әдепкі 3 = Muslim World League).
    Сәтсіз болса None.
    """
    city = (city or "").strip()
    country = (country or "").strip()
    if not city or not country:
        return None

    timeout = PRAYER_TIMES_TIMEOUT_SECONDS if timeout is None else timeout
    now_ts = time.time()
    key = _cache_key(city, country, method)
    cached = _PRAYER_TIMES_CACHE.get(key)

    if cached and now_ts < cached["expires_at"]:
        return _cache_copy(cached["payload"], "cache")

    params = {
        "city": city,
        "country": country,
        "method": method,
    }
    try:
        r = requests.get(ALADHAN_BY_CITY, params=params, timeout=timeout)
        r.raise_for_status()
        payload = r.json()
    except Exception as exc:
        logger.warning("Aladhan API error: %s", exc)
        if cached:
            stale = _cache_copy(cached["payload"], "stale")
            stale["checked_at_utc"] = _checked_at_label(now_ts)
            return stale
        return None

    data = payload.get("data") or {}
    timings = data.get("timings") or {}
    if not timings:
        if cached:
            stale = _cache_copy(cached["payload"], "stale")
            stale["checked_at_utc"] = _checked_at_label(now_ts)
            return stale
        return None

    meta = data.get("date") or {}
    readable = meta.get("readable") or meta.get("gregorian", {}).get("date")
    if not readable:
        readable = datetime.now().strftime("%Y-%m-%d")

    result = {
        "city": city,
        "country": country,
        "date": readable,
        "source": "Aladhan API",
        "method": method,
        "checked_at_utc": _checked_at_label(now_ts),
        "cache_status": "live",
        "Фаджр": _normalize_time(timings.get("Fajr", "")),
        "Күн": _normalize_time(timings.get("Sunrise", "")),
        "Бесін": _normalize_time(timings.get("Dhuhr", "")),
        "Екінті": _normalize_time(timings.get("Asr", "")),
        "Ақшам": _normalize_time(timings.get("Maghrib", "")),
        "Құптан": _normalize_time(timings.get("Isha", "")),
    }
    _PRAYER_TIMES_CACHE[key] = {
        "expires_at": now_ts + max(PRAYER_TIMES_CACHE_SECONDS, 0),
        "payload": dict(result),
    }
    return result
