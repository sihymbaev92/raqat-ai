# -*- coding: utf-8 -*-
from config.settings import DB_PATH, ALLOWED_TEXT_COLS
from db.connection import db_conn
from services.language_service import preferred_hadith_columns

def get_hadith_columns():
    with db_conn(DB_PATH) as conn:
        cur = conn.execute("PRAGMA table_info(hadith)")
        return [row[1] for row in cur.fetchall()]

def _column_has_content(column: str) -> bool:
    with db_conn(DB_PATH) as conn:
        row = conn.execute(
            f"""
            SELECT SUM(CASE WHEN TRIM(COALESCE({column}, '')) <> '' THEN 1 ELSE 0 END) AS filled
            FROM hadith
            """
        ).fetchone()
    return bool((row["filled"] if row else 0) or 0)


def choose_hadith_text_column(lang: str = "kk"):
    existing_cols = get_hadith_columns()

    for col in preferred_hadith_columns(lang):
        if col in existing_cols and col in ALLOWED_TEXT_COLS and _column_has_content(col):
            return col

    for col in ["text_kk", "text_kz", "text_ru", "text_en", "text_ar"]:
        if col in existing_cols and col in ALLOWED_TEXT_COLS and _column_has_content(col):
            return col

    return None


def resolve_hadith_text_choice(lang: str = "kk") -> dict[str, str | None]:
    requested = preferred_hadith_columns(lang)[0]
    actual = choose_hadith_text_column(lang)
    return {
        "requested": requested,
        "actual": actual,
    }

def get_random_hadith(lang: str = "kk"):
    col = choose_hadith_text_column(lang)
    if not col:
        return None

    query = f"""
        SELECT source, text_ar, {col} AS text_tr
        FROM hadith
        ORDER BY RANDOM()
        LIMIT 1
    """

    with db_conn(DB_PATH) as conn:
        return conn.execute(query).fetchone()
