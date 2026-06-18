#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Хадис қазақша аудармасын (textKk) бандл JSON бойынша тексеру.

  .venv/bin/python scripts/hadith_translation_check.py
  .venv/bin/python scripts/hadith_translation_check.py --json path/to/hadith-from-db.json

SQLite бойынша жалпы статистика (барлық сахих жолдар):

  .venv/bin/python scripts/hadith_corpus_sync.py stats --db global_clean.db
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

DEFAULT_BUNDLE = ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db.json"
RUNTIME_SEED_BUNDLE = ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db-seed.json"

from services.hadith_kk_quality import (  # noqa: E402
    cyrillic_to_arabic_letter_ratio,
    find_arabic_isnad_leakage_ids,
)


def _stdio_utf8() -> None:
    """Windows cp1251 консолында қазақша print үшін UTF-8 (қате болмаса өткіземіз)."""
    if sys.platform != "win32":
        return
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except Exception:
                pass


def default_bundle_path() -> Path:
    return DEFAULT_BUNDLE if DEFAULT_BUNDLE.is_file() else RUNTIME_SEED_BUNDLE


def main() -> int:
    _stdio_utf8()
    p = argparse.ArgumentParser(description="Hadith textKk sanity check on JSON bundle")
    p.add_argument(
        "--json",
        type=Path,
        default=default_bundle_path(),
        help="HadithCorpus JSON (version 3)",
    )
    p.add_argument("--list-leakage", action="store_true", help="Print all arabic-isnad-in-textKk ids")
    p.add_argument("--strict", action="store_true", help="Exit non-zero if quality thresholds fail.")
    p.add_argument("--max-weak-ratio", type=float, default=0.02, help="Allowed weak ratio in strict mode.")
    args = p.parse_args()

    path: Path = args.json
    if not path.is_file():
        print(f"Файл жоқ: {path}", file=sys.stderr)
        return 1

    data = json.loads(path.read_text(encoding="utf-8"))
    hadiths = data.get("hadiths")
    if not isinstance(hadiths, list):
        print("JSON: hadiths тізім емес", file=sys.stderr)
        return 1

    total = len(hadiths)
    empty_kk = sum(1 for h in hadiths if not str((h or {}).get("textKk") or "").strip())
    empty_ar = sum(1 for h in hadiths if not str((h or {}).get("arabic") or "").strip())
    source_only = sum(1 for h in hadiths if bool((h or {}).get("sourceOnly")))
    all_source_only = total > 0 and source_only == total
    source_only_with_kk = sum(
        1 for h in hadiths if bool((h or {}).get("sourceOnly")) and str((h or {}).get("textKk") or "").strip()
    )
    source_only_missing_citation = sum(
        1 for h in hadiths if bool((h or {}).get("sourceOnly")) and not str((h or {}).get("sourceCitationKk") or "").strip()
    )
    provenance = data.get("provenance") if isinstance(data.get("provenance"), dict) else {}
    provenance_text = " ".join(
        str(provenance.get(k) or "") for k in ("origin", "evidenceKk", "licenseHint") if isinstance(provenance, dict)
    )
    provenance_lc = provenance_text.lower()
    source_only_provenance_ok = (not all_source_only) or (
        "source-only" in provenance_lc
        and (
            "жарияланбайды" in provenance_lc
            or "not bundled" in provenance_lc
            or "intentionally not bundled" in provenance_lc
        )
    )
    leakage = find_arabic_isnad_leakage_ids(hadiths)

    weak = 0
    n_long = 0
    for h in hadiths:
        kk = (h or {}).get("textKk") or ""
        if len(kk) < 40:
            continue
        n_long += 1
        cy, ar = cyrillic_to_arabic_letter_ratio(kk if isinstance(kk, str) else None)
        if cy < ar * 3:
            weak += 1
    weak_pct = (100.0 * weak / n_long) if n_long else 0.0

    print(f"Файл: {path}")
    print(f"Нұсқа: {data.get('version')!r}, жолдар: {total}")
    print(f"Бос textKk:        {empty_kk}")
    print(f"Бос arabic:        {empty_ar}")
    print(f"Source-only:       {source_only}/{total}")
    if source_only:
        print(f"Source-only textKk leak: {source_only_with_kk}")
        print(f"Source-only citation жоқ: {source_only_missing_citation}")
        print(f"Source-only provenance: {'OK' if source_only_provenance_ok else 'MISSING'}")
    print(f"Араб иснад textKk: {len(leakage)} id")
    print(f"Кирилл «әлсіз» (cy<ar*3, len≥40): {weak}/{n_long} ({weak_pct:.2f}%)")
    if args.list_leakage and leakage:
        print("\nid тізімі:")
        for hid in leakage:
            print(f"  {hid}")
    if args.strict:
        if empty_ar > 0 or len(leakage) > 0:
            return 2
        if all_source_only:
            if source_only_with_kk > 0 or source_only_missing_citation > 0 or not source_only_provenance_ok:
                return 2
            return 0
        if empty_kk > 0:
            return 2
        ratio = (weak / n_long) if n_long else 0.0
        if ratio > float(args.max_weak_ratio):
            return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
