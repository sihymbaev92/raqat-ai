# -*- coding: utf-8 -*-
from __future__ import annotations

import html as html_lib
import logging
import re
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse

import httpx

from islamic_kb.chunking import chunk_plain_text
from islamic_kb.config import (
    islamic_kb_chunk_chars,
    islamic_kb_fetch_delay_sec,
    islamic_kb_fetch_timeout,
    islamic_kb_license_note,
    islamic_kb_max_listing_pages,
    islamic_kb_official_license,
)
from islamic_kb.db import connect, content_hash, utc_now_iso
from islamic_kb.html_cleaner import (
    extract_article_image_url,
    extract_main_html,
    extract_title,
    html_to_plain_text,
)

logger = logging.getLogger("raqat_platform.islamic_kb.ingest")

_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
_HREF = re.compile(r"""href\s*=\s*["']([^"'#]+)["']""", re.I)
_PAGE_NUM = re.compile(r"[?&]page=(\d+)", re.I)

_FATUA_LISTING_BASES: tuple[str, ...] = (
    "https://fatua.kz/kk",
    "https://fatua.kz/kk/qa",
    "https://fatua.kz/kk/fatwas",
    "https://fatua.kz/kk/media",
)

# Muftyat: /kk/articles (slash жоқ) → сервер 500; тек trailing slash URL-дер.
_MUFTYAT_LISTING_BASES: tuple[str, ...] = (
    "https://www.muftyat.kz/kk/articles/",
    "https://www.muftyat.kz/kk/news/",
    "https://www.muftyat.kz/kk/qa/",
)

_LISTING_SEEDS: dict[str, tuple[str, ...]] = {
    "fatua": (),
    "muftyat": (
        "https://www.muftyat.kz/kk/",
        "https://www.muftyat.kz/kk/books/",
    ),
}


@dataclass
class IngestResult:
    url: str
    status: str
    document_id: int | None = None
    chunks: int = 0


def _site_from_url(url: str) -> str:
    host = (urlparse(url).netloc or "").lower()
    if "fatua.kz" in host:
        return "fatua"
    if "muftyat.kz" in host:
        return "muftyat"
    return host.replace(".", "_")[:32] or "unknown"


def fetch_url(url: str, *, timeout: float | None = None) -> str:
    to = timeout if timeout is not None else islamic_kb_fetch_timeout()
    headers = {
        "User-Agent": "RAQAT-IslamicKB/1.0 (+https://raqat.ai; respectful indexer)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "kk,ru;q=0.8",
    }
    with httpx.Client(timeout=to, follow_redirects=True, headers=headers) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.text


def parse_sitemap_urls(xml_text: str, base_url: str, *, max_urls: int) -> list[str]:
    urls: list[str] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return urls
    tag = root.tag.lower()
    if tag.endswith("sitemapindex"):
        for loc in root.findall(".//sm:loc", _NS)[:20]:
            child = (loc.text or "").strip()
            if not child:
                continue
            try:
                sub = fetch_url(child)
                urls.extend(parse_sitemap_urls(sub, child, max_urls=max_urls - len(urls)))
            except Exception as exc:
                logger.warning("sitemap child %s: %s", child, exc)
            if len(urls) >= max_urls:
                break
        return urls[:max_urls]
    for loc in root.findall(".//sm:loc", _NS):
        u = (loc.text or "").strip()
        if u:
            urls.append(urljoin(base_url, u))
        if len(urls) >= max_urls:
            break
    if not urls:
        for loc in root.findall(".//{*}loc"):
            u = (loc.text or "").strip()
            if u:
                urls.append(urljoin(base_url, u))
            if len(urls) >= max_urls:
                break
    return urls[:max_urls]


def _extract_article_links(
    html: str, page_url: str, site: str, *, max_urls: int
) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for m in _HREF.finditer(html or ""):
        href = html_lib.unescape((m.group(1) or "").strip())
        if not href or href.startswith(("mailto:", "javascript:", "tel:")):
            continue
        full = urljoin(page_url, href)
        if full in seen:
            continue
        if not _looks_like_article(full, site):
            continue
        seen.add(full)
        found.append(full)
        if len(found) >= max_urls:
            break
    return found


def _max_listing_page(html: str) -> int:
    nums = [int(x) for x in _PAGE_NUM.findall(html or "")]
    return max(nums) if nums else 1


def _fatua_listing_page_url(base: str, page: int) -> str:
    base = base.rstrip("/")
    if page <= 1:
        return base
    return f"{base}?page={page}&category_id=0"


def _discover_fatua_paginated(*, max_urls: int) -> list[str]:
    page_cap = islamic_kb_max_listing_pages()
    out: list[str] = []
    seen: set[str] = set()
    for base in _FATUA_LISTING_BASES:
        if len(out) >= max_urls:
            break
        try:
            first_url = _fatua_listing_page_url(base, 1)
            first_html = fetch_url(first_url)
            last_page = min(_max_listing_page(first_html), page_cap)
        except Exception as exc:
            logger.warning("fatua listing base %s: %s", base, exc)
            continue
        for page_no in range(1, last_page + 1):
            if len(out) >= max_urls:
                break
            page_url = _fatua_listing_page_url(base, page_no)
            try:
                html = first_html if page_no == 1 else fetch_url(page_url)
                for u in _extract_article_links(
                    html, page_url, "fatua", max_urls=max_urls - len(out)
                ):
                    if u in seen:
                        continue
                    seen.add(u)
                    out.append(u)
            except Exception as exc:
                logger.warning("fatua listing %s: %s", page_url, exc)
    return out[:max_urls]


def _muftyat_listing_page_url(base: str, page: int) -> str:
    base = base.rstrip("/") + "/"
    if page <= 1:
        return base
    return f"{base}?page={page}"


def _discover_muftyat_paginated(*, max_urls: int) -> list[str]:
    page_cap = islamic_kb_max_listing_pages()
    out: list[str] = []
    seen: set[str] = set()
    for base in _MUFTYAT_LISTING_BASES:
        if len(out) >= max_urls:
            break
        empty_streak = 0
        for page_no in range(1, page_cap + 1):
            if len(out) >= max_urls:
                break
            page_url = _muftyat_listing_page_url(base, page_no)
            try:
                html = fetch_url(page_url)
            except Exception as exc:
                logger.warning("muftyat listing %s: %s", page_url, exc)
                break
            added = 0
            for u in _extract_article_links(
                html, page_url, "muftyat", max_urls=max_urls - len(out)
            ):
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


def _discover_muftyat_books(*, max_urls: int) -> list[str]:
    page_cap = islamic_kb_max_listing_pages()
    out: list[str] = []
    seen: set[str] = set()
    for page in range(1, page_cap + 1):
        if len(out) >= max_urls:
            break
        page_url = (
            "https://www.muftyat.kz/kk/books/?lang=all&expertise=1"
            if page == 1
            else f"https://www.muftyat.kz/kk/books/?page={page}&lang=all&expertise=1"
        )
        try:
            html = fetch_url(page_url)
        except Exception as exc:
            logger.warning("muftyat books %s: %s", page_url, exc)
            break
        for m in re.finditer(r'href="/kk/book/(\d+)/"', html or ""):
            u = f"https://www.muftyat.kz/kk/book/{m.group(1)}/"
            if u in seen:
                continue
            seen.add(u)
            out.append(u)
            if len(out) >= max_urls:
                break
        if page > 1 and 'class="textNewsP"' not in html and "/kk/book/" not in html:
            break
    return out[:max_urls]


def _discover_from_listings(site: str, *, max_urls: int) -> list[str]:
    if site == "fatua":
        return _discover_fatua_paginated(max_urls=max_urls)
    if site == "muftyat":
        out = _discover_muftyat_paginated(max_urls=max_urls)
        if len(out) >= max_urls:
            return out
        seen = set(out)
        seeds = _LISTING_SEEDS.get("muftyat", ())
        for page in seeds:
            if len(out) >= max_urls:
                break
            try:
                html = fetch_url(page)
                for u in _extract_article_links(
                    html, page, "muftyat", max_urls=max_urls - len(out)
                ):
                    if u in seen:
                        continue
                    seen.add(u)
                    out.append(u)
                    if len(out) >= max_urls:
                        break
            except Exception as exc:
                logger.warning("listing %s: %s", page, exc)
        return out[:max_urls]
    seeds = _LISTING_SEEDS.get(site, ())
    out: list[str] = []
    seen: set[str] = set()
    for page in seeds:
        if len(out) >= max_urls:
            break
        try:
            html = fetch_url(page)
            for u in _extract_article_links(
                html, page, site, max_urls=max_urls - len(out)
            ):
                if u in seen:
                    continue
                seen.add(u)
                out.append(u)
        except Exception as exc:
            logger.warning("listing %s: %s", page, exc)
    return out[:max_urls]


def discover_article_urls(site: str, *, max_urls: int) -> list[str]:
    if site == "fatua":
        bases = ("https://fatua.kz/sitemap.xml", "https://www.fatua.kz/sitemap.xml")
    elif site == "muftyat":
        # muftyat.kz/sitemap.xml серверде 500 — listing pagination арқылы табылады
        bases = ()
    else:
        return []
    out: list[str] = []
    for sm in bases:
        try:
            xml = fetch_url(sm)
            found = parse_sitemap_urls(xml, sm, max_urls=max_urls)
            out.extend(found)
        except Exception as exc:
            logger.warning("sitemap %s: %s", sm, exc)
        if len(out) >= max_urls:
            break
    dedup: list[str] = []
    seen: set[str] = set()
    for u in out:
        if u in seen:
            continue
        if not _looks_like_article(u, site):
            continue
        seen.add(u)
        dedup.append(u)
        if len(dedup) >= max_urls:
            break
    if len(dedup) < max_urls:
        for u in _discover_from_listings(site, max_urls=max_urls):
            if u in seen:
                continue
            seen.add(u)
            dedup.append(u)
            if len(dedup) >= max_urls:
                break
    if site == "muftyat" and islamic_kb_official_license() and len(dedup) < max_urls:
        for u in _discover_muftyat_books(max_urls=max_urls - len(dedup)):
            if u in seen:
                continue
            seen.add(u)
            dedup.append(u)
            if len(dedup) >= max_urls:
                break
    return dedup


def _looks_like_article(url: str, site: str) -> bool:
    p = urlparse(url)
    host = (p.netloc or "").lower()
    path = (p.path or "").lower()
    if site == "fatua" and "fatua.kz" not in host:
        return False
    if site == "muftyat" and "muftyat.kz" not in host:
        return False
    if site == "fatua":
        if re.search(r"/kk/books/read/", path):
            return True
        return bool(re.search(r"/kk/(qa|fatwas|media)/read/\d{4}-\d{2}-\d{2}/", path))
    if site == "muftyat":
        if re.search(r"/kk/book/\d+/?", path):
            return True
        return bool(
            re.search(
                r"/kk/(?:articles|news)/[a-z0-9_-]+/\d{4}-\d{2}-\d{2}/\d+",
                path,
            )
            or re.search(
                r"/kk/qa/[a-z0-9_-]+/\d{4}-\d{2}-\d{2}/\d+",
                path,
            )
        )
    return len(path.strip("/")) >= 3


def ingest_url(
    url: str,
    *,
    source_site: str | None = None,
    title_override: str | None = None,
    category: str | None = None,
    author: str | None = None,
) -> IngestResult:
    site = (source_site or _site_from_url(url)).lower()
    try:
        html = fetch_url(url)
    except Exception as exc:
        logger.warning("fetch %s: %s", url, exc)
        return IngestResult(url=url, status=f"fetch_error:{exc}")

    main_html = extract_main_html(html)
    body = html_to_plain_text(main_html)
    if len(body) < 60:
        body = html_to_plain_text(html)
    if len(body) < 40:
        return IngestResult(url=url, status="too_short")

    title = (title_override or extract_title(html) or url).strip()[:500]
    image_url = extract_article_image_url(html, url)
    h = content_hash(body)
    chunks = chunk_plain_text(body, max_chars=islamic_kb_chunk_chars())
    if not chunks:
        return IngestResult(url=url, status="no_chunks")

    license = islamic_kb_license_note(site)

    with connect() as conn:
        row = conn.execute(
            "SELECT id, content_hash FROM islamic_kb_documents WHERE canonical_url = ?",
            (url,),
        ).fetchone()
        if row and str(row["content_hash"]) == h:
            return IngestResult(
                url=url,
                status="unchanged",
                document_id=int(row["id"]),
            )

        now = utc_now_iso()
        if row:
            doc_id = int(row["id"])
            conn.execute(
                """
                UPDATE islamic_kb_documents
                SET title=?, category=?, author=?, content_hash=?, raw_fetched_at=?, image_url=?, license_note=?
                WHERE id=?
                """,
                (title, category, author, h, now, image_url, license, doc_id),
            )
            old_chunks = conn.execute(
                "SELECT id FROM islamic_kb_chunks WHERE document_id = ?", (doc_id,)
            ).fetchall()
            for oc in old_chunks:
                conn.execute(
                    "DELETE FROM islamic_kb_fts WHERE chunk_id = ?", (int(oc["id"]),)
                )
            conn.execute("DELETE FROM islamic_kb_chunks WHERE document_id = ?", (doc_id,))
        else:
            cur = conn.execute(
                """
                INSERT INTO islamic_kb_documents
                  (source_site, canonical_url, title, published_at, category, author, content_hash, raw_fetched_at, image_url, license_note)
                VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)
                """,
                (site, url, title, category, author, h, now, image_url, license),
            )
            doc_id = int(cur.lastrowid)

        n_chunks = 0
        for i, ch in enumerate(chunks):
            cur = conn.execute(
                """
                INSERT INTO islamic_kb_chunks (document_id, chunk_index, text_plain)
                VALUES (?, ?, ?)
                """,
                (doc_id, i, ch),
            )
            chunk_id = int(cur.lastrowid)
            conn.execute(
                """
                INSERT INTO islamic_kb_fts
                  (title, text_plain, source_site, canonical_url, document_id, chunk_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (title, ch, site, url, doc_id, chunk_id),
            )
            n_chunks += 1

    return IngestResult(
        url=url,
        status="indexed",
        document_id=doc_id,
        chunks=n_chunks,
    )


def sync_site(site: str, *, max_urls: int, seed_urls: tuple[str, ...] = ()) -> dict:
    urls = list(seed_urls)
    if not urls:
        urls = discover_article_urls(site, max_urls=max_urls)
    stats = {"site": site, "attempted": 0, "indexed": 0, "unchanged": 0, "errors": 0}
    delay = islamic_kb_fetch_delay_sec()
    for i, u in enumerate(urls[:max_urls]):
        if i > 0 and delay > 0:
            time.sleep(delay)
        stats["attempted"] += 1
        res = ingest_url(u, source_site=site)
        if res.status == "indexed":
            stats["indexed"] += 1
        elif res.status == "unchanged":
            stats["unchanged"] += 1
        else:
            stats["errors"] += 1
    return stats
