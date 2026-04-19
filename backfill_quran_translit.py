# -*- coding: utf-8 -*-
import argparse
import sqlite3

from config.settings import QURAN_TRANSLIT_STYLE
from services.quran_translit import transliterate_arabic_to_kazakh


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Fill missing quran.translit using transliterate_arabic_to_kazakh (canonical step 2: "
            "after koran.kz import). Set QURAN_TRANSLIT_STYLE=pedagogical in .env for Fatiha preset + spaced style."
        )
    )
    parser.add_argument(
        "--db",
        default="/root/bot/raqat_bot/global_clean.db",
        help="SQLite database path",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of rows to update, 0 means all",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Rewrite existing translit values too",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show how many rows would be updated without saving",
    )
    return parser.parse_args()


def build_where_clause(force: bool) -> str:
    if force:
        return "WHERE text_ar IS NOT NULL AND TRIM(text_ar) <> ''"
    return (
        "WHERE text_ar IS NOT NULL "
        "AND TRIM(text_ar) <> '' "
        "AND (translit IS NULL OR TRIM(translit) = '')"
    )


def main():
    args = parse_args()
    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    try:
        where_clause = build_where_clause(args.force)
        limit_clause = f" LIMIT {args.limit}" if args.limit else ""

        rows = conn.execute(
            f"""
            SELECT id, surah, ayah, text_ar, translit
            FROM quran
            {where_clause}
            ORDER BY id
            {limit_clause}
            """
        ).fetchall()

        print(f"Rows selected: {len(rows)}")
        if not rows:
            return

        updates = []
        for row in rows:
            translit = transliterate_arabic_to_kazakh(
                row["text_ar"],
                surah=int(row["surah"]),
                ayah=int(row["ayah"]),
                style=QURAN_TRANSLIT_STYLE,
            )
            if not translit:
                continue
            if not args.force and (row["translit"] or "").strip():
                continue
            updates.append((translit, row["id"]))

        print(f"Rows to update: {len(updates)}")
        if args.dry_run or not updates:
            return

        conn.executemany(
            "UPDATE quran SET translit = ?, updated_at = datetime('now') WHERE id = ?",
            updates,
        )
        conn.commit()
        print("Done.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
