# -*- coding: utf-8 -*-
"""Құран/хадис іздеу — SQLAlchemy Core (шикі SQL орнына)."""
from __future__ import annotations

from contextlib import contextmanager
from functools import lru_cache
from typing import Any, Iterator

from sqlalchemy import MetaData, Table, and_, create_engine, func, or_, select
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.pool import NullPool

from content_reader import _norm_lang_col

_CONTENT_ENGINES: dict[str, Engine] = {}


@lru_cache(maxsize=2)
def _content_engine_cached(dsn_key: str) -> Engine:
    if dsn_key.startswith("sqlite:///"):
        engine = create_engine(dsn_key, future=True, poolclass=NullPool)
    else:
        engine = create_engine(dsn_key, future=True)
    _CONTENT_ENGINES[dsn_key] = engine
    return engine


def dispose_content_search_engines() -> None:
    for engine in list(_CONTENT_ENGINES.values()):
        engine.dispose()
    _CONTENT_ENGINES.clear()
    _content_engine_cached.cache_clear()


def _content_dsn_key() -> str:
    from db.get_db import is_postgresql_configured, postgresql_dsn
    from db_reader import resolve_db_path

    if is_postgresql_configured():
        return postgresql_dsn()
    path = resolve_db_path()
    return f"sqlite:///{path.as_posix()}"


@contextmanager
def _sa_conn() -> Iterator[Connection]:
    engine = _content_engine_cached(_content_dsn_key())
    with engine.connect() as conn:
        yield conn


def _reflect_table(conn: Connection, name: str) -> Table | None:
    md = MetaData()
    try:
        return Table(name, md, autoload_with=conn)
    except Exception:
        return None


def _hadith_lang_col_name(hadith: Table, lang: str) -> str:
    want = _norm_lang_col(lang)
    names = {c.name for c in hadith.columns}
    if want in names:
        return want
    for fallback in ("text_kk", "text_ru", "text_en", "text_ar"):
        if fallback in names:
            return fallback
    return "text_ar"


def quran_search(
    query: str,
    *,
    lang: str = "kk",
    include_translit: bool = True,
    limit: int = 5,
) -> list[dict[str, Any]]:
    token = f"%{(query or '').strip()}%"
    if token == "%%":
        return []
    col_name = _norm_lang_col(lang)
    cap = int(max(1, min(limit, 100)))

    with _sa_conn() as conn:
        quran = _reflect_table(conn, "quran")
        if quran is None:
            return []
        names = {c.name for c in quran.columns}
        preds: list[Any] = []
        out_cols: list[Any] = [quran.c.surah, quran.c.ayah, quran.c.text_ar]
        if col_name in names and col_name != "text_ar":
            preds.append(quran.c[col_name].ilike(token))
            out_cols.append(quran.c[col_name].label("text_tr"))
        preds.append(quran.c.text_ar.ilike(token))
        if include_translit and "translit" in names:
            preds.append(quran.c.translit.ilike(token))
            out_cols.append(quran.c.translit)
        stmt = (
            select(*out_cols)
            .where(or_(*preds))
            .order_by(quran.c.surah, quran.c.ayah)
            .limit(cap)
        )
        rows = conn.execute(stmt).mappings().all()
    return [dict(r) for r in rows]


def hadith_search(
    query: str,
    *,
    lang: str = "kk",
    limit: int = 60,
    unique_only: bool = True,
) -> list[dict[str, Any]]:
    token = f"%{(query or '').strip()}%"
    if token == "%%":
        return []
    cap = int(max(1, min(limit, 200)))

    with _sa_conn() as conn:
        hadith = _reflect_table(conn, "hadith")
        if hadith is None:
            return []
        names = {c.name for c in hadith.columns}
        col_name = _hadith_lang_col_name(hadith, lang)
        search_names: list[str] = [col_name]
        for name in ("text_en", "text_ru", "text_kk", "text_ar"):
            if name in names and name not in search_names:
                search_names.append(name)
        text_preds = [hadith.c[n].ilike(token) for n in search_names]

        select_bits: list[Any] = [hadith.c[col_name].label("text_tr")]
        for c in (
            "text_kk_literal",
            "text_kk_clean",
            "text_kk_explanation",
            "translation_status",
            "quality_score",
            "is_sahih",
        ):
            if c in names:
                select_bits.append(hadith.c[c])

        where_parts: list[Any] = [or_(*text_preds)]
        if unique_only and "is_repeated" in names:
            where_parts.append(func.coalesce(hadith.c.is_repeated, 0) == 0)

        stmt = (
            select(
                hadith.c.id,
                hadith.c.source,
                hadith.c.text_ar,
                hadith.c.grade,
                *select_bits,
            )
            .where(and_(*where_parts))
            .limit(cap)
        )
        rows = conn.execute(stmt).mappings().all()
    return [dict(r) for r in rows]
