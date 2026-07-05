#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тимур каталогын жақсарту: категория қайта бөлу, halal join, stats, priority SKU тізімі.
"""
from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import re
import sys
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_JSON = ROOT / "supermarket-site" / "data" / "products.json"
STATS_JSON = ROOT / "supermarket-site" / "data" / "catalog-stats.json"
PRIORITY_JSON = ROOT / "supermarket-site" / "data" / "priority-skus.json"
HALAL_CSV = ROOT / "data" / "halal_products_seed_kz.csv"

# build скриптінен кейін қосымша кілт сөздер (other азайту)
EXTRA_CATEGORY_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("drinks", (" лайм", "лайм ", "ананас", "дыня", "маракуя", "манго", "апельсин", "ерке нур", "rubis")),
    ("milk", ("курт", "қуырт", "творог", "сыр ", "сырок", "айран", "кефир", "йогурт")),
    ("sweets", ("doritos", "доритос", "чипс", "chips", "конф ", "конфет", "шоколад", "oreo", "snickers")),
    ("grocery", ("хлопь", "хлопья", "аджика", "маринован", "перчик", "крупа", "греч", "рис ", "макарон", "корм ", "кошек", "собак", "proхвост")),
    ("household", ("прокладк", "маска ", "кондиционер", "шампун", "акira", "акира", "мыло", "гель для душа", "туалет")),
    ("frozen", ("морож", "заморож", "пельмен", "мант ")),
    ("ready", ("салат ", "плов", "палау")),
    ("baby", ("памперс", "подгуз", "детск")),
]

PRIORITY_CATEGORIES = ("milk", "bakery", "drinks", "meat", "sweets", "grocery", "frozen")


def load_build_module():
    path = ROOT / "scripts" / "build_timur_supermarket_products.py"
    spec = importlib.util.spec_from_file_location("timur_build", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("build_timur_supermarket_products.py load failed")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def normalize_barcode(value: object) -> str:
    raw = str(value or "").strip()
    digits = re.sub(r"\D", "", raw)
    return digits or raw


def classify_extended(build_mod, title: str, subcategory: str | None) -> str:
    hay = f"{title} {subcategory or ''}".lower()
    for category, keywords in EXTRA_CATEGORY_RULES:
        if any(keyword in hay for keyword in keywords):
            return category
    return build_mod.classify_category(title, subcategory)


def load_halal_by_gtin(csv_path: Path) -> dict[str, dict]:
    if not csv_path.is_file():
        return {}
    out: dict[str, dict] = {}
    with csv_path.open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            gtin = normalize_barcode(row.get("gtin"))
            if not gtin:
                continue
            out[gtin] = {
                "certificateStatus": (row.get("certificate_status") or "").strip(),
                "titleKk": (row.get("title_kk") or "").strip(),
                "brand": (row.get("brand") or "").strip(),
            }
    return out


def map_halal_status(cert: str) -> str:
    c = (cert or "").strip().lower()
    if c == "active":
        return "halal"
    if c == "reference":
        return "reference"
    if c in {"review_required", "expired", "suspended", "revoked"}:
        return "doubtful"
    return "unknown"


def subcategory_hint(product: dict) -> str | None:
    tags = product.get("tags") or []
    if isinstance(tags, list) and len(tags) > 1:
        return str(tags[-1])
    return None


def recategorize_products(products: list[dict], build_mod) -> int:
    changed = 0
    for product in products:
        title = str(product.get("title") or "")
        sub = subcategory_hint(product)
        new_cat = classify_extended(build_mod, title, sub)
        if product.get("category") != new_cat:
            product["category"] = new_cat
            meta = build_mod.CATEGORY_META.get(new_cat, build_mod.CATEGORY_META["other"])
            product["icon"] = meta["icon"]
            if isinstance(product.get("tags"), list) and product["tags"]:
                product["tags"] = [product["tags"][0], meta["title"]]
            changed += 1
    return changed


def join_halal(products: list[dict], halal_map: dict[str, dict]) -> int:
    matched = 0
    for product in products:
        code = normalize_barcode(product.get("barcode"))
        row = halal_map.get(code)
        if not row:
            product.pop("halalStatus", None)
            product.pop("halalCertificate", None)
            continue
        cert = row["certificateStatus"]
        product["halalStatus"] = map_halal_status(cert)
        product["halalCertificate"] = cert
        matched += 1
    return matched


def image_kind(url: str) -> str:
    u = (url or "").strip().lower()
    if "openfoodfacts" in u:
        return "off"
    if "ui-avatars.com" in u:
        return "avatar"
    if "/assets/fallback/" in u:
        return "fallback"
    if u.startswith("http"):
        return "http"
    return "missing"


def build_stats(products: list[dict]) -> dict:
    cat = Counter(p.get("category") for p in products)
    img = Counter(image_kind(str(p.get("imageUrl") or "")) for p in products)
    halal = Counter(p.get("halalStatus") for p in products if p.get("halalStatus"))
    total = len(products)
    real = img.get("off", 0) + img.get("http", 0)
    return {
        "generatedAt": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "totalProducts": total,
        "categoryCounts": dict(sorted(cat.items(), key=lambda x: -x[1])),
        "imageCounts": dict(img),
        "realPhotoPct": round(real * 100 / total, 1) if total else 0,
        "avatarPct": round(img.get("avatar", 0) * 100 / total, 1) if total else 0,
        "halalMatched": sum(halal.values()),
        "halalStatusCounts": dict(halal),
        "otherCount": cat.get("other", 0),
        "otherPct": round(cat.get("other", 0) * 100 / total, 1) if total else 0,
    }


def build_priority_list(products: list[dict], limit: int = 500) -> list[dict]:
    picks: list[dict] = []
    for product in products:
        if product.get("category") not in PRIORITY_CATEGORIES:
            continue
        if "ui-avatars.com" not in str(product.get("imageUrl") or ""):
            continue
        barcode = normalize_barcode(product.get("barcode"))
        if len(barcode) < 6:
            continue
        picks.append(
            {
                "id": product.get("id"),
                "title": product.get("title"),
                "category": product.get("category"),
                "barcode": barcode,
            }
        )
    picks.sort(key=lambda x: (PRIORITY_CATEGORIES.index(x["category"]), x["id"]))
    return picks[:limit]


def main() -> int:
    parser = argparse.ArgumentParser(description="Refine Timur supermarket catalog")
    parser.add_argument("--json", type=Path, default=PRODUCTS_JSON)
    parser.add_argument("--halal-csv", type=Path, default=HALAL_CSV)
    parser.add_argument("--priority-limit", type=int, default=500)
    parser.add_argument("--skip-recategorize", action="store_true")
    parser.add_argument("--skip-halal", action="store_true")
    parser.add_argument("--stats-only", action="store_true", help="Stats + priority list only, no JSON write")
    args = parser.parse_args()

    if not args.json.is_file():
        print(f"ERROR: missing {args.json}", file=sys.stderr)
        return 2

    build_mod = load_build_module()
    payload = json.loads(args.json.read_text(encoding="utf-8"))
    products = payload.get("products") or []
    if not isinstance(products, list):
        print("ERROR: products must be a list", file=sys.stderr)
        return 2

    recat = 0
    if not args.skip_recategorize:
        recat = recategorize_products(products, build_mod)
        print(f"Recategorized: {recat} products")

    halal_n = 0
    if not args.skip_halal:
        halal_map = load_halal_by_gtin(args.halal_csv)
        halal_n = join_halal(products, halal_map)
        print(f"Halal join: {halal_n} barcode matches ({len(halal_map)} seed GTINs)")

    stats = build_stats(products)
    STATS_JSON.parent.mkdir(parents=True, exist_ok=True)
    STATS_JSON.write_text(json.dumps(stats, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Stats -> {STATS_JSON}")
    print(f"  other: {stats['otherCount']} ({stats['otherPct']}%)")
    print(f"  realPhoto: {stats['realPhotoPct']}% | avatars: {stats['avatarPct']}%")

    priority = build_priority_list(products, args.priority_limit)
    PRIORITY_JSON.write_text(json.dumps({"ids": [p["id"] for p in priority], "items": priority}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Priority SKUs -> {PRIORITY_JSON} ({len(priority)} items)")

    if args.stats_only:
        return 0

    payload["products"] = products
    payload["categoryCounts"] = stats["categoryCounts"]
    payload["catalogRefinedAt"] = stats["generatedAt"]
    payload["halalMatched"] = halal_n
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    args.json.write_bytes(text.encode("utf-8"))
    print(f"Saved -> {args.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
