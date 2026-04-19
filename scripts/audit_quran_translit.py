#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""6224 аяттың translit бағанасын тексеру: бос, араб/латын қалдық, алгоритмнен ауытқу."""
from __future__ import annotations

import argparse
import os
import re
import sqlite3
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from services.quran_translit import transliterate_arabic_to_kazakh  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser(description="Audit quran.translit for all 114 surahs")
    p.add_argument("--db", default=os.path.join(_ROOT, "global_clean.db"))
    p.add_argument(
        "--list-mismatch",
        type=int,
        metavar="N",
        default=0,
        help="Print first N (surah,ayah) where DB translit != default algorithm",
    )
    args = p.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT surah, ayah, text_ar, translit FROM quran ORDER BY surah, ayah"
    ).fetchall()
    conn.close()

    n = len(rows)
    empty = []
    arab = []
    latin = []
    diff_algo = []

    for r in rows:
        t = (r["translit"] or "").strip()
        if not t:
            empty.append((r["surah"], r["ayah"]))
            continue
        if re.search(r"[\u0600-\u06FF]", t):
            arab.append((r["surah"], r["ayah"]))
        if re.search(r"[a-zA-Z]", t):
            latin.append((r["surah"], r["ayah"]))
        exp = transliterate_arabic_to_kazakh(r["text_ar"] or "")
        if exp != t:
            diff_algo.append((r["surah"], r["ayah"]))

    print(f"rows:                 {n}")
    print(f"empty translit:       {len(empty)}")
    print(f"Arabic chars in tr:   {len(arab)}  {arab[:8] if arab else ''}")
    print(f"Latin a-z in tr:      {len(latin)}  {latin[:8] if latin else ''}")
    print(f"differs from algorithm: {len(diff_algo)}  (koran.kz / қолмен / басқа стиль)")
    print(f"matches algorithm:      {n - len(empty) - len(diff_algo)}")

    if args.list_mismatch > 0 and diff_algo:
        print(f"\nfirst {args.list_mismatch} algorithm mismatches (surah, ayah):")
        for pair in diff_algo[: args.list_mismatch]:
            print(f"  {pair[0]}:{pair[1]}")

    if empty or arab or latin:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
