#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""supermarket-site/data/products.json — schema, сандық stats, CI gate."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_JSON = ROOT / "supermarket-site" / "data" / "products.json"
FALLBACK_DIR = ROOT / "supermarket-site" / "assets" / "fallback"

VALID_CATEGORIES = {
    "milk",
    "meat",
    "bakery",
    "drinks",
    "grocery",
    "household",
    "ready",
    "frozen",
    "sweets",
    "baby",
    "other",
}
REQUIRED_FIELDS = ("id", "title", "category", "price", "unit", "imageUrl")


def load_products(path: Path) -> list[dict]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, dict):
        products = raw.get("products")
    else:
        products = raw
    if not isinstance(products, list):
        raise ValueError("products.json: 'products' must be a list")
    return products


def image_kind(url: str) -> str:
    u = (url or "").strip().lower()
    if not u:
        return "missing"
    if "openfoodfacts" in u:
        return "off"
    if "ui-avatars.com" in u:
        return "avatar"
    if u.startswith("./assets/fallback/") or "/assets/fallback/" in u:
        return "fallback"
    if u.startswith("http"):
        return "http"
    return "other"


def validate_products(products: list[dict], *, min_count: int, max_other: int) -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    ids: set[int] = set()
    category_counts: dict[str, int] = {}
    image_counts: dict[str, int] = {}

    for i, product in enumerate(products):
        if not isinstance(product, dict):
            errors.append(f"row {i}: not an object")
            continue
        for field in REQUIRED_FIELDS:
            if field not in product or product[field] in (None, ""):
                errors.append(f"id={product.get('id', i)}: missing {field}")
        pid = product.get("id")
        if isinstance(pid, int):
            if pid in ids:
                errors.append(f"duplicate id={pid}")
            ids.add(pid)
        cat = product.get("category")
        if cat not in VALID_CATEGORIES:
            errors.append(f"id={product.get('id', i)}: invalid category={cat!r}")
        else:
            category_counts[cat] = category_counts.get(cat, 0) + 1
        price = product.get("price")
        if not isinstance(price, (int, float)) or price < 0:
            errors.append(f"id={product.get('id', i)}: invalid price={price!r}")
        kind = image_kind(str(product.get("imageUrl", "")))
        image_counts[kind] = image_counts.get(kind, 0) + 1

    total = len(products)
    if total < min_count:
        errors.append(f"too few products: {total} < {min_count}")

    other_count = category_counts.get("other", 0)
    if other_count > max_other:
        warnings.append(f"category 'other' high: {other_count} > {max_other}")

    avatar_count = image_counts.get("avatar", 0)
    if total and avatar_count / total > 0.6:
        warnings.append(f"ui-avatars still high: {avatar_count}/{total} ({avatar_count * 100 // total}%)")

    off_count = image_counts.get("off", 0)
    real_http = image_counts.get("http", 0) + off_count
    stats = {
        "total": total,
        "categories": category_counts,
        "images": image_counts,
        "realPhotoPct": round(real_http * 100 / total, 1) if total else 0,
        "avatarPct": round(avatar_count * 100 / total, 1) if total else 0,
    }
    return {"errors": errors, "warnings": warnings, "stats": stats}


def validate_fallback_assets(products: list[dict]) -> list[str]:
    errors: list[str] = []
    used = {p.get("category") for p in products if p.get("category") in VALID_CATEGORIES}
    used.add("other")
    for cat in sorted(used):
        path = FALLBACK_DIR / f"{cat}.svg"
        if not path.is_file():
            errors.append(f"missing fallback SVG: {path.relative_to(ROOT)}")
    return errors


def validate_site_files() -> list[str]:
    errors: list[str] = []
    site = ROOT / "supermarket-site"
    for name in ("index.html", "app.js", "styles.css", "config.js"):
        if not (site / name).is_file():
            errors.append(f"missing supermarket-site/{name}")
    html = (site / "index.html").read_text(encoding="utf-8")
    if "store-pro.css" in html:
        errors.append("index.html still links store-pro.css")
    if "config.js" not in html:
        errors.append("index.html must load config.js before app.js")
    if re.search(r"app\.js\?v=", html) is None:
        errors.append("index.html: app.js cache bust (?v=) missing")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Timur supermarket catalog")
    parser.add_argument("--json", type=Path, default=PRODUCTS_JSON)
    parser.add_argument("--min-count", type=int, default=1000)
    parser.add_argument("--max-other", type=int, default=2500)
    parser.add_argument("--skip-site", action="store_true")
    args = parser.parse_args()

    if not args.json.is_file():
        print(f"ERROR: not found: {args.json}", file=sys.stderr)
        return 2

    products = load_products(args.json)
    result = validate_products(products, min_count=args.min_count, max_other=args.max_other)
    asset_errors = validate_fallback_assets(products)
    site_errors = [] if args.skip_site else validate_site_files()

    stats = result["stats"]
    print(f"OK products: {stats['total']}")
    print(f"  real photo ~{stats['realPhotoPct']}% | avatars ~{stats['avatarPct']}%")
    print(f"  images: {stats['images']}")
  top_cats = sorted(stats["categories"].items(), key=lambda x: -x[1])[:5]
    print(f"  top categories: {top_cats}")

    for w in result["warnings"]:
        print(f"WARN: {w}")
    for e in result["errors"] + asset_errors + site_errors:
        print(f"ERROR: {e}", file=sys.stderr)

    failed = bool(result["errors"] or asset_errors or site_errors)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
