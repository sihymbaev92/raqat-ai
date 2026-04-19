# -*- coding: utf-8 -*-
import sqlite3

DB_PATH = "/root/bot/raqat_bot/global_clean.db"

SQL = """
DROP TRIGGER IF EXISTS hadith_ai_after_insert;
DROP TRIGGER IF EXISTS hadith_ai_after_update;
DROP TRIGGER IF EXISTS hadith_ai_after_delete;
DROP TABLE IF EXISTS hadith_fts;

CREATE VIRTUAL TABLE hadith_fts
USING fts5(
    hadith_id UNINDEXED,
    source,
    grade,
    text_ar,
    text_kk,
    text_en
);
"""


def main():
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(SQL)
        conn.execute(
            """
            INSERT INTO hadith_fts(hadith_id, source, grade, text_ar, text_kk, text_en)
            SELECT id, COALESCE(source,''), COALESCE(grade,''), COALESCE(text_ar,''), COALESCE(text_kk,''), COALESCE(text_en,'')
            FROM hadith
            """
        )
        count = conn.execute("SELECT COUNT(*) FROM hadith_fts").fetchone()[0]
        print(f"hadith_fts rows: {count}")
        conn.commit()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
