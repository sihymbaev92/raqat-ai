#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""halaldamu.kz companies API → жергілікті кэш (supermarket halal join үшін)."""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "data" / "halaldamu-companies-cache.json"
ORIGIN = "https://halaldamu.kz"
UA = "Raqat-Halal-Companies-Cache/1.0 (+https://rahatomir.com)"


def http_json(url: str, timeout: float = 45.0) -> dict | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception as exc:
        print(f"WARN fetch {url}: {exc}", file=sys.stderr)
        return None


def clean_title(raw: str) -> str:
    text = html.unescape(raw or "")
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize(text: str) -> list[str]:
    text = clean_title(text).lower()
    text = re.sub(r"[«»\"'—–-]+", " ", text)
    parts = re.findall(r"[a-zа-яёқғңүұіһәө0-9]{3,}", text, flags=re.I)
    return [p.lower() for p in parts if len(p) >= 3]


def fetch_all_companies(per_page: int = 100, delay_s: float = 0.15) -> list[dict]:
    items: list[dict] = []
    page = 1
    total_pages = 1
    while page <= total_pages:
        qs = urllib.parse.urlencode({"per_page": str(per_page), "page": str(page)})
        url = f"{ORIGIN}/wp-json/halal-bot/v1/companies?{qs}"
        data = http_json(url)
        if not isinstance(data, dict):
            break
        batch = data.get("items") or []
        if not batch:
            break
        for row in batch:
            if not isinstance(row, dict):
                continue
            title = clean_title(str(row.get("title") or ""))
            legal = clean_title(str(row.get("legal_name") or ""))
            cert = str(row.get("certificate_status") or "").strip().lower()
            tokens = sorted(set(tokenize(title) + tokenize(legal)))
            items.append(
                {
                    "id": row.get("id"),
                    "title": title,
                    "legalName": legal,
                    "slug": row.get("slug"),
                    "certificateStatus": cert,
                    "tokens": tokens,
                }
            )
        total = int(data.get("total") or 0)
        total_pages = max(1, (total + per_page - 1) // per_page) if total else page
        print(f"  page {page}/{total_pages} (+{len(batch)})", flush=True)
        page += 1
        time.sleep(delay_s)
    return items


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch halaldamu companies cache")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--per-page", type=int, default=100)
    parser.add_argument("--delay", type=float, default=0.12)
    args = parser.parse_args()

    print("Fetching halaldamu companies...")
    companies = fetch_all_companies(per_page=args.per_page, delay_s=args.delay)
    active = sum(1 for c in companies if c.get("certificateStatus") == "active")
    payload = {
        "fetchedAt": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "origin": ORIGIN,
        "total": len(companies),
        "activeCount": active,
        "companies": companies,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK: {len(companies)} companies ({active} active) -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
