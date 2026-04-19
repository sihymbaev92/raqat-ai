# -*- coding: utf-8 -*-
"""Құран қазақша мағынасының тексерілген аударма дереккөзін оқу (quran_kk_provenance)."""
from __future__ import annotations

import sqlite3

from db.connection import db_conn


def get_quran_kk_attribution(db_path: str) -> tuple[str | None, str | None]:
    """(attribution_kk, source_detail) немесе екеуі де None."""
    try:
        with db_conn(db_path) as conn:
            row = conn.execute(
                "SELECT attribution_kk, source_detail FROM quran_kk_provenance WHERE id = 1"
            ).fetchone()
    except sqlite3.OperationalError:
        return None, None
    if not row:
        return None, None
    a = (row["attribution_kk"] or "").strip() or None
    d = (row["source_detail"] or "").strip() or None
    return a, d
