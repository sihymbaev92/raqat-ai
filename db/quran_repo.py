# -*- coding: utf-8 -*-
from config.settings import DB_PATH
from db.connection import db_conn
from services.language_service import preferred_quran_columns

def get_quran_columns():
    with db_conn(DB_PATH) as conn:
        cur = conn.execute("PRAGMA table_info(quran)")
        return [row[1] for row in cur.fetchall()]

def _column_has_content(column: str) -> bool:
    with db_conn(DB_PATH) as conn:
        row = conn.execute(
            f"""
            SELECT SUM(CASE WHEN TRIM(COALESCE({column}, '')) <> '' THEN 1 ELSE 0 END) AS filled
            FROM quran
            """
        ).fetchone()
    return bool((row["filled"] if row else 0) or 0)


def choose_quran_text_column(lang: str = "kk"):
    cols = get_quran_columns()
    for col in preferred_quran_columns(lang):
        if col in cols and _column_has_content(col):
            return col
    return None


def resolve_quran_text_choice(lang: str = "kk") -> dict[str, str | None]:
    requested = preferred_quran_columns(lang)[0]
    actual = choose_quran_text_column(lang)
    return {
        "requested": requested,
        "actual": actual,
    }

def choose_surah_column():
    cols = get_quran_columns()
    if "surah_id" in cols:
        return "surah_id"
    if "surah" in cols:
        return "surah"
    return None

def choose_ayah_column():
    cols = get_quran_columns()
    if "ayah_id" in cols:
        return "ayah_id"
    if "ayah" in cols:
        return "ayah"
    return None

def search_quran(text: str, limit: int = 3):
    text_col = choose_quran_text_column()
    surah_col = choose_surah_column()
    ayah_col = choose_ayah_column()

    if not text_col or not surah_col or not ayah_col:
        return None

    query = f"""
        SELECT *,
               {text_col} AS txt,
               {surah_col} AS sid,
               {ayah_col} AS aid
        FROM quran
        WHERE {text_col} LIKE ?
        LIMIT ?
    """

    with db_conn(DB_PATH) as conn:
        return conn.execute(query, (f"%{text}%", limit)).fetchall()
