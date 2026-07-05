#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тимур supermarket-site/data/products.json — әр тауарға сурет URL (Open Food Facts + іздеу).
Кэш: supermarket-site/data/image-cache.json (қайта іске қосуға болады).
"""
from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_JSON = ROOT / "supermarket-site" / "data" / "products.json"
CACHE_JSON = ROOT / "supermarket-site" / "data" / "image-cache.json"
UA = "Timur-Supermarket-ImageBot/1.0 (+https://rahatomir.com/supermarket/)"
OFF_PRODUCT = "https://world.openfoodfacts.org/api/v2/product/{code}.json"
OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl"

_cache_lock = Lock()


def http_json(url: str, timeout: float = 25.0) -> dict | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return None


def pick_image_url(payload: dict | None) -> str | None:
    if not payload:
        return None
    product = payload.get("product") if isinstance(payload.get("product"), dict) else payload
    if not isinstance(product, dict):
        return None
    for key in (
        "image_front_small_url",
        "image_front_url",
        "image_url",
        "image_small_url",
    ):
        url = (product.get(key) or "").strip()
        if url.startswith("http"):
            return url
    return None


def barcode_candidates(raw: str) -> list[str]:
    digits = re.sub(r"\D", "", raw or "")
    if not digits:
        return []
    out: list[str] = []
    for candidate in (
        digits,
        digits.zfill(13) if len(digits) <= 13 else "",
        f"0{digits}" if len(digits) == 12 else "",
        f"0{digits}" if len(digits) == 11 else "",
    ):
        if candidate and candidate not in out and 8 <= len(candidate) <= 14:
            out.append(candidate)
    return out


def off_by_barcode(barcode: str) -> str | None:
    for code in barcode_candidates(barcode):
        url = OFF_PRODUCT.format(code=urllib.parse.quote(code))
        url += "?fields=code,product_name,image_front_small_url,image_front_url,image_url"
        data = http_json(url)
        if data and data.get("status") == 1:
            img = pick_image_url(data)
            if img:
                return img
    return None


def off_by_title(title: str) -> str | None:
    query = re.sub(r"\s+", " ", (title or "").strip())
    if len(query) < 3:
        return None
    words = query.split()[:4]
    params = {
        "search_terms": " ".join(words),
        "search_simple": "1",
        "action": "process",
        "json": "1",
        "page_size": "3",
        "fields": "code,product_name,image_front_small_url,image_front_url,image_url",
    }
    url = f"{OFF_SEARCH}?{urllib.parse.urlencode(params)}"
    data = http_json(url)
    if not isinstance(data, dict):
        return None
    products = data.get("products") or []
    title_l = query.lower()
    for row in products:
        if not isinstance(row, dict):
            continue
        name = (row.get("product_name") or "").lower()
        img = pick_image_url(row)
        if not img:
            continue
        if name and (title_l in name or name in title_l or words[0].lower() in name):
            return img
    if products:
        return pick_image_url(products[0])
    return None


def category_fallback(category: str) -> str:
    return f"./assets/fallback/{category or 'other'}.svg"


def load_cache() -> dict[str, str]:
    if not CACHE_JSON.is_file():
        return {}
    try:
        data = json.loads(CACHE_JSON.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE_JSON.parent.mkdir(parents=True, exist_ok=True)
    CACHE_JSON.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def cache_key(product: dict) -> str:
    return f"{product.get('barcode','')}|{product.get('title','')}"


def resolve_image(product: dict, cache: dict[str, str], *, allow_search: bool) -> tuple[str, str]:
    """Returns (imageUrl, source)."""
    key = cache_key(product)
    if key in cache:
        return cache[key], "cache"

    barcode = str(product.get("barcode") or "")
    title = str(product.get("title") or "")
    category = str(product.get("category") or "other")

    img = off_by_barcode(barcode)
    if img:
        return img, "off_barcode"

    if allow_search:
        img = off_by_title(title)
        if img:
            return img, "off_search"

    return category_fallback(category), "fallback"


def enrich_products(
    products: list[dict],
    cache: dict[str, str],
    *,
    allow_search: bool,
    workers: int,
    delay_s: float,
) -> dict[str, int]:
    stats = {"off_barcode": 0, "off_search": 0, "fallback": 0, "cache": 0, "total": 0}

    def task(product: dict) -> tuple[dict, str, str]:
        time.sleep(delay_s)
        url, source = resolve_image(product, cache, allow_search=allow_search)
        with _cache_lock:
            cache[cache_key(product)] = url
        return product, url, source

    pending = [p for p in products if not (p.get("imageUrl") or "").startswith("http")]
    stats["total"] = len(products)

    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        futures = [pool.submit(task, p) for p in pending]
        done = 0
        for fut in as_completed(futures):
            product, url, source = fut.result()
            product["imageUrl"] = url
            product["imageSource"] = source
            stats[source] = stats.get(source, 0) + 1
            done += 1
            if done % 200 == 0:
                save_cache(cache)
                print(f"  ... {done}/{len(pending)}", flush=True)

    for product in products:
        if (product.get("imageUrl") or "").startswith("http"):
            continue
        key = cache_key(product)
        if key in cache:
            product["imageUrl"] = cache[key]
            product["imageSource"] = "cache"
            continue
        url, source = resolve_image(product, cache, allow_search=allow_search)
        product["imageUrl"] = url
        product["imageSource"] = source
        cache[key] = url
        stats[source] = stats.get(source, 0) + 1

    save_cache(cache)
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Тимур каталогына сурет URL қосу")
    parser.add_argument("--json", type=Path, default=PRODUCTS_JSON)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--delay", type=float, default=0.12, help="Секунд/тауар (OFF rate limit)")
    parser.add_argument("--no-search", action="store_true", help="Тек штрихкод бойынша")
    parser.add_argument("--limit", type=int, default=0, help="Тест: тек алғаш N тауар")
    args = parser.parse_args()

    if not args.json.is_file():
        raise SystemExit(f"JSON табылмады: {args.json}")

    payload = json.loads(args.json.read_text(encoding="utf-8"))
    products = payload.get("products") or []
    if not isinstance(products, list):
        raise SystemExit("products массиві жоқ")

    if args.limit > 0:
        products = products[: args.limit]

    cache = load_cache()
    print(f"Enriching {len(products)} products (workers={args.workers}, search={not args.no_search})...")
    t0 = time.time()
    stats = enrich_products(
        products,
        cache,
        allow_search=not args.no_search,
        workers=args.workers,
        delay_s=max(0.0, args.delay),
    )
    payload["products"] = products
    payload["imageEnrichedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    payload["imageStats"] = stats
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    args.json.write_bytes(text.encode("utf-8"))
    elapsed = time.time() - t0
    print(f"OK in {elapsed:.0f}s: {stats}")
    print(f"Saved -> {args.json}")


if __name__ == "__main__":
    main()
