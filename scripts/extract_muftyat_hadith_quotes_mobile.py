#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extract hadith-like quotes from Fatua.kz/Muftyat.kz article bundle.

Input is the broad article/patua bundle. Output is a smaller mobile bundle where
each item is a hadith/riwayat candidate with the original source URL preserved.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_IN = ROOT / "mobile" / "assets" / "bundled" / "scraped-hadith-muftyat.json"
DEFAULT_OUT = ROOT / "mobile" / "assets" / "bundled" / "extracted-hadith-muftyat.json"

PROPHET_HINT = re.compile(r"(?i)(пайғамбар|алла елшісі|расул|с\.ғ\.с|с\.а\.с|ﷺ)")
SOURCE_HINT = re.compile(
    r"(?i)(бұхари|бухари|муслим|тирмизи|тірмизи|әбу дәуіт|нәсәи|насәи|ибн мәжа|ахмад|табарани|"
    r"байһақи|сахих|муатта|риуаят еткен|риуаят етті|хадистің дәрежесі)"
)
QURAN_HINT = re.compile(r"(?i)(құран|аят|сүре|алла тағала.*деді|алла тағала.*былай дейді|бақара|ниса|ағраф)")
QUOTE_RE = re.compile(r"«([^»]{18,900})»")
ARABIC_RE = re.compile(r"[\u0600-\u06FF]")
WHITESPACE_RE = re.compile(r"\s+")
BAD_QUOTE = re.compile(
    r"(?i)(фатхул|имам ағзам|мухаддис|тәпсір|сүресі|аят|құран|бұл хадис|хадисті|"
    r"риуаяттың|дәлел|ғалым|кітабында|том|бет|№)"
)

SOURCE_LABELS = (
    ("bukhari", re.compile(r"(?i)\b(бұхари|бухари|sahih al-bukhari)\b")),
    ("muslim", re.compile(r"(?i)\b(муслим|sahih muslim)\b")),
    ("tirmidhi", re.compile(r"(?i)\b(тирмизи|тірмизи|tirmidhi)\b")),
    ("abu-dawud", re.compile(r"(?i)\b(әбу дәуіт|abu dawud)\b")),
    ("nasai", re.compile(r"(?i)\b(нәсәи|насәи|nasai|nasa'i)\b")),
    ("ibn-majah", re.compile(r"(?i)\b(ибн мәжа|ibn majah)\b")),
    ("ahmad", re.compile(r"(?i)\b(ахмад|ahmad)\b")),
    ("tabarani", re.compile(r"(?i)\b(табарани|tabarani)\b")),
)


def compact(text: str) -> str:
    return WHITESPACE_RE.sub(" ", (text or "").strip())


def title_from_quote(text: str) -> str:
    t = compact(text).strip(".,;:!? ")
    words = t.split()
    title = " ".join(words[:12])
    if len(words) > 12:
        title += "..."
    return title[:140] or "Хадис үзіндісі"


def arabic_count(text: str) -> int:
    return len(ARABIC_RE.findall(text or ""))


def extract_arabic_text(context: str) -> str:
    segments = re.findall(r"[\u0600-\u06FF][\u0600-\u06FF\s،؛؟:؛\.\(\)»«ًٌٍَُِّْـ0-9]+", context or "")
    cleaned = [compact(s).strip(" .،؛:") for s in segments if arabic_count(s) >= 18]
    if not cleaned:
        return ""
    return max(cleaned, key=lambda s: (arabic_count(s), len(s)))[:1200]


def extract_wide_quotes(window: str) -> list[str]:
    out: list[str] = []
    for trigger in re.finditer(r"(?i)(былай деген|былай дейді|деді|деп жауап береді|деп айт)", window):
        start_search = trigger.start()
        open_idx = window.find("«", start_search, min(len(window), trigger.end() + 260))
        if open_idx < 0:
            continue
        close_positions = [
            m.start()
            for m in re.finditer("»", window[open_idx + 1 : min(len(window), open_idx + 950)])
        ]
        candidates: list[str] = []
        for rel in close_positions:
            close_idx = open_idx + 1 + rel
            quote = compact(window[open_idx + 1 : close_idx])
            if 24 <= len(quote) <= 850:
                candidates.append(quote)
        if candidates:
            out.append(max(candidates, key=len))
    return out


def collection_hint(text: str, fallback: str = "") -> str:
    found: list[str] = []
    for label, pattern in SOURCE_LABELS:
        if pattern.search(text):
            pretty = {
                "bukhari": "Sahih al-Bukhari",
                "muslim": "Sahih Muslim",
                "tirmidhi": "Jami at-Tirmidhi",
                "abu-dawud": "Sunan Abi Dawud",
                "nasai": "Sunan an-Nasa'i",
                "ibn-majah": "Sunan Ibn Majah",
                "ahmad": "Musnad Ahmad",
                "tabarani": "At-Tabarani",
            }[label]
            if pretty not in found:
                found.append(pretty)
    if found:
        return " / ".join(found)
    return compact(fallback)


def looks_like_hadith_window(window: str) -> bool:
    if not PROPHET_HINT.search(window):
        return False
    return bool(SOURCE_HINT.search(window) or "хадис" in window.lower() or "риуаят" in window.lower())


def looks_like_hadith_quote(quote: str, local_context: str) -> bool:
    q = compact(quote)
    if len(q) < 24 or len(q) > 850:
        return False
    if q.startswith(("(", "[", ".", ",")):
        return False
    if BAD_QUOTE.search(q):
        return False
    if QURAN_HINT.search(q):
        return False
    if len(q.split()) < 4:
        return False
    before = local_context[: max(0, local_context.find(q))]
    after = local_context[local_context.find(q) + len(q) :] if q in local_context else local_context
    has_prophet_before = bool(PROPHET_HINT.search(before[-450:]))
    has_source_near = bool(SOURCE_HINT.search(local_context) or re.search(r"(?i)риуаят", local_context))
    has_said_near = bool(re.search(r"(?i)(деді|деген|былай)", before[-180:] + after[:180]))
    return has_prophet_before and has_source_near and has_said_near


def paragraphs(text: str) -> list[str]:
    parts = re.split(r"\n\s*\n+", text or "")
    return [compact(p) for p in parts if compact(p)]


def extract_candidates(item: dict) -> list[dict]:
    text = item.get("text") or ""
    paras = paragraphs(text)
    out: list[dict] = []
    seen_texts: set[str] = set()

    for idx, _para in enumerate(paras):
        window = compact(" ".join(paras[max(0, idx - 1) : min(len(paras), idx + 2)]))
        if not looks_like_hadith_window(window):
            continue

        useful_quotes = []
        for q in extract_wide_quotes(window):
            if looks_like_hadith_quote(q, window):
                useful_quotes.append(q)
        for m in QUOTE_RE.finditer(window):
            q = compact(m.group(1))
            start = max(0, m.start() - 450)
            end = min(len(window), m.end() + 300)
            local = window[start:end]
            if looks_like_hadith_quote(q, local):
                useful_quotes.append(q)

        if useful_quotes:
            unique_quotes = sorted(set(useful_quotes), key=len, reverse=True)
            for quote in unique_quotes[:2]:
                key = quote.lower()
                if key in seen_texts:
                    continue
                seen_texts.add(key)
                out.append(
                    {
                        "quote": quote,
                        "arabicText": extract_arabic_text(window),
                        "context": window,
                        "title": title_from_quote(quote),
                        "collectionHint": collection_hint(window, item.get("collectionHint") or ""),
                    }
                )

    return out


def stable_id(source_id: str, quote: str, seq: int) -> str:
    h = hashlib.sha1(f"{source_id}\n{quote}".encode("utf-8")).hexdigest()[:10]
    return f"extracted-{source_id}-{seq}-{h}"


def build_bundle(in_path: Path, out_path: Path) -> dict:
    source = json.loads(in_path.read_text(encoding="utf-8"))
    extracted: list[dict] = []

    for item in source.get("items", []):
        candidates = extract_candidates(item)
        for seq, cand in enumerate(candidates, start=1):
            text = cand["quote"]
            context = cand["context"]
            extracted.append(
                {
                    "id": stable_id(item.get("id", "row"), text, seq),
                    "sourceItemId": item.get("id", ""),
                    "title": cand["title"],
                    "text": text,
                    "arabicText": cand.get("arabicText", ""),
                    "meaningKk": text,
                    "narrator": "",
                    "collectionHint": cand["collectionHint"],
                    "sourceUrl": item.get("sourceUrl", ""),
                    "sourceSite": item.get("sourceSite", ""),
                    "sourceTitle": item.get("title", ""),
                    "sourceContext": context[:1400],
                    "scrapedAt": item.get("scrapedAt", ""),
                }
            )

    # Drop fragments when a fuller quote from the same source already contains them.
    fuller_quotes: list[dict] = []
    for item in sorted(extracted, key=lambda x: len(compact(x["text"])), reverse=True):
        text_key = compact(item["text"]).lower()
        is_fragment = any(
            item.get("sourceItemId") == kept.get("sourceItemId")
            and text_key in compact(kept["text"]).lower()
            and len(text_key) < len(compact(kept["text"]).lower()) * 0.75
            for kept in fuller_quotes
        )
        if not is_fragment:
            fuller_quotes.append(item)

    # Deduplicate across articles by normalized quote text while preserving earliest source.
    best: dict[str, dict] = {}
    for item in fuller_quotes:
        key = compact(item["text"]).lower()
        prev = best.get(key)
        if prev is None or len(item.get("collectionHint") or "") > len(prev.get("collectionHint") or ""):
            best[key] = item

    items = sorted(best.values(), key=lambda x: (x.get("sourceSite") or "", x["title"].lower()))
    counts = {
        "muftyat": sum(1 for x in items if x.get("sourceSite") == "muftyat"),
        "fatua": sum(1 for x in items if x.get("sourceSite") == "fatua"),
    }
    bundle = {
        "version": 1,
        "sourceOrg": source.get("sourceOrg", "Fatua.kz + Muftyat.kz"),
        "licenseNote": source.get("licenseNote", ""),
        "itemCount": len(items),
        "countsBySite": counts,
        "items": items,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "sourceItems": len(source.get("items", [])),
        "extracted": len(items),
        "muftyat": counts["muftyat"],
        "fatua": counts["fatua"],
        "out": str(out_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="in_path", default=str(DEFAULT_IN))
    parser.add_argument("--out", dest="out_path", default=str(DEFAULT_OUT))
    args = parser.parse_args()
    stats = build_bundle(Path(args.in_path), Path(args.out_path))
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
