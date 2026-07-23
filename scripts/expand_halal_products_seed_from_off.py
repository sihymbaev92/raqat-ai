#!/usr/bin/env python3
"""
halal_products_seed_kz.csv ← Open Food Facts (Kazakhstan) GTIN-дер.

Қолдағы CSV жолдары басым — дубликат GTIN қосылмайды.
halaldamu products API бос кезде штрихкод қамтуын кеңейту.

Usage:
  python scripts/expand_halal_products_seed_from_off.py
  python scripts/expand_halal_products_seed_from_off.py --limit 1000 --pages 25
  python scripts/expand_halal_products_seed_from_off.py --dry-run
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "halal_products_seed_kz.csv"
BUILD_SCRIPT = ROOT / "scripts" / "build_halal_products_seed_json.py"

OFF_SEARCH = "https://world.openfoodfacts.org/api/v2/search"
UA = "Raqat-Halal-Seed-OFF/1.0 (+https://rahatomir.com)"

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


def ean13_checksum(base12: str) -> str:
    total = sum(int(base12[i]) * (3 if (12 - i) % 2 == 0 else 1) for i in range(12))
    return str((10 - total % 10) % 10)


def normalize_gtin(raw: str, *, strict_checksum: bool = True) -> str | None:
    digits = re.sub(r"\D", "", (raw or "").strip())
    if len(digits) < 8 or not digits.isdigit():
        return None
    if len(digits) == 12:
        digits = "0" + digits
    if len(digits) > 13:
        digits = digits[:13]
    if len(digits) != 13:
        return None
    expected = ean13_checksum(digits[:12])
    if int(digits[12]) != int(expected):
        if strict_checksum:
            # OFF кейде checksum қате; дұрыс digit-пен түзетеміз
            digits = digits[:12] + expected
        else:
            return None
    return digits


_LATIN = re.compile(r"[A-Za-z]")
_CYR = re.compile(r"[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]")


def clean_product_text(raw: str, *, max_len: int = 180) -> str:
    """OFF HTML entity / тырнақшаларды тазалау."""
    text = html.unescape((raw or "").strip())
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_len]


def title_has_mixed_script_typo(title: str) -> bool:
    """Бір сөзде латын+кирилл араласқан OCR қателерін сүзу (тестпен бірдей)."""
    for tok in title.split():
        # тырнақша/жақшаны алып тастап тексеру
        core = re.sub(r'^[«»"\'\(\)\[\]\{\}]+|[«»"\'\(\)\[\]\{\}.,;:!?]+$', "", tok)
        if len(core) < 2:
            continue
        if _LATIN.search(core) and _CYR.search(core):
            return True
    return False


def http_json(url: str, timeout: float = 60.0) -> dict | list | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, OSError):
        return None


def product_title(product: dict) -> str:
    for key in ("product_name_kk", "product_name_ru", "product_name", "generic_name"):
        val = clean_product_text(product.get(key) or "")
        if len(val) >= 2:
            return val
    return ""


def product_brand(product: dict) -> str:
    brands = clean_product_text(product.get("brands") or "", max_len=80)
    if brands:
        return brands.split(",")[0].strip()[:80]
    return ""


def product_ingredients(product: dict) -> str:
    for key in ("ingredients_text_kk", "ingredients_text_ru", "ingredients_text"):
        val = clean_product_text(product.get(key) or "", max_len=240)
        if val:
            return val
    return ""


def fetch_off_page(
    page: int,
    page_size: int,
    *,
    retries: int = 3,
    countries_tag: str = "Kazakhstan",
    brands_tag: str | None = None,
    categories_tag: str | None = None,
) -> list[dict]:
    params: dict[str, str] = {
        "page_size": str(min(max(page_size, 1), 24)),
        "page": str(page),
        "fields": "code,product_name,product_name_ru,product_name_kk,generic_name,brands,ingredients_text,ingredients_text_ru,ingredients_text_kk",
    }
    if brands_tag:
        params["brands_tags"] = brands_tag
    else:
        params["countries_tags_en"] = countries_tag
        if categories_tag:
            params["categories_tags_en"] = categories_tag
    url = f"{OFF_SEARCH}?{urllib.parse.urlencode(params)}"
    for attempt in range(max(1, retries)):
        data = http_json(url)
        if isinstance(data, dict):
            products = data.get("products")
            if isinstance(products, list):
                return products
        time.sleep(0.6 * (attempt + 1))
    return []


# Қазақстан + Орталық Азия / ТМД сөрелерінде жиі кездесетін брендтер (OFF brands_tags)
BRAND_QUERIES = [
    "foodmaster",
    "rakhat",
    "rahat",
    "magnum",
    "coca-cola",
    "pepsico",
    "nestle",
    "danone",
    "lactalis",
    "ulker",
    "eti",
    "pinar",
    "sutas",
    "sek",
    "icim",
    "alpro",
    "lipton",
    "unilever",
    "bonduelle",
    "heinz",
    "barilla",
    "galbani",
    "hochland",
    "president",
    "prostokvashino",
    "domik-v-derevne",
    "campina",
    "milka",
    "oreo",
    "lays",
    "cheetos",
    "doritos",
    "pringles",
    "ferrero",
    "nutella",
    "kinder",
    "haribo",
    "red-bull",
    "sprite",
    "fanta",
    "schweppes",
    "bonaqua",
    "borjomi",
    "essentuki",
    "narzan",
    "raimbek",
    "rg-brands",
    "bekker",
    "dastarkhan",
    "aktia",
    "ehrmann",
    "valio",
    "arla",
    "dr-oetker",
    "knorr",
    "maggi",
    "nescafe",
    "jacobs",
    "ahmad",
    "greenfield",
    "tess",
    "prichal",
    "wimm-bill-dann",
    "chernogolovka",
    "dobryi",
    "j7",
    "rich",
    "sady-pridonya",
    "makfa",
    "shebekinskie",
    "grand-duet",
    "bounty",
    "snickers",
    "twix",
    "mars",
    "m-m-s",
    "actimel",
    "activia",
    "aktia-bio",
    "epica",
    "chudo",
    "rastishka",
    "tema",
    "agusha",
    "fruto-nyanya",
    "hipp",
    "nutricia",
    "nan",
    "similac",
]

# OFF countries_tags_en — KZ сөресінде жиі импорт
COUNTRY_QUERIES = [
    "Kazakhstan",
    "Russia",
    "Uzbekistan",
    "Kyrgyzstan",
    "Turkey",
    "Azerbaijan",
    "Ukraine",
    "Belarus",
    "China",
]

# Категория × ел — қосымша қамту
CATEGORY_QUERIES = [
    "dairies",
    "beverages",
    "cheeses",
    "yogurts",
    "chocolates",
    "biscuits",
    "breads",
    "cereals",
    "pastas",
    "meats",
    "sausages",
    "frozen-foods",
    "waters",
    "fruit-juices",
    "teas",
    "coffees",
    "noodles",
    "confectioneries",
]


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        return []
    with path.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        rows: list[dict[str, str]] = []
        for row in reader:
            cleaned = {k: (row.get(k) or "").strip() for k in FIELDNAMES}
            if not any(cleaned.values()):
                continue
            rows.append(cleaned)
        return rows


def write_csv_rows(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDNAMES, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") for k in FIELDNAMES})


def product_to_row(product: dict, gtin: str) -> dict[str, str]:
    title = product_title(product)
    brand = product_brand(product)
    ingredients = product_ingredients(product)
    return {
        "gtin": gtin,
        "title_kk": title,
        "brand": brand,
        "ingredients": ingredients,
        "company_id": "",
        "certificate_status": "reference",
        "notes": "open_food_facts",
        "off_query": "",
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Expand halal seed CSV from Open Food Facts (KZ + region)")
    ap.add_argument("--limit", type=int, default=4000, help="Max new rows to append (default 4000)")
    ap.add_argument("--pages", type=int, default=40, help="OFF pages per country (default 40)")
    ap.add_argument("--page-size", type=int, default=20, help="OFF page size (default 20; API rejects larger)")
    ap.add_argument("--brand-pages", type=int, default=8, help="OFF pages per brand (default 8)")
    ap.add_argument("--category-pages", type=int, default=5, help="OFF pages per category×country")
    ap.add_argument("--sleep", type=float, default=0.4, help="Delay between OFF requests")
    ap.add_argument("--retries", type=int, default=3, help="Retries per page on empty/fail")
    ap.add_argument("--csv", type=Path, default=CSV_PATH)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-build", action="store_true")
    args = ap.parse_args()

    country_queries = list(dict.fromkeys(COUNTRY_QUERIES))
    brand_queries = list(dict.fromkeys(BRAND_QUERIES))
    category_queries = list(dict.fromkeys(CATEGORY_QUERIES))

    manual_rows = read_csv_rows(args.csv)
    existing_gtins = {
        gtin
        for row in manual_rows
        if (gtin := normalize_gtin(row.get("gtin") or "", strict_checksum=False))
    }

    new_rows: list[dict[str, str]] = []
    seen_new: set[str] = set()

    def ingest(products: list[dict]) -> int:
        added = 0
        for product in products:
            if len(new_rows) >= args.limit:
                break
            gtin = normalize_gtin(str(product.get("code") or ""))
            if not gtin or gtin in existing_gtins or gtin in seen_new:
                continue
            title = product_title(product)
            if len(title) < 2:
                continue
            if title_has_mixed_script_typo(title):
                continue
            row = product_to_row(product, gtin)
            new_rows.append(row)
            seen_new.add(gtin)
            added += 1
        return added

    for country in country_queries:
        if len(new_rows) >= args.limit:
            break
        consecutive_empty = 0
        for page in range(1, max(1, args.pages) + 1):
            if len(new_rows) >= args.limit:
                break
            products = fetch_off_page(
                page,
                args.page_size,
                retries=args.retries,
                countries_tag=country,
            )
            if not products:
                consecutive_empty += 1
                print(
                    f"{country} page {page}: empty / failed ({consecutive_empty})",
                    file=sys.stderr,
                )
                if consecutive_empty >= 3:
                    print(f"too many empty pages — stop {country} crawl", file=sys.stderr)
                    break
                time.sleep(max(0.0, args.sleep))
                continue
            consecutive_empty = 0
            page_added = ingest(products)
            print(
                f"{country} page {page}: +{page_added} (total new {len(new_rows)})",
                file=sys.stderr,
            )
            time.sleep(max(0.0, args.sleep))

    for country in ("Kazakhstan", "Russia", "Turkey"):
        if len(new_rows) >= args.limit:
            break
        for category in category_queries:
            if len(new_rows) >= args.limit:
                break
            for page in range(1, max(1, args.category_pages) + 1):
                if len(new_rows) >= args.limit:
                    break
                products = fetch_off_page(
                    page,
                    args.page_size,
                    retries=args.retries,
                    countries_tag=country,
                    categories_tag=category,
                )
                if not products:
                    break
                page_added = ingest(products)
                print(
                    f"{country}/{category} p{page}: +{page_added} (total new {len(new_rows)})",
                    file=sys.stderr,
                )
                time.sleep(max(0.0, args.sleep))

    for brand in brand_queries:
        if len(new_rows) >= args.limit:
            break
        for page in range(1, max(1, args.brand_pages) + 1):
            if len(new_rows) >= args.limit:
                break
            products = fetch_off_page(
                page, args.page_size, retries=args.retries, brands_tag=brand
            )
            if not products:
                break
            page_added = ingest(products)
            print(f"brand {brand} p{page}: +{page_added} (total new {len(new_rows)})", file=sys.stderr)
            time.sleep(max(0.0, args.sleep))

    print(
        f"existing={len(existing_gtins)} new={len(new_rows)} limit={args.limit}",
        file=sys.stderr,
    )
    if args.dry_run:
        for row in new_rows[:8]:
            print(f"  {row['gtin']}  {row['title_kk'][:60]}", file=sys.stderr)
        return 0

    merged = manual_rows + new_rows
    write_csv_rows(args.csv, merged)
    print(f"wrote {args.csv} ({len(merged)} rows)", file=sys.stderr)

    if not args.no_build and BUILD_SCRIPT.is_file():
        subprocess.check_call([sys.executable, str(BUILD_SCRIPT)], cwd=str(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
