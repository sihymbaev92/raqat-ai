# -*- coding: utf-8 -*-
"""
Ресми сұрақ-жауап / нұсқаулық беттерінен мәтін жинау (тек ENV allowlist).

`RAQAT_AI_QA_SOURCE_URLS` — үтірмен бөлінген 1–2 HTTPS URL (қосымша рет саны
`RAQAT_AI_QA_SOURCE_MAX_URLS` арқылы шектеледі). Әр сұрауда қысқа TTL кэш.
"""
from __future__ import annotations

import html as html_lib
import logging
import os
import re
import time
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("raqat_platform.ai_qa_sources")

_WS = re.compile(r"\s+")

_CACHE: dict[str, tuple[float, str]] = {}


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


def parse_qa_source_urls() -> tuple[str, ...]:
    """ENV-тен URL тізімі; тек http(s), рет саны шектелген."""
    raw = (os.getenv("RAQAT_AI_QA_SOURCE_URLS") or "").strip()
    if not raw:
        return ()
    max_n = _int_env("RAQAT_AI_QA_SOURCE_MAX_URLS", 2)
    max_n = max(1, min(max_n, 5))
    out: list[str] = []
    for part in raw.split(","):
        u = part.strip()
        if not u:
            continue
        try:
            p = urlparse(u)
        except Exception:
            continue
        if p.scheme not in ("http", "https") or not p.netloc:
            continue
        out.append(u)
        if len(out) >= max_n:
            break
    return tuple(out)


def html_to_plain_text(html: str) -> str:
    """Қарапайым HTML → мәтін (script/style алынады)."""
    if not html:
        return ""
    t = html
    t = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", t)
    t = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", t)
    t = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html_lib.unescape(t)
    return _WS.sub(" ", t).strip()


def fetch_qa_sources_context() -> str:
    """
    Allowlist URL-дардан мәтін жинайды; бос болса бос жол.
    Кэш: `RAQAT_AI_QA_SOURCE_CACHE_SEC` (әдепкі 600 с).
    """
    urls = parse_qa_source_urls()
    if not urls:
        return ""

    max_total = _int_env("RAQAT_AI_QA_SOURCE_MAX_TOTAL_CHARS", 12_000)
    max_total = max(2000, min(max_total, 50_000))
    ttl = _float_env("RAQAT_AI_QA_SOURCE_CACHE_SEC", 600.0)
    ttl = max(30.0, min(ttl, 86_400.0))
    timeout = _float_env("RAQAT_AI_QA_SOURCE_FETCH_TIMEOUT_SEC", 6.0)
    timeout = max(2.0, min(timeout, 25.0))

    per_url = max(800, min(max_total // len(urls), max_total))
    now = time.monotonic()
    blocks: list[str] = []
    used = 0

    headers = {
        "User-Agent": "Raqat-AI-QA-Context/1.0 (+https://raqat.ai)",
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    }

    try:
        with httpx.Client(
            timeout=timeout,
            follow_redirects=True,
            headers=headers,
        ) as client:
            for url in urls:
                if used >= max_total:
                    break
                text = ""
                hit = _CACHE.get(url)
                if hit is not None and now - hit[0] < ttl:
                    text = hit[1]
                else:
                    try:
                        r = client.get(url)
                        if r.status_code != 200:
                            logger.warning("qa source %s http=%s", url, r.status_code)
                        else:
                            raw = html_to_plain_text(r.text)
                            cap = min(per_url * 2, max_total)
                            text = raw[:cap] if raw else ""
                    except Exception as exc:
                        logger.warning("qa source fetch %s: %s", url, exc)
                        text = ""
                    _CACHE[url] = (now, text)

                if not text.strip():
                    continue
                room = max_total - used - 40
                if room < 120:
                    break
                chunk = text.strip()[:room]
                blocks.append(f"({url})\n{chunk}")
                used += len(blocks[-1]) + 2
    except Exception as exc:
        logger.warning("qa sources client: %s", exc)
        return ""

    if not blocks:
        return ""

    header = (
        "[Ресми сұрақ-жауап / нұсқаулық бетінен үзінді — тек осы мәтінге сүйен; "
        "ойдан аят/хадис қоспа; дәлелсіз үкім берме.]\n"
    )
    body = "\n\n---\n\n".join(blocks)
    out = (header + body).strip()
    if len(out) > max_total:
        out = out[: max_total - 1].rstrip() + "…"
    return out
