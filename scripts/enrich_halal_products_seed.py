#!/usr/bin/env python3
"""
halal_products_seed_kz.csv толықтыру:
- halaldamu companies API → company_id (бренд бойынша)
- Open Food Facts → нақты GTIN (off_query бағанасы бар жолдар)

Содан build_halal_products_seed_json.py шақырылады.
"""
from __future__ import annotations

import argparse
import sys
import csv
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "halal_products_seed_kz.csv"
BUILD_SCRIPT = ROOT / "scripts" / "build_halal_products_seed_json.py"

HALAL_ORIGIN = "https://halaldamu.kz"
OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl"
UA = "Raqat-Halal-Seed-Enrich/1.0 (+https://rahatomir.com)"

# бренд → halaldamu search сөздері
BRAND_SEARCH: dict[str, list[str]] = {
    "FoodMaster": ["foodmaster", "фудмастер", "food master"],
    "Рахат": ["рахат", "rakhat", "rahat"],
    "Coca-Cola": ["coca", "кока"],
    "Нан зауыты": ["нан", "хлеб"],
    "Астық": ["астык", "мук", "ұн"],
}


def http_json(url: str, timeout: float = 40.0) -> dict | list | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception:
        return None


def ean13_checksum(base12: str) -> str:
    total = sum(
        int(base12[i]) * (3 if (12 - i) % 2 == 0 else 1) for i in range(12)
    )
    return str((10 - total % 10) % 10)


def normalize_gtin(raw: str, *, strict_checksum: bool = False) -> str | None:
    digits = re.sub(r"\D", "", (raw or "").strip())
    if len(digits) < 8 or not digits.isdigit():
        return None
    if len(digits) == 12:
        digits = "0" + digits
    if len(digits) > 13:
        digits = digits[:13]
    if len(digits) == 13 and strict_checksum:
        if int(digits[12]) != int(ean13_checksum(digits[:12])):
            return None
    return digits


def search_halaldamu_company(query: str) -> int | None:
    qs = urllib.parse.urlencode({"search": query, "per_page": "5", "page": "1"})
    url = f"{HALAL_ORIGIN}/wp-json/halal-bot/v1/companies?{qs}"
    data = http_json(url)
    if not isinstance(data, dict):
        return None
    items = data.get("items") or []
    if not items:
        return None
    q = query.lower()
    for it in items:
        title = (it.get("title") or "").lower()
        if q in title or title in q:
            cid = it.get("id")
            if isinstance(cid, int) and cid > 0:
                return cid
    first = items[0]
    cid = first.get("id")
    return int(cid) if isinstance(cid, int) and cid > 0 else None


def off_gtin_for_query(query: str) -> str | None:
    params = {
        "search_terms": query,
        "search_simple": "1",
        "action": "process",
        "json": "1",
        "page_size": "5",
        "countries": "Kazakhstan",
    }
    url = f"{OFF_SEARCH}?{urllib.parse.urlencode(params)}"
    data = http_json(url)
    if not isinstance(data, dict):
        return None
    for prod in data.get("products") or []:
        code = prod.get("code") or prod.get("_id")
        gtin = normalize_gtin(str(code or ""), strict_checksum=False)
        if gtin and len(gtin) >= 8:
            return gtin
    return None


def enrich_companies(rows: list[dict[str, str]], dry_run: bool) -> int:
    brand_cache: dict[str, int | None] = {}
    updated = 0
    for row in rows:
        if (row.get("company_id") or "").strip():
            continue
        brand = (row.get("brand") or "").strip()
        if not brand:
            continue
        if brand not in brand_cache:
            cid = None
            for q in BRAND_SEARCH.get(brand, [brand]):
                cid = search_halaldamu_company(q)
                if cid:
                    break
                time.sleep(0.35)
            brand_cache[brand] = cid
        cid = brand_cache[brand]
        if cid:
            if not dry_run:
                row["company_id"] = str(cid)
                if (row.get("certificate_status") or "").strip() in ("", "reference"):
                    row["certificate_status"] = "active"
            updated += 1
    return updated


def enrich_off_gtin(rows: list[dict[str, str]], dry_run: bool) -> int:
    updated = 0
    for row in rows:
        off_q = (row.get("off_query") or "").strip()
        if not off_q:
            title = (row.get("title_kk") or "").strip()
            brand = (row.get("brand") or "").strip()
            if brand in ("Coca-Cola",) and title:
                off_q = f"{brand} {title}"
        if not off_q:
            continue
        gtin = off_gtin_for_query(off_q)
        time.sleep(0.4)
        if not gtin:
            continue
        if not dry_run:
            row["gtin"] = gtin
            note = (row.get("notes") or "").strip()
            row["notes"] = f"{note}; OFF:{off_q}".strip("; ")
        updated += 1
    return updated


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--skip-off", action="store_true")
    ap.add_argument("--skip-companies", action="store_true")
    ap.add_argument("--no-build", action="store_true")
    args = ap.parse_args()

    if not CSV_PATH.is_file():
        raise SystemExit(f"Missing {CSV_PATH}")

    with CSV_PATH.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    if "off_query" not in fieldnames:
        fieldnames.append("off_query")

    n_company = 0 if args.skip_companies else enrich_companies(rows, args.dry_run)
    n_off = 0 if args.skip_off else enrich_off_gtin(rows, args.dry_run)

    print(f"company_id updates: {n_company}")
    print(f"OFF gtin updates: {n_off}")

    if not args.dry_run:
        with CSV_PATH.open("w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)

        if not args.no_build:
            import subprocess

            subprocess.run(
                [sys.executable, str(BUILD_SCRIPT)],
                check=True,
                cwd=str(ROOT),
            )
    return 0


if __name__ == "__main__":
    import sys

    raise SystemExit(main())
