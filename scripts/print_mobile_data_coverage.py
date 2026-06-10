#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mobile production data coverage snapshot."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _count_enrichment() -> dict[str, int]:
    path = ROOT / "mobile" / "src" / "data" / "mosqueDetailsEnrichment.ts"
    text = path.read_text(encoding="utf-8").split("export function", 1)[0]
    ids = re.findall(r'"(\d{8,})"\s*:', text)
    confidence = {
        "verified": len(re.findall(r'confidence:\s*"verified"', text)),
        "partial": len(re.findall(r'confidence:\s*"partial"', text)),
        "map_only": len(re.findall(r'confidence:\s*"map_only"', text)),
    }
    confidence["total"] = len(ids)
    return confidence


def main() -> int:
    mosques = _load_json(ROOT / "mobile" / "assets" / "bundled" / "mosques-2gis-kz.json")
    halal_seed = _load_json(ROOT / "mobile" / "assets" / "bundled" / "halal-products-seed-kz.json")
    mosque_count = int(mosques.get("count") or len(mosques.get("mosques") or []))
    enrichment = _count_enrichment()
    seed_items = halal_seed.get("items") or halal_seed.get("products") or []
    seed_count = len(seed_items) if isinstance(seed_items, list) else 0

    print("Mobile data coverage")
    print(f"- mosque_2gis_total: {mosque_count}")
    print(f"- mosque_enrichment_total: {enrichment['total']}")
    print(f"- mosque_effective_status_coverage: {mosque_count} (explicit enrichment + default map_only fallback)")
    print(f"- mosque_enrichment_verified: {enrichment['verified']}")
    print(f"- mosque_enrichment_partial: {enrichment['partial']}")
    print(f"- mosque_enrichment_map_only: {enrichment['map_only']}")
    print(f"- halal_seed_products: {seed_count}")
    print("")
    print("Mosque enrichment queue:")
    print("  python scripts/build_mosque_enrichment_queue.py --limit 200")
    print("  DGIS_API_KEY=... python scripts/sync_2gis_mosques_kz.py")
    print("")
    print("Official HalalDamu products API monitor:")
    print("  python scripts/check_halaldamu_products_api.py --json-out data/halaldamu-products-monitor.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

