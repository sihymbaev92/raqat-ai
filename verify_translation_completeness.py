# -*- coding: utf-8 -*-
"""
Бір реттік тексеру: Құран қазақшасы, транскрипция, хадис қалдықтары.
Шығару: мәселе болса exit code 1 (Құран кемі бар), хадис тек есеп.
"""
from __future__ import annotations

import argparse
import sqlite3
import sys

from config.settings import DB_PATH


def parse_args():
    p = argparse.ArgumentParser(description="Verify Quran/Hadith translation coverage.")
    p.add_argument("--db", default=DB_PATH)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    ok = True
    print("=== Quran ===")
    row = conn.execute(
        """
        SELECT
            COUNT(*) AS n,
            SUM(CASE WHEN TRIM(COALESCE(text_ar,''))<>'' AND TRIM(COALESCE(text_kk,''))='' THEN 1 ELSE 0 END) AS miss_kk,
            SUM(CASE WHEN TRIM(COALESCE(text_ar,''))<>'' AND TRIM(COALESCE(translit,''))='' THEN 1 ELSE 0 END) AS miss_tr,
            SUM(CASE WHEN instr(COALESCE(translit,''), char(0x6e9)) > 0 THEN 1 ELSE 0 END) AS sajda_in_tr
        FROM quran
        """
    ).fetchone()
    n, miss_kk, miss_tr, sajda = (
        int(row["n"] or 0),
        int(row["miss_kk"] or 0),
        int(row["miss_tr"] or 0),
        int(row["sajda_in_tr"] or 0),
    )
    print(f"  ayahs total     : {n}")
    print(f"  text_kk missing : {miss_kk}")
    print(f"  translit missing: {miss_tr}")
    print(f"  translit with ۩  : {sajda}")
    if miss_kk or miss_tr or sajda:
        ok = False

    print("\n=== Hadith (Arabic present, Kazakh empty) ===")
    miss = conn.execute(
        """
        SELECT COUNT(*) FROM hadith
        WHERE TRIM(COALESCE(text_ar,''))<>'' AND (text_kk IS NULL OR TRIM(text_kk)='')
        """
    ).fetchone()[0]
    print(f"  rows missing text_kk: {int(miss)}")

    print("\n  Top sources (missing kk):")
    rows = conn.execute(
        """
        SELECT source, COUNT(*) AS c
        FROM hadith
        WHERE TRIM(COALESCE(text_ar,''))<>'' AND (text_kk IS NULL OR TRIM(text_kk)='')
        GROUP BY source
        ORDER BY c DESC
        LIMIT 12
        """
    ).fetchall()
    for r in rows:
        print(f"    {r['c']:>5}  {r['source']}")

    conn.close()
    print()
    if ok:
        print("Quran checks: OK.")
    else:
        print("Quran checks: FAILED — run translate_quran_kk_batch.py / backfill_quran_translit.py")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
