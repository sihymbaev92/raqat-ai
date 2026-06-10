# -*- coding: utf-8 -*-
"""fatua.kz/kk + muftyat.kz/kk басты бет жаңалықтары (суретпен)."""
from __future__ import annotations

import html as html_lib
import re
from dataclasses import dataclass
from urllib.parse import urljoin

from islamic_kb.ingest import fetch_url

FATUA_HOME = "https://fatua.kz/kk/"
MUFTYAT_HOME = "https://www.muftyat.kz/kk/"
FATUA_ORIGIN = "https://fatua.kz"
MUFTYAT_ORIGIN = "https://www.muftyat.kz"

_SITE_LABEL = {"fatua": "Fatua.kz", "muftyat": "Muftyat.kz"}


@dataclass
class HomeFeedItem:
    site: str
    source_label: str
    title: str
    subtitle: str
    url: str
    image_url: str

    def as_dict(self) -> dict:
        return {
            "site": self.site,
            "source_label": self.source_label,
            "title": self.title,
            "subtitle": self.subtitle,
            "url": self.url,
            "image_url": self.image_url,
        }


def _decode_html(text: str) -> str:
    t = html_lib.unescape(text or "")
    return re.sub(r"\s+", " ", t).strip()


def _abs_url(origin: str, href: str) -> str:
    h = (href or "").strip()
    if not h:
        return origin
    if h.startswith(("http://", "https://")):
        return h
    if h.startswith("//"):
        return f"https:{h}"
    return urljoin(f"{origin.rstrip('/')}/", h)


def _upgrade_remote_feed_image_url(url: str) -> str:
    trimmed = (url or "").strip()
    if not trimmed:
        return trimmed
    if "imgs.muftyat.kz" in trimmed.lower():
        return re.sub(r"/orxl/", "/orxxl/", trimmed, flags=re.I)
    return trimmed


def _usable_image(url: str) -> bool:
    low = (url or "").lower()
    if not low or low.startswith("data:"):
        return False
    if low.endswith(".svg"):
        return False
    if "logo" in low or "флаш_баннер" in low or "flash" in low:
        return False
    return "/media/" in low or "imgs.muftyat.kz" in low or "/upload/" in low


def parse_fatua_home_html(html: str, *, limit: int = 8) -> list[HomeFeedItem]:
    out: list[HomeFeedItem] = []
    seen: set[str] = set()
    for block in re.findall(r'<article class="article">[\s\S]*?</article>', html or "", re.I):
        if len(out) >= limit:
            break
        img_m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', block, re.I)
        href_m = re.search(
            r'<div class="article__title">\s*<a href=["\']([^"\']+)["\']', block, re.I
        )
        title_m = re.search(
            r'<div class="article__title">\s*<a[^>]*>([\s\S]*?)</a>', block, re.I
        )
        cat_m = re.search(r'<div class="article__subtitle">\s*([\s\S]*?)\s*</div>', block, re.I)
        date_m = re.search(r'<div class="article__date">\s*([\s\S]*?)\s*</div>', block, re.I)
        alt_m = re.search(r'<img[^>]+alt=["\']([^"\']*)["\']', block, re.I)

        image_url = _upgrade_remote_feed_image_url(
            _abs_url(FATUA_ORIGIN, img_m.group(1)) if img_m else ""
        )
        url = _abs_url(FATUA_ORIGIN, href_m.group(1)) if href_m else ""
        title = _decode_html(title_m.group(1) if title_m else "") or _decode_html(
            alt_m.group(1) if alt_m else ""
        )
        if not url or not title or not _usable_image(image_url):
            continue
        parts = [
            _decode_html(cat_m.group(1) if cat_m else ""),
            _decode_html(date_m.group(1) if date_m else ""),
        ]
        subtitle = " · ".join(p for p in parts if p)
        key = url.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(
            HomeFeedItem(
                site="fatua",
                source_label=_SITE_LABEL["fatua"],
                title=title,
                subtitle=subtitle,
                url=url,
                image_url=image_url,
            )
        )
    return out


def parse_muftyat_home_html(html: str, *, limit: int = 8) -> list[HomeFeedItem]:
    out: list[HomeFeedItem] = []
    seen: set[str] = set()

    slider_re = re.compile(
        r'<div class="block_for">\s*<a href=["\']([^"\']+)["\']>\s*'
        r'<img src=["\']([^"\']+)["\'][^>]*(?:alt=["\']([^"\']*)["\'])?[^>]*>'
        r"[\s\S]*?<p>([\s\S]*?)</p>",
        re.I,
    )
    for m in slider_re.finditer(html or ""):
        if len(out) >= limit:
            break
        url = _abs_url(MUFTYAT_ORIGIN, m.group(1))
        image_url = _upgrade_remote_feed_image_url(_abs_url(MUFTYAT_ORIGIN, m.group(2)))
        title = _decode_html(m.group(4) or m.group(3) or "")
        if not url or not title or not _usable_image(image_url):
            continue
        key = url.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(
            HomeFeedItem(
                site="muftyat",
                source_label=_SITE_LABEL["muftyat"],
                title=title,
                subtitle="",
                url=url,
                image_url=image_url,
            )
        )

    jeg_re = re.compile(
        r'<article class="jeg_post[\s\S]*?<a href=["\']([^"\']+)["\']>[\s\S]*?'
        r'<img src=["\']([^"\']+)["\'][^>]*alt=["\']([^"\']*)["\'][\s\S]*?'
        r'<h3 class="jeg_post_title">\s*<a[^>]*>([\s\S]*?)</a>',
        re.I,
    )
    for m in jeg_re.finditer(html or ""):
        if len(out) >= limit:
            break
        url = _abs_url(MUFTYAT_ORIGIN, m.group(1))
        image_url = _upgrade_remote_feed_image_url(_abs_url(MUFTYAT_ORIGIN, m.group(2)))
        title = _decode_html(m.group(4) or m.group(3) or "")
        if not url or not title or not _usable_image(image_url):
            continue
        key = url.lower()
        if key in seen:
            continue
        seen.add(key)
        cat_m = re.search(r'class="category-[^"]*">([^<]+)<', m.group(0), re.I)
        subtitle = _decode_html(cat_m.group(1) if cat_m else "")
        out.append(
            HomeFeedItem(
                site="muftyat",
                source_label=_SITE_LABEL["muftyat"],
                title=title,
                subtitle=subtitle,
                url=url,
                image_url=image_url,
            )
        )

    return out[:limit]


def interleave_home_feeds(
    fatua: list[HomeFeedItem], muftyat: list[HomeFeedItem]
) -> list[HomeFeedItem]:
    out: list[HomeFeedItem] = []
    for i in range(max(len(fatua), len(muftyat))):
        if i < len(fatua):
            out.append(fatua[i])
        if i < len(muftyat):
            out.append(muftyat[i])
    return out


def fetch_official_home_feed(*, limit_per_site: int = 6) -> list[HomeFeedItem]:
    fatua_html = ""
    muftyat_html = ""
    try:
        fatua_html = fetch_url(FATUA_HOME)
    except Exception:
        fatua_html = ""
    try:
        muftyat_html = fetch_url(MUFTYAT_HOME)
    except Exception:
        muftyat_html = ""

    fatua = parse_fatua_home_html(fatua_html, limit=limit_per_site) if fatua_html else []
    muftyat = (
        parse_muftyat_home_html(muftyat_html, limit=limit_per_site) if muftyat_html else []
    )
    return interleave_home_feeds(fatua, muftyat)
