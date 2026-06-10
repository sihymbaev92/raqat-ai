# -*- coding: utf-8 -*-
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

from hadith_scrape.clean import extract_main_html, html_to_plain

_HADITH_SPLIT = re.compile(
    r"(?im)"
    r"(?:"
    r"^\s*(?:#{1,4}\s*)?(?:\d+[\.)]\s*)?хадис(?:\s*[\(:]|\s*$)|"
    r"^\s*(?:\d+[\.)]\s*)?(?:хадис|hadith)\s*[:：]|"
    r"^\s*арабша\s*мәтіні\s*[:：]"
    r")"
)

_NARRATOR = re.compile(
    r"(?i)(?:"
    r"риуаят\s*(?:етті|еткен)?\s*[:—-]?\s*|"
    r"рауи\s*[:—-]\s*|"
    r"жеткізген\s*[:—-]\s*|"
    r"(?:имам\s+)?(?:әл-)?(?:бухари|муслим|тирмизи|абу\s*дәуд|нәсаи|мәжа)"
    r")"
)

_ARABIC_BLOCK = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]{12,}")

_HADITH_PAGE_HINT = re.compile(
    r"(?i)"
    r"хадис|риуаят|"
    r"пайғамбар|"
    r"бухари|муслим|muslim|bukhari|"
    r"термизи|tirmidhi|"
    r"abu\s*dawud|әbu\s*дәуд|"
    r"насаи|nasai|"
    r"ibn\s*majah|мәжа"
)


@dataclass(frozen=True)
class ScrapedHadithRow:
    hadith_id: str
    hadith_text: str
    narrator: str
    source_url: str
    source_site: str
    collection_hint: str = ""
    page_title: str = ""


def content_hash(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()[:16]


def guess_narrator(block: str) -> str:
    m = _NARRATOR.search(block)
    if not m:
        return ""
    frag = block[m.start() : m.start() + 120]
    frag = re.sub(r"\s+", " ", frag).strip()
    return frag[:200]


def guess_collection(block: str, page_title: str = "") -> str:
    blob = f"{page_title}\n{block}".lower()
    if "бухари" in blob or "bukhari" in blob:
        return "Sahih al-Bukhari"
    if "муслим" in blob or "muslim" in blob:
        return "Sahih Muslim"
    if "рияд" in blob or "riyad" in blob:
        return "Riyad as-Salihin"
    return ""


def _is_nav_junk(block: str) -> bool:
    if _ARABIC_BLOCK.search(block):
        return False
    low = block.lower()
    junk_markers = (
        "follow @",
        "rss ақпарат",
        "категория:",
        "мой мир",
        "flash player",
        "javascript",
    )
    if any(m in low for m in junk_markers):
        return True
    if len(block) > 400 and block.count("\n") > 8:
        return True
    return False


def split_hadith_blocks(plain: str, *, source_site: str = "") -> list[str]:
    if not plain.strip():
        return []
    parts = _HADITH_SPLIT.split(plain)
    blocks: list[str] = []
    for i, part in enumerate(parts):
        chunk = part.strip()
        if not chunk:
            continue
        if i == 0 and not re.search(r"(?i)хадис|арабша\s*мәтін", chunk[:120]):
            # Кіріспе — егер араб/мағына бар болса, бір блок ретінде
            if _ARABIC_BLOCK.search(chunk) and len(chunk) > 80:
                blocks.append(chunk)
            continue
        if len(chunk) < 40:
            continue
        if _is_nav_junk(chunk):
            continue
        blocks.append(chunk)
    if not blocks:
        body = plain.strip()
        if len(body) < 80:
            return blocks
        if _ARABIC_BLOCK.search(body) or re.search(r"(?i)хадис", body):
            blocks.append(body)
        elif source_site in ("fatua", "muftyat") and _HADITH_PAGE_HINT.search(body):
            blocks.append(body)
    return blocks


def extract_from_html(
    html: str,
    *,
    source_url: str,
    source_site: str,
    page_title: str = "",
    id_prefix: str = "",
) -> list[ScrapedHadithRow]:
    main = extract_main_html(html)
    plain = html_to_plain(main)
    if not page_title:
        m = re.search(r"(?is)<title[^>]*>(.*?)</title>", html or "")
        if m:
            page_title = html_to_plain(m.group(1))[:300]

    blocks = split_hadith_blocks(plain, source_site=source_site)
    rows: list[ScrapedHadithRow] = []
    for idx, block in enumerate(blocks, start=1):
        hid = f"{id_prefix}{source_site}-{content_hash(source_url + block)[:8]}-{idx}"
        rows.append(
            ScrapedHadithRow(
                hadith_id=hid,
                hadith_text=block.strip(),
                narrator=guess_narrator(block),
                source_url=f"{source_url}#h{idx}",
                source_site=source_site,
                collection_hint=guess_collection(block, page_title),
                page_title=page_title,
            )
        )
    return rows
