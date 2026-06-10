#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""scraped_hadith.sqlite3 → mobile/assets/bundled/scraped-hadith-muftyat.json"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "data" / "hadith_scrape.sqlite3"
DEFAULT_OUT = ROOT / "mobile" / "assets" / "bundled" / "scraped-hadith-muftyat.json"

KK = re.compile(r"[а-яёәіңғүұқөһ]", re.I)
GARBAGE = re.compile(r"[\u0100-\u024F\u0300-\u036F]")
CITY_LINE = re.compile(
    r"(?i)^[\w\s«»\-–—\.]+(?:қаласы|ауылы|к\.о\.|облысы|ауданы)$"
)
JUNK_MARKERS = (
    "follow @",
    "flash plugin",
    "toggle navigation",
    "update required",
    "кесте",
    "барлығы",
    "жаңалықтар",
    "суреттер",
    "бейне",
    "мақалалар",
    "аудио",
    "muftyat.kz",
    "info@muftyat.kz",
    "fatua.kz",
)


def _title_from_page(page_title: str, *, site: str) -> str:
    t = (page_title or "").strip()
    if not t:
        return "Fatua.kz" if site == "fatua" else "Muftyat.kz"
    first = t.split("\n")[0].strip()
    first = re.sub(r"\s*-\s*Қазақстан.*$", "", first).strip()
    first = re.sub(r"\s*-\s*Fatua\.kz.*$", "", first, flags=re.I).strip()
    first = re.sub(r"\s*-\s*Muftyat\.kz.*$", "", first, flags=re.I).strip()
    return first[:200] or ("Fatua.kz" if site == "fatua" else "Muftyat.kz")


def _clean_text(raw: str) -> str:
    lines: list[str] = []
    for line in (raw or "").replace("\r\n", "\n").split("\n"):
        t = line.strip()
        if not t or len(t) < 2:
            continue
        low = t.lower()
        if CITY_LINE.match(t):
            continue
        if any(m in low for m in JUNK_MARKERS):
            continue
        if len(GARBAGE.findall(t)) >= 4 and len(KK.findall(t)) < 8:
            continue
        lines.append(t)
    text = "\n\n".join(lines)
    text = re.sub(r"([а-яёәіңғүұқөһ])-\n([а-яёәіңғүұқөһ])", r"\1\2", text, flags=re.I)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def _is_good_muftyat_row(row: dict, text: str) -> bool:
    url = (row.get("source_url") or "").split("#")[0]
    if "/book/" in url:
        return False
    if not re.search(r"/kk/(?:articles|news|qa)/", url):
        return False
    if len(text) < 100 or len(text) > 8000:
        return False
    if len(KK.findall(text)) < 60:
        return False
    if text.count(" қаласы") > 2:
        return False
    if len(GARBAGE.findall(text)) / max(len(text), 1) > 0.04:
        return False
    return True


def _is_good_fatua_row(row: dict, text: str) -> bool:
    url = (row.get("source_url") or "").split("#")[0]
    if not re.search(r"/kk/(?:qa|fatwas|media)/read/\d{4}-\d{2}-\d{2}/", url):
        return False
    if len(text) < 80 or len(text) > 12000:
        return False
    if len(KK.findall(text)) < 40:
        return False
    if len(GARBAGE.findall(text)) / max(len(text), 1) > 0.05:
        return False
    hadith_hint = re.search(r"(?i)хадис|риуаят|пайғамбар|сахих|бухари|муслим", text)
    if not hadith_hint and len(text) > 2500:
        return False
    return True


def _is_good_row(row: dict) -> tuple[bool, str]:
    site = (row.get("source_site") or "").strip().lower()
    if site not in ("muftyat", "fatua"):
        return False, ""
    text = _clean_text(row.get("hadith_text") or "")
    if not text:
        return False, ""
    if site == "muftyat":
        return _is_good_muftyat_row(row, text), text
    return _is_good_fatua_row(row, text), text


def export_bundle(db_path: Path, out_path: Path) -> dict:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT hadith_id, hadith_text, narrator, source_url, source_site,
               collection_hint, page_title, scraped_at
        FROM scraped_hadith
        WHERE source_site IN ('muftyat', 'fatua')
        ORDER BY source_site, id
        """
    ).fetchall()
    conn.close()

    best_by_url: dict[str, dict] = {}
    for r in rows:
        d = dict(r)
        ok, text = _is_good_row(d)
        if not ok:
            continue
        site = (d["source_site"] or "").strip().lower()
        url = (d["source_url"] or "").split("#")[0]
        key = f"{site}:{url}"
        prev = best_by_url.get(key)
        if prev is None or len(text) > len(prev["text"]):
            best_by_url[key] = {
                "id": d["hadith_id"],
                "title": _title_from_page(d.get("page_title") or "", site=site),
                "text": text,
                "narrator": (d.get("narrator") or "").strip(),
                "collectionHint": (d.get("collection_hint") or "").strip(),
                "sourceUrl": url,
                "sourceSite": site,
                "scrapedAt": d.get("scraped_at") or "",
            }

    items = sorted(
        best_by_url.values(),
        key=lambda x: (x["sourceSite"], x["title"].lower()),
    )
    muftyat_n = sum(1 for x in items if x["sourceSite"] == "muftyat")
    fatua_n = sum(1 for x in items if x["sourceSite"] == "fatua")

    bundle = {
        "version": 2,
        "sourceOrg": "Fatua.kz + Muftyat.kz — ҚМДБ ресми порталдары",
        "licenseNote": "Ресми рұқсат бойынша RAQAT офлайн оқуға; әр жазбада sourceUrl.",
        "itemCount": len(items),
        "countsBySite": {"muftyat": muftyat_n, "fatua": fatua_n},
        "items": items,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "exported": len(items),
        "muftyat": muftyat_n,
        "fatua": fatua_n,
        "total_rows": len(rows),
        "out": str(out_path),
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--db", default=str(DEFAULT_DB))
    p.add_argument("--out", default=str(DEFAULT_OUT))
    args = p.parse_args()
    stats = export_bundle(Path(args.db), Path(args.out))
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
