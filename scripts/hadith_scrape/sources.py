# -*- coding: utf-8 -*-
from __future__ import annotations

import html as html_lib
import re
from urllib.parse import urljoin, urlparse

from hadith_scrape.fetch import fetch_html

_HREF = re.compile(r"""href\s*=\s*["']([^"'#]+)["']""", re.I)
_PAGE_NUM = re.compile(r"[?&]page=(\d+)", re.I)
_HADITH_SLUG = re.compile(r"(?i)hadis|hadith|хадис")

_FATUA_LISTING_BASES: tuple[str, ...] = (
    "https://fatua.kz/kk/fatwas",
    "https://fatua.kz/kk/qa",
    "https://fatua.kz/kk/media",
)

_MUFTYAT_LISTING_BASES: tuple[str, ...] = (
    "https://www.muftyat.kz/kk/articles/",
    "https://www.muftyat.kz/kk/news/",
    "https://www.muftyat.kz/kk/qa/",
)


def discover_article_urls(html: str, page_url: str, *, site: str, max_urls: int) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    host = urlparse(page_url).netloc.lower()
    for m in _HREF.finditer(html or ""):
        href = html_lib.unescape((m.group(1) or "").strip())
        if not href or href.startswith(("mailto:", "javascript:", "tel:")):
            continue
        full = urljoin(page_url, href)
        p = urlparse(full)
        if p.netloc.lower() != host:
            continue
        if full in seen:
            continue
        if not _looks_like_content(full, site):
            continue
        seen.add(full)
        found.append(full)
        if len(found) >= max_urls:
            break
    return found


def _looks_like_content(url: str, site: str) -> bool:
    low = url.lower().rstrip("/")
    if site == "islam":
        if "/articles/" not in low:
            return False
        # Тек навигация/бөлім емес, нақты мақала (slug + id немесе терең path)
        if low.endswith("/articles/home") or low.endswith("/articles"):
            return False
        parts = [p for p in urlparse(url).path.split("/") if p]
        return len(parts) >= 4
    if site == "muslim":
        if "/articles/" not in low and "/news/" not in low:
            return False
        if low.endswith("/articles") or low.endswith("/news"):
            return False
        return True
    if site == "fatua":
        return bool(re.search(r"/kk/(?:qa|fatwas|media)/read/\d{4}-\d{2}-\d{2}/", low))
    if site == "muftyat":
        if re.search(r"/kk/(?:articles|news|qa)/[a-z0-9_-]+/\d{4}-\d{2}-\d{2}/\d+", low):
            return True
        return False
    return False


def _max_listing_page(html: str) -> int:
    nums = [int(x) for x in _PAGE_NUM.findall(html or "")]
    return max(nums) if nums else 1


def _fatua_listing_page_url(base: str, page: int) -> str:
    base = base.rstrip("/")
    if page <= 1:
        return base
    return f"{base}?page={page}&category_id=0"


def _muftyat_listing_page_url(base: str, page: int) -> str:
    base = base.rstrip("/") + "/"
    if page <= 1:
        return base
    return f"{base}?page={page}"


def _discover_fatua_paginated(*, max_urls: int, max_pages: int) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for base in _FATUA_LISTING_BASES:
        if len(out) >= max_urls:
            break
        try:
            first_html = fetch_html(_fatua_listing_page_url(base, 1), delay=0)
            last_page = min(_max_listing_page(first_html), max_pages)
        except Exception:
            continue
        for page_no in range(1, last_page + 1):
            if len(out) >= max_urls:
                break
            page_url = _fatua_listing_page_url(base, page_no)
            try:
                html = first_html if page_no == 1 else fetch_html(page_url, delay=0)
                for u in discover_article_urls(html, page_url, site="fatua", max_urls=max_urls - len(out)):
                    if u in seen:
                        continue
                    seen.add(u)
                    out.append(u)
            except Exception:
                continue
    return out[:max_urls]


def _discover_muftyat_paginated(*, max_urls: int, max_pages: int) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for base in _MUFTYAT_LISTING_BASES:
        if len(out) >= max_urls:
            break
        empty_streak = 0
        for page_no in range(1, max_pages + 1):
            if len(out) >= max_urls:
                break
            page_url = _muftyat_listing_page_url(base, page_no)
            try:
                html = fetch_html(page_url, delay=0)
            except Exception:
                break
            added = 0
            for u in discover_article_urls(html, page_url, site="muftyat", max_urls=max_urls - len(out)):
                if u in seen:
                    continue
                seen.add(u)
                out.append(u)
                added += 1
                if len(out) >= max_urls:
                    break
            if added == 0:
                empty_streak += 1
                if empty_streak >= 2:
                    break
            else:
                empty_streak = 0
    return out[:max_urls]


def filter_hadith_urls(urls: list[str]) -> list[str]:
    return [u for u in urls if _HADITH_SLUG.search(u)]


def seed_urls_for_site(site: str) -> list[str]:
    seeds: dict[str, list[str]] = {
        "islam": [
            "https://islam.kz/kk/articles/aqida/arturli/azireti-mahdi-jaiynda-aitqan-hadister-4878/",
        ],
        "muslim": [
            "https://muslim.kz/kk/search?q=%D1%85%D0%B0%D0%B4%D0%B8%D1%81",
        ],
        "fatua": [
            "https://fatua.kz/kk/fatwas/",
            "https://fatua.kz/kk/qa/",
        ],
        "muftyat": [
            "https://www.muftyat.kz/kk/articles/islam-and-society/2026-05-06/48301-bu-hanifanyi-hadisteg-ornyi/",
        ],
    }
    return seeds.get(site, [])


def listing_urls(site: str, max_pages: int) -> list[str]:
    urls: list[str] = []
    if site == "islam":
        for page in range(1, max_pages + 1):
            urls.append(f"https://islam.kz/kk/articles/?page={page}")
        return urls
    if site == "muslim":
        for page in range(1, max_pages + 1):
            q = "https://muslim.kz/kk/search?q=%D1%85%D0%B0%D0%B4%D0%B8%D1%81"
            urls.append(q if page == 1 else f"{q}&page={page}")
        return urls
    if site == "fatua":
        for page in range(1, max_pages + 1):
            urls.append(f"https://fatua.kz/kk/fatwas/?page={page}" if page > 1 else "https://fatua.kz/kk/fatwas/")
            urls.append(f"https://fatua.kz/kk/qa/?page={page}" if page > 1 else "https://fatua.kz/kk/qa/")
        return urls
    if site == "muftyat":
        for page in range(1, max_pages + 1):
            urls.append(f"https://www.muftyat.kz/kk/articles/?page={page}" if page > 1 else "https://www.muftyat.kz/kk/articles/")
        return urls
    return seed_urls_for_site(site)


def crawl_site(
    site: str,
    *,
    max_pages: int,
    delay: float,
    hadith_only: bool = False,
    max_urls: int = 0,
) -> list[str]:
    """Listing + seed URL-дерден мақала/бет сілтемелерін жинайды."""
    cap = max_urls if max_urls > 0 else max_pages * 40
    if site == "fatua":
        queue = _discover_fatua_paginated(max_urls=cap, max_pages=max_pages)
    elif site == "muftyat":
        queue = _discover_muftyat_paginated(max_urls=cap, max_pages=max_pages)
    else:
        queue = []
        seen: set[str] = set()
        for listing in listing_urls(site, max_pages):
            if listing in seen:
                continue
            seen.add(listing)
            try:
                html = fetch_html(listing, delay=delay)
            except Exception:
                continue
            for u in discover_article_urls(html, listing, site=site, max_urls=80):
                if u not in seen:
                    seen.add(u)
                    queue.append(u)
    seen_final: set[str] = set(queue)
    for seed in seed_urls_for_site(site):
        if seed not in seen_final:
            seen_final.add(seed)
            queue.append(seed)
    if hadith_only:
        queue = filter_hadith_urls(queue)
    return queue[:cap]
