#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
halaldamu.kz products API мониторинг — CI/cron үшін.

Мысалы:
  python scripts/check_halaldamu_products_api.py
  python scripts/check_halaldamu_products_api.py --json-out data/halaldamu-products-monitor.json
  python scripts/check_halaldamu_products_api.py --fail-if-empty

Exit codes:
  0 — products total > 0 (немесе --fail-if-empty жоқ)
  1 — products бос (--fail-if-empty)
  2 — желілік/parse қатесі
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

DEFAULT_ORIGIN = "https://halaldamu.kz"
DEFAULT_PROXY = "https://api.rahatomir.com/api/v1/halal-damu"
USER_AGENT = "Raqat-Halal-Monitor/1.0 (+https://rahatomir.com)"


def _fetch_json(url: str, timeout: float = 45.0) -> tuple[int, dict[str, Any] | None, str | None]:
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            status = int(resp.status)
    except HTTPError as exc:
        try:
            raw = exc.read().decode("utf-8", errors="replace")
            body = json.loads(raw) if raw.strip() else None
        except Exception:
            body = None
        return int(exc.code), body, f"http_{exc.code}"
    except URLError as exc:
        return 0, None, str(exc.reason or exc)
    except Exception as exc:
        return 0, None, str(exc)[:200]
    try:
        data = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as exc:
        return status, None, f"json:{exc}"
    return status, data if isinstance(data, dict) else {"raw": data}, None


def _items_total(payload: dict[str, Any] | None) -> tuple[int, int]:
    if not payload:
        return 0, 0
    items = payload.get("items")
    if not isinstance(items, list):
        return 0, 0
    total_raw = payload.get("total")
    total = int(total_raw) if isinstance(total_raw, (int, float)) else len(items)
    return len(items), total


def _check_endpoint(base: str, path: str, query: dict[str, str]) -> dict[str, Any]:
    qs = urlencode(query)
    url = f"{base.rstrip('/')}/{path.lstrip('/')}" + (f"?{qs}" if qs else "")
    t0 = time.perf_counter()
    status, payload, err = _fetch_json(url)
    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    item_count, total = _items_total(payload)
    return {
        "url": url,
        "http_status": status,
        "success": bool(payload.get("success")) if payload else False,
        "items_len": item_count,
        "total": total,
        "error": err,
        "elapsed_ms": elapsed_ms,
    }


def build_report(
    *,
    origin: str,
    proxy_base: str | None,
    search_term: str,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    companies = _check_endpoint(origin, "/wp-json/halal-bot/v1/companies", {"per_page": "1", "page": "1"})
    products_list = _check_endpoint(origin, "/wp-json/halal-bot/v1/products", {"per_page": "5", "page": "1"})
    products_search = _check_endpoint(
        origin,
        "/wp-json/halal-bot/v1/products",
        {"search": search_term, "per_page": "5", "page": "1"},
    )
    additives = _check_endpoint(origin, "/wp-json/halal-bot/v1/additives", {"search": "e471", "per_page": "3"})

    proxy_products: dict[str, Any] | None = None
    if proxy_base:
        proxy_products = _check_endpoint(
            proxy_base,
            "halal-bot/v1/products",
            {"search": search_term, "per_page": "5", "page": "1"},
        )

    products_ok = (
        products_list["total"] > 0
        or products_search["total"] > 0
        or (proxy_products is not None and proxy_products.get("total", 0) > 0)
    )

    return {
        "checked_at": now,
        "origin": origin,
        "proxy_base": proxy_base,
        "search_term": search_term,
        "products_api_has_data": products_ok,
        "companies": companies,
        "products_list": products_list,
        "products_search": products_search,
        "products_search_proxy": proxy_products,
        "additives_sample": additives,
        "recommendation_kk": (
            "Өнімдер API жұмыс істейді — мобильді штрихкод/өнім іздеуін қосуға болады."
            if products_ok
            else "Өнімдер API әлі бос — тек ұйымдар + additives + AI тексеру; halaldamu.kz-ға хат жіберу."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="halaldamu.kz products API monitor")
    parser.add_argument("--origin", default=os.getenv("HALAL_DAMU_ORIGIN", DEFAULT_ORIGIN))
    parser.add_argument(
        "--proxy-base",
        default=os.getenv("RAQAT_HALAL_PROXY_BASE", DEFAULT_PROXY),
        help="Бос болса — тек тікелей origin",
    )
    parser.add_argument("--search", default="сүт", help="products search сынағы")
    parser.add_argument("--json-out", default="", help="JSON есеп файлы")
    parser.add_argument(
        "--fail-if-empty",
        action="store_true",
        help="products total=0 болса exit 1",
    )
    args = parser.parse_args()

    proxy = (args.proxy_base or "").strip() or None
    report = build_report(origin=args.origin.strip(), proxy_base=proxy, search_term=args.search.strip())

    lines = [
        f"checked_at: {report['checked_at']}",
        f"products_api_has_data: {report['products_api_has_data']}",
        f"companies HTTP {report['companies']['http_status']} total≈{report['companies']['total']}",
        f"products (list) HTTP {report['products_list']['http_status']} total={report['products_list']['total']} items={report['products_list']['items_len']}",
        f"products (search={args.search!r}) HTTP {report['products_search']['http_status']} total={report['products_search']['total']}",
    ]
    if proxy:
        pp = report.get("products_search_proxy") or {}
        lines.append(f"products (proxy search) HTTP {pp.get('http_status')} total={pp.get('total')}")
    lines.append(report["recommendation_kk"])

    print("\n".join(lines))

    if args.json_out:
        out = Path(args.json_out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"\nWrote {out}")

    if report["companies"]["http_status"] == 0 or report["products_list"]["http_status"] == 0:
        return 2
    if args.fail_if_empty and not report["products_api_has_data"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
