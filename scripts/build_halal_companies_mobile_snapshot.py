#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""halaldamu.kz companies → mobile bundled snapshot (instant Halal hub first paint)."""
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
DEFAULT_OUT = ROOT / "mobile" / "assets" / "bundled" / "halal-companies-snapshot.json"
ORIGIN = "https://halaldamu.kz"
UA = "Raqat-Halal-Mobile-Snapshot/1.0 (+https://rahatomir.com)"


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


def pick_lat_lon(row: dict) -> tuple[float | None, float | None]:
    lat = row.get("lat")
    lon = row.get("lon")
    try:
        if lat is not None and lon is not None:
            la, lo = float(lat), float(lon)
            if -90 <= la <= 90 and -180 <= lo <= 180:
                return la, lo
    except (TypeError, ValueError):
        pass
    return None, None


def slim_row(row: dict) -> dict | None:
    if not isinstance(row, dict):
        return None
    cid = row.get("id")
    try:
        company_id = int(cid)
    except (TypeError, ValueError):
        return None
    if company_id <= 0:
        return None
    title = clean_title(str(row.get("title") or ""))
    if not title:
        return None
    legal = clean_title(str(row.get("legal_name") or "")) or None
    slug = str(row.get("slug") or "").strip() or None
    cert = str(row.get("certificate_status") or "").strip().lower() or None
    cat = str(row.get("category_type") or "").strip() or None
    address = str(row.get("address") or "").strip() or None
    lat, lon = pick_lat_lon(row)
    out: dict = {"id": company_id, "title": title}
    if legal:
        out["legalName"] = legal
    if slug:
        out["slug"] = slug
    if cert:
        out["certificateStatus"] = cert
    if cat:
        out["categoryType"] = cat
    if address:
        out["address"] = address
    if lat is not None and lon is not None:
        out["lat"] = lat
        out["lon"] = lon
    return out


def fetch_all_companies(per_page: int = 100, delay_s: float = 0.12) -> list[dict]:
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
            slim = slim_row(row)
            if slim:
                items.append(slim)
        total = int(data.get("total") or 0)
        total_pages = max(1, (total + per_page - 1) // per_page) if total else page
        print(f"  page {page}/{total_pages} (+{len(batch)}) total={len(items)}", flush=True)
        page += 1
        if page <= total_pages:
            time.sleep(delay_s)
    return items


def main() -> int:
    parser = argparse.ArgumentParser(description="Build mobile halal companies snapshot JSON")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--per-page", type=int, default=100)
    args = parser.parse_args()

    print(f"Fetching companies from {ORIGIN} …", flush=True)
    companies = fetch_all_companies(per_page=max(1, min(100, args.per_page)))
    if not companies:
        print("ERROR: no companies fetched", file=sys.stderr)
        return 1

    payload = {
        "version": 1,
        "syncedAt": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "origin": ORIGIN,
        "total": len(companies),
        "items": companies,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    args.out.write_text(raw, encoding="utf-8")
    kb = len(raw.encode("utf-8")) / 1024
    print(f"Wrote {len(companies)} companies → {args.out} ({kb:.0f} KiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
