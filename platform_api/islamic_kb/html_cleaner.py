# -*- coding: utf-8 -*-
from __future__ import annotations

import html as html_lib
import re
from urllib.parse import urljoin

_WS = re.compile(r"\s+")
_TAG = re.compile(r"<[^>]+>")


def html_to_plain_text(html: str) -> str:
    if not html:
        return ""
    t = html
    t = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", t)
    t = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", t)
    t = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", t)
    t = _TAG.sub(" ", t)
    t = html_lib.unescape(t)
    return _WS.sub(" ", t).strip()


def extract_main_html(html: str) -> str:
    """Мақала негізгі бөлімін таңдау (қарапайым эвристика)."""
    if not html:
        return ""
    for pat in (
        r"(?is)<article[^>]*>(.*?)</article>",
        r"(?is)<div[^>]+class=[\"'][^\"']*(?:entry-content|post-content|article-body|content)[^\"']*[\"'][^>]*>(.*?)</div>",
        r"(?is)<main[^>]*>(.*?)</main>",
    ):
        m = re.search(pat, html)
        if m and len(m.group(1)) > 200:
            return m.group(1)
    return html


def extract_title(html: str) -> str:
    m = re.search(r"(?is)<title[^>]*>(.*?)</title>", html or "")
    if not m:
        return ""
    return html_to_plain_text(m.group(1))[:500]


def _normalize_image_url(raw: str, page_url: str) -> str | None:
    url = html_lib.unescape((raw or "").strip())
    if not url or url.startswith("data:"):
        return None
    low = url.lower()
    if low.endswith(".svg") or "logo" in low or "/static/" in low and "upload" not in low:
        return None
    return urljoin(page_url, url)


def extract_article_image_url(html: str, page_url: str) -> str | None:
    """Fatua/Muftyat мақаласынан og:image немесе негізгі сурет."""
    if not html:
        return None
    for pat in (
        r'property=["\']og:image(?::url)?["\'][^>]+content=["\']([^"\']+)',
        r'content=["\']([^"\']+)["\'][^>]+property=["\']og:image(?::url)?["\']',
        r'name=["\']twitter:image(?::src)?["\'][^>]+content=["\']([^"\']+)',
        r'content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image(?::src)?["\']',
    ):
        m = re.search(pat, html, re.I)
        if m:
            url = _normalize_image_url(m.group(1), page_url)
            if url:
                return url
    main = extract_main_html(html)
    for pat in (
        r'<img[^>]+src=["\']([^"\']+/media/upload/[^"\']+)["\']',
        r'<img[^>]+src=["\']([^"\']+/upload/[^"\']+)["\']',
        r'<img[^>]+src=["\']([^"\']+)["\']',
    ):
        m = re.search(pat, main, re.I)
        if m:
            url = _normalize_image_url(m.group(1), page_url)
            if url:
                return url
    return None
