#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Транскрипция сапасын тексеру (араб қалдықтары жоқ). Қалағанда алгоритммен салыстыру."""
import argparse
import os
import re
import sqlite3
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from services.quran_translit import transliterate_arabic_to_kazakh


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--db", default="/root/bot/raqat_bot/global_clean.db")
    p.add_argument(
        "--expect-algorithm",
        action="store_true",
        help="Әр аят transliterate_arabic_to_kazakh() нәтижесіне толық сәйкес болу керек (koran.kz импортыndan кейін өшіріңіз)",
    )
    p.add_argument(
        "--check-triple",
        action="store_true",
        help="Бір әріптің үш рет қайталануын қате деп тексеру (koran.kz транскрипциясында ұзын дауыстар әдетте ii/aa сияқты болады — әдепкіде өшік)",
    )
    args = p.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, surah, ayah, text_ar, translit FROM quran ORDER BY surah, ayah"
    ).fetchall()
    conn.close()

    mismatches = []
    bad_chars = []

    for row in rows:
        t_ar = row["text_ar"] or ""
        got = (row["translit"] or "").strip()
        if args.expect_algorithm:
            expected = transliterate_arabic_to_kazakh(t_ar)
            if expected != got:
                mismatches.append(
                    (row["surah"], row["ayah"], got[:72], expected[:72])
                )
        if got and re.search(r"[\u0600-\u06FF]", got):
            bad_chars.append((row["surah"], row["ayah"], got[:80]))
        if got and re.search(r"[a-zA-Z]", got):
            bad_chars.append((row["surah"], row["ayah"], got[:80]))
        if args.check_triple and got and re.search(r"(.)\1\1", got):
            bad_chars.append((row["surah"], row["ayah"], "triple:" + got[:80]))

    print(f"ayahs checked: {len(rows)}")
    if args.expect_algorithm:
        print(f"mismatch vs transliterate_arabic_to_kazakh: {len(mismatches)}")
    else:
        print("algorithm equality check: skipped (use --expect-algorithm to enable)")
    label = "Arabic/Latin/triple in translit" if args.check_triple else "Arabic/Latin in translit"
    print(f"rows with {label}: {len(bad_chars)}")

    if mismatches and args.expect_algorithm:
        print("\nfirst mismatches:")
        for m in mismatches[:12]:
            print(f"  surah={m[0]} ayah={m[1]}")
            print(f"    db: {m[2]}")
            print(f"    ok: {m[3]}")

    if bad_chars:
        print("\nfirst bad char rows:")
        for b in bad_chars[:8]:
            print(f"  surah={b[0]} ayah={b[1]} {b[2]!r}")

    if bad_chars:
        return 1
    if args.expect_algorithm and mismatches:
        return 1
    print("OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
