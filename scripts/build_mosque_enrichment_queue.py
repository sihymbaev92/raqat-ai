#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build a source-review queue for mosque detail enrichment.

The app ships 2GIS mosque coverage for Kazakhstan. This script creates a CSV
work queue for verifying imam/contact/photo/official links from public sources.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "mobile" / "assets" / "bundled" / "mosques-2gis-kz.json"
ENRICHMENT_TS = ROOT / "mobile" / "src" / "data" / "mosqueDetailsEnrichment.ts"
DEFAULT_OUT = ROOT / "data" / "mosque_enrichment_queue.csv"


def load_catalog() -> list[dict]:
    payload = json.loads(CATALOG.read_text(encoding="utf-8"))
    rows = payload.get("mosques") or []
    if not isinstance(rows, list):
        raise RuntimeError(f"Invalid mosque catalog: {CATALOG}")
    return rows


def explicit_enrichment_ids() -> set[str]:
    text = ENRICHMENT_TS.read_text(encoding="utf-8").split("export function", 1)[0]
    return set(re.findall(r'"(\d{8,})"\s*:', text))


def priority_score(row: dict) -> int:
    hay = " ".join(
        str(row.get(k) or "").lower()
        for k in ("name", "address", "fullAddress", "regionName")
    )
    score = 0
    if any(word in hay for word in ("орталық", "central", "собор", "қалалық", "районная центральная")):
        score += 50
    if any(city in hay for city in ("астана", "алматы", "шымкент", "ақтөбе", "караганда", "қарағанды")):
        score += 25
    if row.get("phone") or row.get("contactPhones"):
        score += 15
    if row.get("websites") or row.get("socialUrls"):
        score += 20
    return score


def search_url(engine: str, query: str) -> str:
    q = urllib.parse.quote_plus(query)
    if engine == "google":
        return f"https://www.google.com/search?q={q}"
    if engine == "yandex":
        return f"https://yandex.kz/search/?text={q}"
    if engine == "muftyat":
        return f"https://www.muftyat.kz/kk/search/?q={q}"
    raise ValueError(engine)


def build_query(row: dict) -> str:
    parts = [
        row.get("name"),
        row.get("regionName"),
        row.get("address") or row.get("fullAddress"),
        "мешіт имам телефон ресми",
    ]
    return " ".join(str(p).strip() for p in parts if str(p or "").strip())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="CSV output path")
    parser.add_argument("--limit", type=int, default=0, help="Limit rows; 0 means all")
    parser.add_argument("--region", default="", help="Filter by region/city text")
    parser.add_argument("--include-enriched", action="store_true", help="Include already explicit enriched rows")
    args = parser.parse_args()

    enriched_ids = explicit_enrichment_ids()
    region_filter = args.region.strip().lower()
    rows = []
    for row in load_catalog():
        mosque_id = str(row.get("id") or "")
        if not mosque_id:
            continue
        if not args.include_enriched and mosque_id in enriched_ids:
            continue
        if region_filter and region_filter not in str(row.get("regionName") or "").lower():
            continue
        query = build_query(row)
        rows.append(
            {
                "priority": priority_score(row),
                "id": mosque_id,
                "name": row.get("name") or "",
                "region": row.get("regionName") or "",
                "address": row.get("fullAddress") or row.get("address") or "",
                "already_enriched": "yes" if mosque_id in enriched_ids else "no",
                "phone_from_2gis": row.get("phone") or ", ".join(row.get("contactPhones") or []),
                "site_from_2gis": ", ".join((row.get("websites") or []) + (row.get("socialUrls") or [])),
                "schedule_from_2gis": row.get("scheduleText") or "",
                "map_url": row.get("mapUrl") or f"https://2gis.kz/firm/{mosque_id}",
                "google_search": search_url("google", query),
                "yandex_search": search_url("yandex", query),
                "muftyat_search": search_url("muftyat", query),
                "review_notes": "",
            }
        )

    rows.sort(key=lambda r: (-int(r["priority"]), r["region"], r["name"]))
    if args.limit and args.limit > 0:
        rows = rows[: args.limit]

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "priority",
        "id",
        "name",
        "region",
        "address",
        "already_enriched",
        "phone_from_2gis",
        "site_from_2gis",
        "schedule_from_2gis",
        "map_url",
        "google_search",
        "yandex_search",
        "muftyat_search",
        "review_notes",
    ]
    with out.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Saved {len(rows)} mosque enrichment queue rows -> {out}")
    print("Verify imam/phone/photo only from official mosque, QMDB/muftyat, reliable map, or local authority sources.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
