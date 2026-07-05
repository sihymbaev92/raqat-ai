#!/usr/bin/env python3
"""
halal_products_seed_kz.csv → supermarket-site/data/products.json

Timur supermarket каталогынан нақты GTIN-дерді қосу (halaldamu products API бос кезде).
Қолмен seed жолдары басым — дубликат GTIN қайталанбайды.

Usage:
  python scripts/expand_halal_products_seed_from_supermarket.py
  python scripts/expand_halal_products_seed_from_supermarket.py --include-unknown --limit 5000
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "halal_products_seed_kz.csv"
PRODUCTS_PATH = ROOT / "supermarket-site" / "data" / "products.json"
BUILD_SCRIPT = ROOT / "scripts" / "build_halal_products_seed_json.py"

FIELDNAMES = [
    "gtin",
    "title_kk",
    "brand",
    "ingredients",
    "company_id",
    "certificate_status",
    "notes",
    "off_query",
]

CERT_RANK = {
    "active": 4,
    "reference": 3,
    "review_required": 2,
    "expired": 1,
    "suspended": 1,
    "revoked": 1,
}


def normalize_gtin(raw: str) -> str | None:
    digits = re.sub(r"\D", "", (raw or "").strip())
    if len(digits) < 8 or not digits.isdigit():
        return None
    if len(digits) == 12:
        digits = "0" + digits
    if len(digits) > 13:
        digits = digits[:13]
    return digits


def map_certificate_status(product: dict) -> str:
    cert = (product.get("halalCertificate") or "").strip().lower()
    status = (product.get("halalStatus") or "").strip().lower()
    if cert == "active":
        return "active"
    if status == "halal":
        return "active"
    if status == "reference":
        return "reference"
    if status == "doubtful":
        return "review_required"
    if cert in CERT_RANK:
        return cert
    return "reference"


def ingredients_from_product(product: dict) -> str | None:
    desc = (product.get("desc") or "").strip()
    if not desc:
        return None
    # desc often repeats title/barcode — keep short ingredient-like tail only when useful
    if "Штрихкод:" in desc and len(desc) < 120:
        return None
    return desc[:240] if len(desc) > 240 else desc


def product_to_row(product: dict, gtin: str) -> dict[str, str]:
    cert = map_certificate_status(product)
    supplier = (product.get("supplier") or "").strip()
    match_source = (product.get("halalMatchSource") or "").strip()
    notes_parts = ["timur_supermarket"]
    if match_source:
        notes_parts.append(f"match={match_source}")
    halal_status = (product.get("halalStatus") or "").strip()
    if halal_status:
        notes_parts.append(f"halalStatus={halal_status}")
    return {
        "gtin": gtin,
        "title_kk": (product.get("title") or "").strip(),
        "brand": supplier or "",
        "ingredients": ingredients_from_product(product) or "",
        "company_id": "",
        "certificate_status": cert,
        "notes": "; ".join(notes_parts),
        "off_query": "",
    }


def load_supermarket_products(path: Path) -> list[dict]:
    if not path.is_file():
        raise SystemExit(f"Missing {path}")
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw
    return raw.get("products") or raw.get("items") or []


def pick_best_by_gtin(products: list[dict], *, include_unknown: bool) -> dict[str, dict]:
    best: dict[str, tuple[int, dict]] = {}
    for product in products:
        gtin = normalize_gtin(str(product.get("barcode") or ""))
        if not gtin:
            continue
        halal_status = (product.get("halalStatus") or "").strip().lower()
        if not include_unknown and halal_status not in ("halal", "reference", "doubtful"):
            continue
        title = (product.get("title") or "").strip()
        if len(title) < 2:
            continue
        cert = map_certificate_status(product)
        rank = CERT_RANK.get(cert, 0)
        if halal_status == "halal" and cert != "active":
            rank = max(rank, 3)
        prev = best.get(gtin)
        if prev is None or rank > prev[0]:
            best[gtin] = (rank, product)
    return {gtin: prod for gtin, (_, prod) in best.items()}


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        rows = []
        for row in reader:
            cleaned = {k: (row.get(k) or "").strip() for k in FIELDNAMES}
            if not any(cleaned.values()):
                continue
            rows.append(cleaned)
        return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--include-unknown",
        action="store_true",
        help="Include supermarket SKUs without halalStatus (as reference)",
    )
    ap.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Max new rows to append (0 = no limit)",
    )
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-build", action="store_true")
    ap.add_argument("--products", type=Path, default=PRODUCTS_PATH)
    ap.add_argument("--csv", type=Path, default=CSV_PATH)
    args = ap.parse_args()

    manual_rows = read_csv_rows(args.csv)
    existing_gtins = {
        gtin
        for row in manual_rows
        if (gtin := normalize_gtin(row.get("gtin") or ""))
    }

    products = load_supermarket_products(args.products)
    picked = pick_best_by_gtin(products, include_unknown=args.include_unknown)

    new_rows: list[dict[str, str]] = []
    for gtin, product in sorted(picked.items(), key=lambda x: x[0]):
        if gtin in existing_gtins:
            continue
        new_rows.append(product_to_row(product, gtin))
        if args.limit and len(new_rows) >= args.limit:
            break

    print(f"manual rows kept: {len(manual_rows)}")
    print(f"supermarket candidates: {len(picked)}")
    print(f"new rows to append: {len(new_rows)}")
    print(f"total after merge: {len(manual_rows) + len(new_rows)}")

    if args.dry_run:
        return 0

    merged = manual_rows + new_rows
    with args.csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(merged)

    if not args.no_build:
        subprocess.run([sys.executable, str(BUILD_SCRIPT)], check=True, cwd=str(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
