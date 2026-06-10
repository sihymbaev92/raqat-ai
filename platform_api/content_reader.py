# -*- coding: utf-8 -*-
"""Құран/хадис оқу: SQLite (әдепкі) немесе PostgreSQL (`DATABASE_URL` / reader DSN)."""
from __future__ import annotations

import hashlib
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Iterator

from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection, is_sqlite_connection, table_names
from db.get_db import get_db_reader, is_postgresql_configured
from db.hadith_repeat import hadith_unique_only_sql_suffix
from db_reader import resolve_db_path


@contextmanager
def _ro_sqlite() -> Iterator[sqlite3.Connection]:
    path = resolve_db_path()
    uri = f"file:{path}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def _content_conn() -> Iterator[Any]:
    if is_postgresql_configured():
        with get_db_reader() as conn:
            yield conn
    else:
        with _ro_sqlite() as conn:
            yield conn


def _table_columns(conn: Any, table: str) -> set[str]:
    t = table.lower()
    if is_sqlite_connection(conn):
        rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
        return {str(row[1]).lower() for row in rows}
    if is_psycopg_connection(conn):
        rows = conn.execute(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND lower(table_name) = %s
            """,
            (t,),
        ).fetchall()
        return {str(r["column_name"]).lower() for r in rows}
    return set()


def normalize_since_sqlite(since_iso: str) -> str | None:
    s = (since_iso or "").strip()
    if not s:
        return None
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def metadata_diff_for_since(since: str | None) -> dict[str, Any]:
    """
    Инкременттік өзгерістер тізімі (updated_at бар болса).
    since — ISO8601; салыстыру үшін нормализацияланады.
    """
    out: dict[str, Any] = {
        "incremental_diff_available": False,
        "since_invalid": False,
        "since_normalized_sqlite": None,
        "quran_changed": [],
        "hadith_changed": [],
    }
    if not since or not str(since).strip():
        return out
    sn = normalize_since_sqlite(str(since))
    if not sn:
        out["since_invalid"] = True
        return out
    with _content_conn() as conn:
        tables = table_names(conn)
        qcols = _table_columns(conn, "quran") if "quran" in tables else set()
        hcols = _table_columns(conn, "hadith") if "hadith" in tables else set()
        if "updated_at" not in qcols and "updated_at" not in hcols:
            return out
        out["incremental_diff_available"] = True
        out["since_normalized_sqlite"] = sn
        if "updated_at" in qcols:
            if is_psycopg_connection(conn):
                rows = conn.execute(
                    """
                    SELECT surah, ayah
                    FROM quran
                    WHERE updated_at > %s::timestamp
                    ORDER BY updated_at, surah, ayah
                    LIMIT 2000
                    """,
                    (sn,),
                ).fetchall()
            else:
                rows = _exec(
                    conn,
                    """
                    SELECT surah, ayah
                    FROM quran
                    WHERE datetime(updated_at) > datetime(?)
                    ORDER BY datetime(updated_at), surah, ayah
                    LIMIT 2000
                    """,
                    (sn,),
                ).fetchall()
            out["quran_changed"] = [{"surah": int(r["surah"]), "ayah": int(r["ayah"])} for r in rows]
        if "updated_at" in hcols:
            if is_psycopg_connection(conn):
                rows = conn.execute(
                    """
                    SELECT id
                    FROM hadith
                    WHERE updated_at > %s::timestamp
                    ORDER BY updated_at, id
                    LIMIT 2000
                    """,
                    (sn,),
                ).fetchall()
            else:
                rows = _exec(
                    conn,
                    """
                    SELECT id
                    FROM hadith
                    WHERE datetime(updated_at) > datetime(?)
                    ORDER BY datetime(updated_at), id
                    LIMIT 2000
                    """,
                    (sn,),
                ).fetchall()
            out["hadith_changed"] = [int(r["id"]) for r in rows]
    return out


def quran_surah_index() -> list[dict[str, Any]]:
    with _content_conn() as conn:
        rows = _exec(
            conn,
            """
            SELECT surah, COUNT(*) AS ayah_count,
                   MAX(NULLIF(TRIM(COALESCE(surah_name, '')), '')) AS title
            FROM quran
            GROUP BY surah
            ORDER BY surah
            """,
            (),
        ).fetchall()
    return [
        {"surah": int(r["surah"]), "ayah_count": int(r["ayah_count"]), "title": r["title"] or None}
        for r in rows
    ]


def quran_surah_slice(surah: int, from_ayah: int | None, to_ayah: int | None) -> list[dict[str, Any]]:
    with _content_conn() as conn:
        where = "surah = ?"
        params: list[Any] = [surah]
        if from_ayah is not None:
            where += " AND ayah >= ?"
            params.append(from_ayah)
        if to_ayah is not None:
            where += " AND ayah <= ?"
            params.append(to_ayah)
        rows = _exec(
            conn,
            f"""
            SELECT id, surah, ayah, surah_name, text_ar, text_kk, text_ru, text_en, translit
            FROM quran
            WHERE {where}
            ORDER BY ayah
            LIMIT 400
            """,
            tuple(params),
        ).fetchall()
    return [dict(r) for r in rows]


def quran_one_ayah(surah: int, ayah: int) -> dict[str, Any] | None:
    with _content_conn() as conn:
        row = _exec(
            conn,
            """
            SELECT id, surah, ayah, surah_name, text_ar, text_kk, text_ru, text_en, translit
            FROM quran WHERE surah = ? AND ayah = ?
            """,
            (surah, ayah),
        ).fetchone()
    return dict(row) if row else None


def _hadith_select_columns(conn: Any) -> str:
    cols = _table_columns(conn, "hadith")
    base = [c for c in ("id", "source", "text_ar", "text_kk", "text_ru", "text_en", "grade") if c in cols]
    for c in (
        "is_repeated",
        "original_id",
        "text_kk_literal",
        "text_kk_clean",
        "text_kk_explanation",
        "translation_status",
        "quality_score",
        "reviewed_by",
        "review_notes",
        "hadith_no",
        "chapter",
        "is_sahih",
        "kk_source_site",
        "kk_source_url",
    ):
        if c in cols:
            base.append(c)
    return ", ".join(base)


def hadith_by_id(hadith_id: int) -> dict[str, Any] | None:
    with _content_conn() as conn:
        sel = _hadith_select_columns(conn)
        row = _exec(
            conn,
            f"""
            SELECT {sel}
            FROM hadith WHERE id = ?
            """,
            (hadith_id,),
        ).fetchone()
    return dict(row) if row else None


def _norm_lang_col(lang: str) -> str:
    t = (lang or "").strip().lower()
    if t == "kk":
        return "text_kk"
    if t == "ru":
        return "text_ru"
    if t == "en":
        return "text_en"
    return "text_en"


def _hadith_lang_col(conn: Any, lang: str) -> str:
    """Тіл бағанасы кестеде жоқ болса (мысалы text_en жоқ SQLite), қолжетімді аудармаға ауысады."""
    want = _norm_lang_col(lang)
    cols = _table_columns(conn, "hadith")
    if want in cols:
        return want
    for fallback in ("text_kk", "text_ru", "text_en", "text_ar"):
        if fallback in cols:
            return fallback
    return "text_ar"


def hadith_random_for_source(
    source: str,
    *,
    strict_sahih: bool,
    lang: str = "kk",
    unique_only: bool = True,
) -> dict[str, Any] | None:
    where = "source = ?"
    params: list[Any] = [source]
    if strict_sahih:
        where += " AND POSITION('sahih' IN lower(COALESCE(grade, ''))) > 0"
    with _content_conn() as conn:
        col = _hadith_lang_col(conn, lang)
        if unique_only:
            where += hadith_unique_only_sql_suffix(conn)
        row = _exec(
            conn,
            f"""
            SELECT id, source, text_ar, {col} AS text_tr, grade
            FROM hadith
            WHERE {where}
            ORDER BY RANDOM()
            LIMIT 1
            """,
            tuple(params),
        ).fetchone()
    return dict(row) if row else None


def hadith_random_any(
    *,
    strict_sahih: bool,
    lang: str = "kk",
    unique_only: bool = True,
) -> dict[str, Any] | None:
    """Барлық дереккөз бойынша кездейсоқ хадис (source сүзгісі жоқ)."""
    where = "1=1"
    if strict_sahih:
        where += " AND POSITION('sahih' IN lower(COALESCE(grade, ''))) > 0"
    with _content_conn() as conn:
        col = _hadith_lang_col(conn, lang)
        if unique_only:
            where += hadith_unique_only_sql_suffix(conn)
        row = _exec(
            conn,
            f"""
            SELECT id, source, text_ar, {col} AS text_tr, grade
            FROM hadith
            WHERE {where}
            ORDER BY RANDOM()
            LIMIT 1
            """,
            (),
        ).fetchone()
    return dict(row) if row else None


def hadith_search(
    query: str,
    *,
    lang: str = "kk",
    limit: int = 60,
    unique_only: bool = True,
) -> list[dict[str, Any]]:
    from content_search_core import hadith_search as _hadith_search_sa

    return _hadith_search_sa(query, lang=lang, limit=limit, unique_only=unique_only)


def quran_search(query: str, *, lang: str = "kk", include_translit: bool = True, limit: int = 5) -> list[dict[str, Any]]:
    from content_search_core import quran_search as _quran_search_sa

    return _quran_search_sa(query, lang=lang, include_translit=include_translit, limit=limit)


def content_fingerprint_v1() -> tuple[str, dict[str, Any]]:
    """(etag_token, meta) — жол саны + текст ұзындығы + MAX(updated_at) (бар болса)."""
    with _content_conn() as conn:
        q = _exec(
            conn,
            "SELECT COUNT(*) AS c, COALESCE(SUM(LENGTH(COALESCE(text_ar,''))),0) AS sl FROM quran",
            (),
        ).fetchone()
        h = _exec(
            conn,
            "SELECT COUNT(*) AS c, COALESCE(SUM(LENGTH(COALESCE(text_ar,''))),0) AS sl FROM hadith",
            (),
        ).fetchone()
        qcols = _table_columns(conn, "quran")
        hcols = _table_columns(conn, "hadith")
        q_max_u = ""
        if "updated_at" in qcols:
            row = _exec(
                conn,
                "SELECT COALESCE(CAST(MAX(updated_at) AS TEXT), '') AS m FROM quran",
                (),
            ).fetchone()
            q_max_u = str(row["m"] or "")
        h_max_u = ""
        if "updated_at" in hcols:
            row = _exec(
                conn,
                "SELECT COALESCE(CAST(MAX(updated_at) AS TEXT), '') AS m FROM hadith",
                (),
            ).fetchone()
            h_max_u = str(row["m"] or "")
    raw = (
        f"q:{int(q['c'])}:{int(q['sl'])}|h:{int(h['c'])}:{int(h['sl'])}"
        f"|qmaxu:{q_max_u}|hmaxu:{h_max_u}"
    )
    token = hashlib.md5(raw.encode("utf-8")).hexdigest()
    meta = {
        "quran_rows": int(q["c"]),
        "quran_text_ar_sumlen": int(q["sl"]),
        "hadith_rows": int(h["c"]),
        "hadith_text_ar_sumlen": int(h["sl"]),
        "quran_max_updated_at": q_max_u or None,
        "hadith_max_updated_at": h_max_u or None,
        "fingerprint_raw": raw,
    }
    return token, meta
