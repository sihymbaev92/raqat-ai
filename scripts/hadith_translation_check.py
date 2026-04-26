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

from services.hadith_kk_quality import (  # noqa: E402
    cyrillic_to_arabic_letter_ratio,
    find_arabic_isnad_leakage_ids,
)


def main() -> int:
    p = argparse.ArgumentParser(description="Hadith textKk sanity check on JSON bundle")
    p.add_argument(
        "--json",
        type=Path,
        default=ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db.json",
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
    print(f"Араб иснад textKk: {len(leakage)} id")
    print(f"Кирилл «әлсіз» (cy<ar*3, len≥40): {weak}/{n_long} ({weak_pct:.2f}%)")
    if args.list_leakage and leakage:
        print("\nid тізімі:")
        for hid in leakage:
            print(f"  {hid}")
    if args.strict:
        if empty_kk > 0 or empty_ar > 0 or len(leakage) > 0:
            return 2
        ratio = (weak / n_long) if n_long else 0.0
        if ratio > float(args.max_weak_ratio):
            return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
