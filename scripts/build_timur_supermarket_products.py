#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Тимур дүкені Excel экспортын supermarket-site/data/products.json форматына аудару."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = Path(r"c:\Users\Жасулан\Desktop\Список товаров_export_18.06.2026 21_53.xlsx")
OUT_DIR = ROOT / "supermarket-site" / "data"
OUT_JSON = OUT_DIR / "products.json"

CATEGORY_RULES: list[tuple[str, tuple[str, ...]]] = [
    (
        "baby",
        (
            "детск",
            "балалар",
            "baby",
            "infant",
            "памперс",
            "подгуз",
            "смесь",
            "питание дет",
            "для детей",
        ),
    ),
    (
        "milk",
        (
            "молок",
            "сүт",
            "айран",
            "ayran",
            "кефир",
            "kefir",
            "йогурт",
            "yogurt",
            "творог",
            "сметан",
            "сыр",
            "irimsh",
            "ірімш",
            "сырок",
            "масло",
            "маргарин",
            "қаймақ",
            "kaymak",
            "ряжен",
            "ryazhen",
            "сузбе",
            "сгущ",
        ),
    ),
    (
        "meat",
        (
            "мяс",
            "ет ",
            "курин",
            "куриц",
            "тауық",
            "колбас",
            "сосиск",
            "бекон",
            "ветчин",
            "фарш",
            "стейк",
            "рыб",
            "балық",
            "лосос",
            "salmon",
            "sausage",
            "nugget",
            "наггет",
            "ветч",
            "бекон",
            "индей",
            "утка",
        ),
    ),
    (
        "bakery",
        (
            "хлеб",
            " нан",
            "батон",
            "булоч",
            "круассан",
            "печень",
            "самса",
            "лаваш",
            "лепеш",
            "баранк",
            "сухар",
            "торт",
            "пирог",
            "бисквит",
            "кекс",
            "соломк",
            "сухар",
            "багет",
        ),
    ),
    (
        "drinks",
        (
            "cola",
            "кола",
            "sprite",
            "fanta",
            "pepsi",
            "сок ",
            "шырын",
            " juice",
            "чай ",
            "кофе",
            "coffee",
            "энергет",
            "energet",
            "лимонад",
            "компот",
            "минeral",
            "минерал",
            " вода",
            " su ",
            "пиво",
            "сусын",
            "schweppes",
            "red bull",
            "monster",
            "ramen",
        ),
    ),
    (
        "frozen",
        (
            "морож",
            "заморож",
            "моражен",
            "замор",
            "frozen",
            "пельмен",
            "pelmen",
            "мант",
            "varenik",
            "наггет",
            "nugget",
            "морожен",
            "замороз",
        ),
    ),
    (
        "ready",
        (
            "готов",
            "салат ",
            "палав",
            "палау",
            "plov",
            "раmen",
            "лапша быстр",
            "instant",
            "суп ",
            "борщ",
        ),
    ),
    (
        "sweets",
        (
            "шоколад",
            "конфет",
            "candy",
            "мармелад",
            "drag",
            "пралин",
            "вафл",
            "halva",
            "халва",
            "желе ",
            "zhele",
            "орео",
            "oreo",
            "kitkat",
            "snickers",
            "mars ",
            "twix",
        ),
    ),
    (
        "household",
        (
            "моющ",
            "стир",
            "порошок",
            "салфет",
            "shampun",
            "шампун",
            "мыло",
            "гель для",
            "пакет",
            "перчатк",
            "средство",
            "уборк",
            "tualet",
            "туалет",
            "жидкост",
            "освеж",
            "спрей",
            "батарейк",
            "ламп",
            "спичк",
            "зажиг",
            "салфет",
            "губк",
            "мусор",
            "свеч",
        ),
    ),
]

CATEGORY_META = {
    "milk": {"icon": "🥛", "title": "Сүт өнімдері"},
    "meat": {"icon": "🥩", "title": "Ет, құс және балық"},
    "bakery": {"icon": "🍞", "title": "Нан және кондитер"},
    "drinks": {"icon": "🧃", "title": "Сусындар"},
    "household": {"icon": "🧴", "title": "Үйге арналған"},
    "ready": {"icon": "🍱", "title": "Дайын тағам"},
    "frozen": {"icon": "🧊", "title": "Мұздатылған"},
    "sweets": {"icon": "🍫", "title": "Тәттілер"},
    "baby": {"icon": "🧸", "title": "Балаларға"},
    "other": {"icon": "📦", "title": "Басқа тауарлар"},
}

UNIT_MAP = {"шт": "дана", "кг": "кг", "литр": "л", "л": "л", "г": "г", "уп": "уп"}


def normalize_title(value: object) -> str:
    text = str(value or "").strip()
    return re.sub(r"\s+", " ", text)


def normalize_barcode(value: object) -> str:
    raw = str(value or "").strip()
    if not raw or raw.lower() == "none":
        return ""
    if re.fullmatch(r"\d+\.0", raw):
        raw = raw[:-2]
    digits = re.sub(r"\D", "", raw)
    return digits or raw


def normalize_unit(value: object) -> str:
    unit = str(value or "шт").strip().lower()
    return UNIT_MAP.get(unit, unit)


def normalize_price(value: object) -> int:
    if value is None:
        return 0
    if isinstance(value, (int, float)):
        return max(0, int(round(float(value))))
    text = str(value).strip().replace(",", ".")
    try:
        return max(0, int(round(float(text))))
    except ValueError:
        return 0


def classify_category(title: str, subcategory: str | None) -> str:
    hay = f"{title} {subcategory or ''}".lower()
    for category, keywords in CATEGORY_RULES:
        if any(keyword in hay for keyword in keywords):
            return category
    return "other"


def is_import_barcode(barcode: str) -> bool:
    if len(barcode) == 13 and barcode.startswith(("460", "462", "469", "487")):
        return False
    if len(barcode) == 13:
        return True
    return False


def stable_popular(title: str, price: int) -> int:
    digest = hashlib.sha1(title.encode("utf-8")).hexdigest()
    base = int(digest[:4], 16) % 70
    if price <= 500:
        base += 15
    elif price <= 1500:
        base += 8
    return min(99, 20 + base)


def build_product(
    row_id: int,
    title: str,
    barcode: str,
    sell_price: int,
    unit: str,
    supplier: str | None,
    subcategory: str | None,
) -> dict:
    category = classify_category(title, subcategory)
    meta = CATEGORY_META[category]
    buy_hint = f" Жеткізуші: {supplier}." if supplier else ""
    return {
        "id": row_id,
        "title": title,
        "category": category,
        "icon": meta["icon"],
        "price": sell_price,
        "oldPrice": None,
        "unit": unit,
        "badge": None,
        "delivery": "today",
        "type": "import" if is_import_barcode(barcode) else "local",
        "popular": stable_popular(title, sell_price),
        "rating": 4.4,
        "stock": "Бар",
        "tags": ["Тимур", meta["title"]],
        "desc": f"Тимур дүкенінің нақты тауары. Штрихкод: {barcode}.{buy_hint}",
        "barcode": barcode,
        "supplier": supplier or None,
    }


def pick_suggested_ids(products: list[dict], limit: int = 8) -> list[int]:
    picks: list[int] = []
    seen_categories: set[str] = set()
    for product in sorted(products, key=lambda item: (-item["popular"], item["price"])):
        if product["category"] in seen_categories:
            continue
        seen_categories.add(product["category"])
        picks.append(product["id"])
        if len(picks) >= limit:
            break
    if len(picks) < limit:
        for product in products:
            if product["id"] not in picks:
                picks.append(product["id"])
            if len(picks) >= limit:
                break
    return picks


def load_rows(xlsx_path: Path) -> list[dict]:
    try:
        import openpyxl
    except ImportError as exc:
        raise SystemExit("openpyxl керек: pip install openpyxl") from exc

    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.active
    products: list[dict] = []
    skipped = 0
    for idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=1):
        cells = list(row) + [None] * 15
        title = normalize_title(cells[0])
        barcode = normalize_barcode(cells[1])
        sell_price = normalize_price(cells[5])
        unit = normalize_unit(cells[6])
        supplier = normalize_title(cells[11]) or None
        subcategory = normalize_title(cells[14]) or None
        if not title or sell_price <= 0 or not barcode:
            skipped += 1
            continue
        products.append(
            build_product(idx, title, barcode, sell_price, unit, supplier, subcategory)
        )
    wb.close()
    return products, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description="Тимур Excel → supermarket-site/data/products.json")
    parser.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX, help="Excel экспорт файлы")
    parser.add_argument("--out", type=Path, default=OUT_JSON, help="Шығыс JSON")
    args = parser.parse_args()

    if not args.xlsx.is_file():
        raise SystemExit(f"Excel табылмады: {args.xlsx}")

    products, skipped = load_rows(args.xlsx)
    category_counts: dict[str, int] = {}
    for product in products:
        category_counts[product["category"]] = category_counts.get(product["category"], 0) + 1

    payload = {
        "store": "Тимур",
        "sourceFile": args.xlsx.name,
        "exportedAt": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "totalProducts": len(products),
        "skippedRows": skipped,
        "categoryCounts": category_counts,
        "suggestedIds": pick_suggested_ids(products),
        "products": products,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    size_mb = args.out.stat().st_size / (1024 * 1024)
    print(f"OK: {len(products)} products -> {args.out} ({size_mb:.2f} MB), skipped={skipped}")
    print("categories:", category_counts)


if __name__ == "__main__":
    main()
