# -*- coding: utf-8 -*-
"""Платформа: аят бетбелгілері (түс + ескертпа), JSON map "surah:ayah"."""
from __future__ import annotations

import json
from typing import Any

from db.dialect_sql import execute as _exec
from db.get_db import get_db

_VALID_COLORS = frozenset({"gold", "rose", "sky", "emerald", "violet", "slate"})


def _empty_markers() -> dict[str, Any]:
    return {}


def _normalize_markers(raw: dict[str, Any] | None) -> dict[str, Any]:
    if not raw or not isinstance(raw, dict):
        return _empty_markers()
    out: dict[str, Any] = {}
    for k, v in raw.items():
        if not isinstance(k, str) or ":" not in k:
            continue
        if not isinstance(v, dict):
            continue
        color = v.get("colorId") or v.get("color_id")
        note = v.get("note")
        if color not in _VALID_COLORS:
            continue
        if not isinstance(note, str):
            note = ""
        out[k] = {"colorId": color, "note": note[:2000]}
    return out


def _row_to_markers(row: Any) -> tuple[dict[str, Any], str | None]:
    if not row:
        return _empty_markers(), None
    try:
        js = str(row["markers_json"])
        upd = str(row["updated_at"])
    except Exception:
        js = str(row[0])
        upd = str(row[1])
    try:
        parsed = json.loads(js)
        if not isinstance(parsed, dict):
            return _empty_markers(), upd
        return _normalize_markers(parsed), upd
    except Exception:
        return _empty_markers(), upd


def get_quran_ayah_markers(platform_user_id: str) -> tuple[dict[str, Any], str | None]:
    pid = (platform_user_id or "").strip()
    if not pid:
        return _empty_markers(), None
    with get_db() as conn:
        row = _exec(
            conn,
            """
            SELECT markers_json, updated_at FROM platform_quran_ayah_markers
            WHERE platform_user_id = ? LIMIT 1
            """,
            (pid,),
        ).fetchone()
    return _row_to_markers(row)


def put_quran_ayah_markers(platform_user_id: str, markers: dict[str, Any]) -> str:
    pid = (platform_user_id or "").strip()
    if not pid:
        raise ValueError("empty_platform_user_id")
    norm = _normalize_markers(markers)
    payload = json.dumps(norm, separators=(",", ":"), ensure_ascii=False)
    with get_db() as conn:
        ex = _exec(
            conn,
            "SELECT 1 FROM platform_quran_ayah_markers WHERE platform_user_id = ? LIMIT 1",
            (pid,),
        ).fetchone()
        if ex:
            _exec(
                conn,
                """
                UPDATE platform_quran_ayah_markers
                SET markers_json = ?, updated_at = datetime('now')
                WHERE platform_user_id = ?
                """,
                (payload, pid),
            )
        else:
            _exec(
                conn,
                """
                INSERT INTO platform_quran_ayah_markers (platform_user_id, markers_json, updated_at)
                VALUES (?, ?, datetime('now'))
                """,
                (pid, payload),
            )
        row = _exec(
            conn,
            "SELECT updated_at FROM platform_quran_ayah_markers WHERE platform_user_id = ? LIMIT 1",
            (pid,),
        ).fetchone()
    if not row:
        return ""
    try:
        return str(row["updated_at"])
    except Exception:
        return str(row[0])
