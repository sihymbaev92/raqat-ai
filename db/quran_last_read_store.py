# -*- coding: utf-8 -*-
"""Платформа пайдаланушысының Құран соңғы оқу нүктесі (JSON)."""
from __future__ import annotations

import json
from typing import Any

from db.dialect_sql import execute as _exec
from db.get_db import get_db


def _empty_state() -> dict[str, Any]:
    return {"global": None, "by_surah": {}}


def _normalize_state(raw: dict[str, Any] | None) -> dict[str, Any]:
    if not raw or not isinstance(raw, dict):
        return _empty_state()
    global_block = raw.get("global")
    g: dict[str, Any] | None = None
    if isinstance(global_block, dict):
        try:
            surah = int(global_block.get("surah", 0))
            ayah = int(global_block.get("ayah", 0))
            ts = str(global_block.get("ts") or "")
            if 1 <= surah <= 114 and ayah >= 1 and ts:
                g = {"surah": surah, "ayah": ayah, "ts": ts}
        except (TypeError, ValueError):
            g = None
    by_surah: dict[str, int] = {}
    src = raw.get("by_surah")
    if isinstance(src, dict):
        for k, v in src.items():
            try:
                n = int(v)
                if n > 0:
                    by_surah[str(k)] = n
            except (TypeError, ValueError):
                continue
    return {"global": g, "by_surah": by_surah}


def _row_to_state(row: Any) -> tuple[dict[str, Any], str | None]:
    if not row:
        return _empty_state(), None
    try:
        js = str(row["state_json"])
        upd = str(row["updated_at"])
    except Exception:
        js = str(row[0])
        upd = str(row[1])
    try:
        parsed = json.loads(js)
        if not isinstance(parsed, dict):
            return _empty_state(), upd
        return _normalize_state(parsed), upd
    except Exception:
        return _empty_state(), upd


def get_quran_last_read(platform_user_id: str) -> tuple[dict[str, Any], str | None]:
    pid = (platform_user_id or "").strip()
    if not pid:
        return _empty_state(), None
    with get_db() as conn:
        row = _exec(
            conn,
            """
            SELECT state_json, updated_at FROM platform_quran_last_read
            WHERE platform_user_id = ? LIMIT 1
            """,
            (pid,),
        ).fetchone()
    return _row_to_state(row)


def put_quran_last_read(platform_user_id: str, state: dict[str, Any]) -> str:
    pid = (platform_user_id or "").strip()
    if not pid:
        raise ValueError("empty_platform_user_id")
    norm = _normalize_state(state)
    payload = json.dumps(norm, separators=(",", ":"), ensure_ascii=False)
    with get_db() as conn:
        ex = _exec(
            conn,
            "SELECT 1 FROM platform_quran_last_read WHERE platform_user_id = ? LIMIT 1",
            (pid,),
        ).fetchone()
        if ex:
            _exec(
                conn,
                """
                UPDATE platform_quran_last_read
                SET state_json = ?, updated_at = datetime('now')
                WHERE platform_user_id = ?
                """,
                (payload, pid),
            )
        else:
            _exec(
                conn,
                """
                INSERT INTO platform_quran_last_read (platform_user_id, state_json, updated_at)
                VALUES (?, ?, datetime('now'))
                """,
                (pid, payload),
            )
        row = _exec(
            conn,
            "SELECT updated_at FROM platform_quran_last_read WHERE platform_user_id = ? LIMIT 1",
            (pid,),
        ).fetchone()
    if not row:
        return ""
    try:
        return str(row["updated_at"])
    except Exception:
        return str(row[0])
