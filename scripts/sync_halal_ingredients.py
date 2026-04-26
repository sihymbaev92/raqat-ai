#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path("/root/bot/raqat_bot")
SEED_CSV = ROOT / "data" / "halal_ingredients_seed.csv"

# OpenFoodFacts taxonomy (public source, read-only usage)
OFF_ADDITIVES_URL = "https://static.openfoodfacts.org/data/taxonomies/additives.json"


def _normalize_key(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())


def _guess_risk_from_off(name: str) -> str | None:
    n = name.lower()
    haram_tokens = ("carmine", "cochineal", "ethanol", "alcohol", "wine", "beer")
    mushkil_tokens = (
        "gelatin",
        "lecithin",
        "diglyceride",
        "monoglyceride",
        "stearate",
        "shellac",
        "rennet",
        "cysteine",
    )
    if any(t in n for t in haram_tokens):
        return "HARAM"
    if any(t in n for t in mushkil_tokens):
        return "MUSHKIL"
    return None


def _load_existing_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    rows: list[dict[str, str]] = []
    with path.open("r", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            risk = (row.get("risk") or "").strip().upper()
            key = _normalize_key(row.get("key") or "")
            label_kk = (row.get("label_kk") or "").strip()
            if risk in {"HARAM", "MUSHKIL"} and key and label_kk:
                rows.append({"risk": risk, "key": key, "label_kk": label_kk})
    return rows


def _fetch_off_additives() -> list[dict[str, str]]:
    req = urllib.request.Request(OFF_ADDITIVES_URL, headers={"User-Agent": "raqat-halal-sync/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    out: list[dict[str, str]] = []
    for code, obj in data.items():
        if not isinstance(code, str) or not isinstance(obj, dict):
            continue
        names = obj.get("name") or {}
        if not isinstance(names, dict):
            continue
        en = names.get("en")
        if not isinstance(en, str) or not en.strip():
            continue
        risk = _guess_risk_from_off(en)
        if risk is None:
            continue
        key = _normalize_key(code.replace("en:", "").replace("_", " "))
        # Keep label neutral because OFF doesn't provide fiqh ruling.
        label_kk = f"{en.strip()} (көзі/құрамы тексерілсін)"
        out.append({"risk": risk, "key": key, "label_kk": label_kk})
    return out


def _merge_rows(base: list[dict[str, str]], extra: list[dict[str, str]]) -> list[dict[str, str]]:
    by_sig = {(r["risk"], r["key"]): r for r in base}
    for r in extra:
        by_sig[(r["risk"], r["key"])] = r
    merged = list(by_sig.values())
    merged.sort(key=lambda x: (x["risk"], x["key"]))
    return merged


def _write_rows(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["risk", "key", "label_kk"])
        w.writeheader()
        w.writerows(rows)


def main() -> None:
    ap = argparse.ArgumentParser(description="Sync halal ingredient seed CSV from online sources.")
    ap.add_argument("--csv", default=str(SEED_CSV), help="Target seed CSV path")
    ap.add_argument("--dry-run", action="store_true", help="Preview only, don't write file")
    args = ap.parse_args()

    csv_path = Path(args.csv)
    base = _load_existing_rows(csv_path)
    fetched = _fetch_off_additives()
    merged = _merge_rows(base, fetched)

    print(f"existing rows: {len(base)}")
    print(f"fetched rows : {len(fetched)}")
    print(f"merged rows  : {len(merged)}")

    if args.dry_run:
        return
    _write_rows(csv_path, merged)
    print(f"written: {csv_path}")


if __name__ == "__main__":
    main()
