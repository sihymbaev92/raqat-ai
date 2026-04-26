"""Shared parsing for asyldin.kz id=29 (one page per surah)."""
from __future__ import annotations

import re
import urllib.error
import urllib.request
import time

ARTICLE_RE = re.compile(r'<div itemprop="articleBody">(.*?)</div>', re.IGNORECASE | re.DOTALL)
BR_SPLIT = re.compile(r"<\s*br\s*/?>", re.IGNORECASE)
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
BASE = "https://asyldin.kz/library/readBook/id/29/page"
MARKER_RE = re.compile(r"\s*\((\d+)\)\s*")


def clean_inner(ln: str) -> str:
    t = re.sub(r"<\s*p[^>]*>", " ", ln, flags=re.I)
    t = re.sub(r"<\s*/\s*p\s*>", " ", t, flags=re.I)
    t = re.sub(r"<\s*br\s*/?>", " ", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def fetch_html(surah: int) -> str:
    url = f"{BASE}/{surah}.html"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "kk,en;q=0.9"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read().decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError, OSError):
            if attempt == 2:
                raise
            time.sleep(2.0 * (attempt + 1))
    raise RuntimeError("unreachable")


def parse_article_to_by_n(article_raw: str) -> tuple[str | None, dict[int, str]]:
    """
    - Merge <br> lines: continuation = line not starting with (d+).
    - bismillah = first such line; drop from merge list for (n) counting but use as pre for s>1 if present.
    Returns: (bismillah_pre_or_none, {ayah_num: text_after_marker, duplicates resolved by max length}).
    """
    cl = [clean_inner(x) for x in BR_SPLIT.split(article_raw) if clean_inner(x)]
    merged: list[str] = []
    for t in cl:
        if re.match(r"^\s*\(\d+\)", t):
            merged.append(t)
        else:
            if not merged:
                merged.append(t)
            else:
                merged[-1] = merged[-1] + " " + t

    pre: str | None = None
    to_split = merged
    if merged and not re.match(r"^\s*\(\d+\)", merged[0].strip()):
        pre = merged[0].strip()
        to_split = merged[1:]

    by_n: dict[int, str] = {}
    for t in to_split:
        parts = MARKER_RE.split(t)
        if len(parts) < 2:
            continue
        j = 1
        while j < len(parts):
            n = int(parts[j])
            body = (parts[j + 1] if j + 1 < len(parts) else "").strip()
            j += 2
            if n in by_n and by_n[n] != body and len(body) > len(by_n.get(n, "")):
                # prefer longer (duplicate (n) on same page, out-of-order blocks)
                pass
            if n not in by_n or len(body) > len(by_n.get(n, "")):
                by_n[n] = body
    return pre, by_n


def fetch_surah_by_n(surah: int) -> tuple[str | None, dict[int, str]]:
    h = fetch_html(surah)
    m = ARTICLE_RE.search(h)
    if not m:
        raise ValueError("no articleBody")
    return parse_article_to_by_n(m.group(1))
