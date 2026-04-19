# -*- coding: utf-8 -*-
import argparse
import sqlite3

from config.settings import DB_PATH


def parse_args():
    parser = argparse.ArgumentParser(description="Show Quran Kazakh translation coverage.")
    parser.add_argument("--db", default=DB_PATH, help="SQLite database path")
    parser.add_argument(
        "--limit",
        type=int,
        default=15,
        help="How many incomplete surahs to print",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    try:
        overall = conn.execute(
            """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN TRIM(COALESCE(text_kk, '')) <> '' THEN 1 ELSE 0 END) AS kk_filled,
                SUM(CASE WHEN TRIM(COALESCE(translit, '')) <> '' THEN 1 ELSE 0 END) AS translit_filled
            FROM quran
            """
        ).fetchone()

        print("Quran coverage")
        print(f"total ayahs      : {overall['total']}")
        print(f"kk filled        : {overall['kk_filled']}")
        print(f"kk missing       : {overall['total'] - overall['kk_filled']}")
        print(f"translit filled  : {overall['translit_filled']}")
        print()

        rows = conn.execute(
            """
            SELECT
                surah,
                COUNT(*) AS total_ayahs,
                SUM(CASE WHEN TRIM(COALESCE(text_kk, '')) <> '' THEN 1 ELSE 0 END) AS kk_filled
            FROM quran
            GROUP BY surah
            HAVING kk_filled < total_ayahs
            ORDER BY surah
            LIMIT ?
            """,
            (args.limit,),
        ).fetchall()

        print("Incomplete surahs")
        for row in rows:
            print(
                f"surah {row['surah']:>3}: "
                f"{row['kk_filled']:>3}/{row['total_ayahs']:<3} translated"
            )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
