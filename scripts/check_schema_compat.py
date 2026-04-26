#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Project DB schema compatibility quick-check."""
from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path


def _table_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return {str(r[1]) for r in rows}


def main() -> int:
    p = argparse.ArgumentParser(description="Check schema compatibility for content scripts")
    p.add_argument("--db", default=str(Path(__file__).resolve().parents[1] / "global_clean.db"))
    args = p.parse_args()

    db_path = Path(args.db)
    if not db_path.is_file():
        print(f"DB табылмады: {db_path}")
        return 1

    conn = sqlite3.connect(str(db_path))
    try:
        quran_cols = _table_columns(conn, "quran")
        hadith_cols = _table_columns(conn, "hadith")
    finally:
        conn.close()

    print(f"DB: {db_path}")
    print("\n[quran]")
    print(f"- has text_ar: {'text_ar' in quran_cols}")
    print(f"- has text_kk: {'text_kk' in quran_cols}")
    print(f"- has translit: {'translit' in quran_cols}")
    if "translit" not in quran_cols:
        print("  info: quran translit DB-аудиттері skip режимде жұмыс істейді (runtime translit).")

    print("\n[hadith]")
    print(f"- has text_ar: {'text_ar' in hadith_cols}")
    print(f"- has text_kk: {'text_kk' in hadith_cols}")
    print(f"- has updated_at: {'updated_at' in hadith_cols}")
    if "updated_at" not in hadith_cols:
        print("  info: hadith review скрипті now() timestamp жаңартуын өткізіп жібереді.")

    required_hadith = {"id", "source", "text_ar", "text_kk"}
    required_quran = {"id", "surah", "ayah", "text_ar"}
    missing_hadith = sorted(required_hadith - hadith_cols)
    missing_quran = sorted(required_quran - quran_cols)
    if missing_hadith or missing_quran:
        print("\n[errors]")
        if missing_hadith:
            print(f"- hadith missing: {', '.join(missing_hadith)}")
        if missing_quran:
            print(f"- quran missing: {', '.join(missing_quran)}")
        return 1

    print("\nSchema check: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

