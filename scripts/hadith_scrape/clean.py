# -*- coding: utf-8 -*-
from __future__ import annotations

import html as html_lib
import re

_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")

# Жарнама, пікір, навигация — қысқа whitelist емес, blacklist
_JUNK_LINE = re.compile(
    r"(?i)^("
    r"play|pause|previous|next|stop|mute|unmute|max volume|shuffle|repeat|"
    r"flash player|cookie|javascript|реклама|banner|"
    r"пікір|comment|facebook|twitter|instagram|telegram|whatsapp|"
    r"бөлісу|share|жазыл|subscribe|"
    r"таң|күн|besіn|бесін|екінті|ақшам|құптан|"
    r"қаз\s*рус|qaz|"
    r"\d+\s*/\s*\d+"
    r")$",
)

_NAV_ONLY = re.compile(
    r"(?i)(намаз|quran|meshit|kitaphana|басты бет|jańalyqtar|maqalalar|suraq-jaýap)",
)
_CITY_LINE = re.compile(
    r"(?i)^[\w\s«»\-–—\.]+(?:қаласы|ауылы|к\.о\.|облысы|ауданы)$",
)


def html_to_plain(html: str) -> str:
    if not html:
        return ""
    t = html
    for pat in (
        r"(?is)<script[^>]*>.*?</script>",
        r"(?is)<style[^>]*>.*?</style>",
        r"(?is)<noscript[^>]*>.*?</noscript>",
        r"(?is)<nav[^>]*>.*?</nav>",
        r"(?is)<footer[^>]*>.*?</footer>",
        r"(?is)<header[^>]*>.*?</header>",
    ):
        t = re.sub(pat, " ", t)
    t = _TAG.sub("\n", t)
    t = html_lib.unescape(t)
    t = t.replace("-->", " ")
    t = t.replace("\r\n", "\n").replace("\r", "\n")
    lines: list[str] = []
    for raw in t.split("\n"):
        line = _WS.sub(" ", raw).strip()
        if not line or len(line) < 2:
            continue
        if _JUNK_LINE.match(line):
            continue
        if len(line) < 30 and _NAV_ONLY.search(line):
            continue
        if _CITY_LINE.match(line):
            continue
        lines.append(line)
    out = "\n".join(lines)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip()


def extract_main_html(html: str) -> str:
    if not html:
        return ""
    for pat in (
        r'(?is)<div[^>]+class=["\']post_content["\'][^>]*>(.*?)</div>',
        r'(?is)<div[^>]+class=["\'][^"\']*article-page__content[^"\']*["\'][^>]*>(.*?)</div>',
        r'(?is)<div[^>]+class=["\'][^"\']*content in_page[^"\']*["\'][^>]*>(.*?)</div>',
        r"(?is)<article[^>]*>(.*?)</article>",
        r'(?is)<div[^>]+class=["\'][^"\']*(?:entry-content|article-body|textNews|book-content|content-text)[^"\']*["\'][^>]*>(.*?)</div>',
        r"(?is)<main[^>]*>(.*?)</main>",
    ):
        m = re.search(pat, html)
        if m and len(m.group(1)) > 120:
            return m.group(1)
    return html
