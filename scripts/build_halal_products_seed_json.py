#!/usr/bin/env python3
"""data/halal_products_seed_kz.csv → mobile/assets/bundled/halal-products-seed-kz.json"""
from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "halal_products_seed_kz.csv"
GTIN_OVERRIDES = ROOT / "data" / "halal_seed_gtin_overrides.csv"
JSON_PATH = ROOT / "mobile" / "assets" / "bundled" / "halal-products-seed-kz.json"


def ean13_checksum(base12: str) -> int:
    if len(base12) != 12 or not base12.isdigit():
        raise ValueError(f"need 12 digits, got {base12!r}")
    total = 0
    for i, ch in enumerate(base12):
        n = int(ch)
        if (12 - i) % 2 == 0:
            total += n * 3
        else:
            total += n
    return (10 - total % 10) % 10


def normalize_gtin(raw: str) -> str:
    digits = re.sub(r"\D", "", (raw or "").strip())
    if len(digits) < 8:
        raise ValueError(f"GTIN too short: {raw!r}")
    if len(digits) == 12:
        digits = "0" + digits
    if len(digits) == 13:
        expected = ean13_checksum(digits[:12])
        if int(digits[12]) != expected:
            digits = digits[:12] + str(expected)
    return digits


def parse_row(row: dict[str, str], line_no: int) -> dict:
    gtin = normalize_gtin(row.get("gtin") or row.get("barcode") or "")
    title = (row.get("title_kk") or row.get("title") or "").strip()
    if not title:
        raise ValueError(f"line {line_no}: empty title")
    brand = (row.get("brand") or "").strip() or None
    ingredients = (row.get("ingredients") or "").strip() or None
    cid_raw = (row.get("company_id") or "").strip()
    company_id = int(cid_raw) if cid_raw.isdigit() and int(cid_raw) > 0 else None
    cert = (row.get("certificate_status") or "").strip() or "reference"
    if company_id and cert == "reference":
        cert = "active"
    note = (row.get("notes") or "").strip() or None
    return {
        "gtin": gtin,
        "title": title,
        "brand": brand,
        "ingredients": ingredients,
        "companyId": company_id,
        "certificateStatus": cert,
        "note": note,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", type=Path, default=CSV_PATH)
    ap.add_argument("--out", type=Path, default=JSON_PATH)
    args = ap.parse_args()
    if not args.csv.is_file():
        raise SystemExit(f"CSV not found: {args.csv}")

    overrides: dict[str, str] = {}
    if GTIN_OVERRIDES.is_file():
        with GTIN_OVERRIDES.open(encoding="utf-8-sig", newline="") as oh:
            for o in csv.DictReader(oh):
                key = (o.get("title_match") or "").strip().lower()
                gtin = (o.get("gtin") or "").strip()
                if key and gtin:
                    overrides[key] = gtin

    items: list[dict] = []
    with args.csv.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        for i, row in enumerate(reader, start=2):
            if not any((v or "").strip() for v in row.values()):
                continue
            if (row.get("gtin") or row.get("barcode") or "").strip().startswith("#"):
                continue
            title = (row.get("title_kk") or row.get("title") or "").strip()
            for key, gtin in overrides.items():
                if key in title.lower():
                    row["gtin"] = gtin
                    break
            items.append(parse_row(row, i))

    payload = {
        "version": 1,
        "updated": date.today().isoformat(),
        "source": "manual_kz_seed",
        "disclaimer": "RAQAT уақытша анықтама — halaldamu products API толыққанша ресми реестр басым.",
        "items": items,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} items → {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
