#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validate curated KMDB hadith excerpt bundles shipped in the mobile app.

Raw scraped-hadith-muftyat.json is build input only — UI reads extracted + external bundles.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / "mobile" / "assets" / "bundled" / "extracted-hadith-muftyat.json"
EXTERNAL = ROOT / "mobile" / "assets" / "bundled" / "external-hadith-kk.json"
RAW = ROOT / "mobile" / "assets" / "bundled" / "scraped-hadith-muftyat.json"

MIN_EXTRACTED = 80
MIN_EXTERNAL = 12
MIN_TOTAL = 100
MIN_TEXT_LEN = 18
MAX_TEXT_LEN = 4000
URL_RE = re.compile(r"^https?://", re.I)
GARBAGE = re.compile(r"[\u0100-\u024F\u0300-\u036F]")


def load_json(path: Path) -> dict:
    if not path.is_file():
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def validate_items(items: list[dict], *, label: str, errors: list[str]) -> None:
    seen_ids: set[str] = set()
    for i, item in enumerate(items):
        item_id = (item.get("id") or "").strip()
        title = (item.get("title") or "").strip()
        text = (item.get("text") or "").strip()
        url = (item.get("sourceUrl") or "").strip()
        if not item_id:
            errors.append(f"{label}[{i}]: missing id")
            continue
        if item_id in seen_ids:
            errors.append(f"{label}: duplicate id {item_id}")
        seen_ids.add(item_id)
        if not title:
            errors.append(f"{label} {item_id}: missing title")
        if len(text) < MIN_TEXT_LEN:
            errors.append(f"{label} {item_id}: text too short ({len(text)})")
        if len(text) > MAX_TEXT_LEN:
            errors.append(f"{label} {item_id}: text too long ({len(text)})")
        if not URL_RE.match(url):
            errors.append(f"{label} {item_id}: invalid sourceUrl")
        if len(GARBAGE.findall(text)) / max(len(text), 1) > 0.06:
            errors.append(f"{label} {item_id}: high garbage ratio")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true", help="fail on threshold miss")
    args = parser.parse_args()

    errors: list[str] = []
    extracted = load_json(EXTRACTED)
    external = load_json(EXTERNAL)
    raw = load_json(RAW) if RAW.is_file() else {"itemCount": 0, "items": []}

    extracted_items = extracted.get("items") or []
    external_items = external.get("items") or []
    total = len(extracted_items) + len(external_items)

    if len(extracted_items) < MIN_EXTRACTED:
        errors.append(f"extracted items {len(extracted_items)} < min {MIN_EXTRACTED}")
    if len(external_items) < MIN_EXTERNAL:
        errors.append(f"external items {len(external_items)} < min {MIN_EXTERNAL}")
    if total < MIN_TOTAL:
        errors.append(f"total curated items {total} < min {MIN_TOTAL}")

    if extracted.get("itemCount") != len(extracted_items):
        errors.append("extracted itemCount mismatch")
    if external.get("itemCount") != len(external_items):
        errors.append("external itemCount mismatch")

    validate_items(extracted_items, label="extracted", errors=errors)
    validate_items(external_items, label="external", errors=errors)

    stats = {
        "ok": not errors,
        "curatedTotal": total,
        "extracted": len(extracted_items),
        "external": len(external_items),
        "rawArchiveItems": len(raw.get("items") or []),
        "delivery": "offline_bundled",
        "refreshPolicy": "release_pipeline_only",
        "errors": errors,
    }
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    if errors and args.strict:
        return 1
    return 0


if __name__ == "__main__":
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
