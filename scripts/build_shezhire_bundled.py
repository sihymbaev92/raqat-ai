# -*- coding: utf-8 -*-
"""Бар шежіре деректерін біріктіріп genealogy-p0.json құрастыру."""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

OUT = os.path.join(ROOT, "mobile", "assets", "bundled", "genealogy-p0.json")


def main() -> int:
    from db.shezhire_catalog_builder import build_bundled_snapshot

    snap = build_bundled_snapshot()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(snap, f, ensure_ascii=False, indent=2)

    levels: dict[int, int] = {}
    for n in snap["nodes"]:
        levels[n["level"]] = levels.get(n["level"], 0) + 1
    print("OK", OUT)
    print("  nodes:", len(snap["nodes"]), "| persons:", len(snap.get("persons") or []))
    print("  version:", snap["version"], "| levels:", dict(sorted(levels.items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
