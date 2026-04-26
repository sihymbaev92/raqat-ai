#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Құран translit күйі: бос жолдар және алгоритмнен ауытқулар (мысалы koran.kz импорты)."""
import argparse
import os
import sqlite3
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from services.quran_translit import transliterate_arabic_to_kazakh  # noqa: E402


def _has_translit_column(conn: sqlite3.Connection) -> bool:
    cols = conn.execute("PRAGMA table_info(quran)").fetchall()
    return any(str(r[1]) == "translit" for r in cols)


def main() -> int:
    p = argparse.ArgumentParser(description="Quran translit coverage / provenance stats")
    p.add_argument("--db", default=os.path.join(_ROOT, "global_clean.db"))
    args = p.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    if not _has_translit_column(conn):
        conn.close()
        print("quran.translit бағаны бұл DB сұлбасында жоқ.")
        print("Ескерту: транскрипция қолданбада runtime алгоритмімен жасалады.")
        return 0
    rows = conn.execute(
        "SELECT surah, ayah, text_ar, translit FROM quran ORDER BY surah, ayah"
    ).fetchall()
    conn.close()

    n = len(rows)
    empty = 0
    diff_algo = 0
    for r in rows:
        got = (r["translit"] or "").strip()
        if not got:
            empty += 1
            continue
        exp = transliterate_arabic_to_kazakh(r["text_ar"] or "")
        if exp != got:
            diff_algo += 1

    print(f"quran rows:              {n}")
    print(f"empty translit:          {empty}")
    print(f"differs from algorithm:  {diff_algo}  (koran.kz / қолмен түзету)")
    print(f"matches algorithm only:  {n - empty - diff_algo}")
    if empty:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
