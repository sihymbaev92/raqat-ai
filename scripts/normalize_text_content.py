# -*- coding: utf-8 -*-
import os
import sqlite3
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from services.text_cleanup import clean_text_content

DB_PATH = os.path.join(BASE_DIR, "global_clean.db")
TABLE_COLUMNS = {
    "quran": ("text_ar", "text_kk", "text_ru", "text_en", "translit"),
    "hadith": ("text_ar", "text_kk", "text_ru", "text_en"),
}


def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    total_updates = 0

    try:
        for table, columns in TABLE_COLUMNS.items():
            ids = [row["id"] for row in conn.execute(f"SELECT id FROM {table}")]
            for row_id in ids:
                row = conn.execute(
                    f"SELECT id, {', '.join(columns)} FROM {table} WHERE id = ?",
                    (row_id,),
                ).fetchone()
                updates = {}
                for column in columns:
                    cleaned = clean_text_content(row[column])
                    if cleaned != (row[column] or ""):
                        updates[column] = cleaned
                if not updates:
                    continue

                sets = ", ".join(f"{column} = ?" for column in updates)
                conn.execute(
                    f"UPDATE {table} SET {sets} WHERE id = ?",
                    (*updates.values(), row_id),
                )
                total_updates += 1
        conn.commit()
        print(f"normalized_rows={total_updates}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
