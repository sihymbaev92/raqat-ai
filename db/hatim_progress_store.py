# -*- coding: utf-8 -*-
"""Платформа пайдаланушысының хатым (114 сүре оқылды белгілері) JSON."""
from __future__ import annotations

import json
from typing import Any

from db.dialect_sql import execute as _exec
from db.get_db import get_db


def _normalize_surahs(raw: list[int]) -> list[int]:
    s: set[int] = set()
    for x in raw:
        try:
            n = int(x)
        except (TypeError, ValueError):
            continue
        if 1 <= n <= 114:
            s.add(n)
    return sorted(s)


def get_hatim_read_surahs(platform_user_id: str) -> tuple[list[int], str | None]:
    pid = (platform_user_id or "").strip()
    if not pid:
        return [], None
    with get_db() as conn:
        row = _exec(
            conn,
            """
            SELECT surahs_json, updated_at FROM platform_hatim_read
            WHERE platform_user_id = ? LIMIT 1
            """,
            (pid,),
        ).fetchone()
    if not row:
        return [], None
    try:
        js = str(row["surahs_json"])
        upd = str(row["updated_at"])
    except Exception:
        js = str(row[0])
        upd = str(row[1])
    try:
        arr = json.loads(js)
        if not isinstance(arr, list):
            return [], upd
        nums: list[int] = []
        for x in arr:
            try:
                nums.append(int(x))
            except (TypeError, ValueError):
                continue
        return _normalize_surahs(nums), upd
    except Exception:
        return [], upd


def put_hatim_read_surahs(platform_user_id: str, surahs: list[int]) -> str:
    pid = (platform_user_id or "").strip()
    if not pid:
        raise ValueError("empty_platform_user_id")
    norm = _normalize_surahs(surahs)
    payload = json.dumps(norm, separators=(",", ":"))
    with get_db() as conn:
        ex = _exec(
            conn,
            "SELECT 1 FROM platform_hatim_read WHERE platform_user_id = ? LIMIT 1",
            (pid,),
        ).fetchone()
        if ex:
            _exec(
                conn,
                """
                UPDATE platform_hatim_read
                SET surahs_json = ?, updated_at = datetime('now')
                WHERE platform_user_id = ?
                """,
                (payload, pid),
            )
        else:
            _exec(
                conn,
                """
                INSERT INTO platform_hatim_read (platform_user_id, surahs_json, updated_at)
                VALUES (?, ?, datetime('now'))
                """,
                (pid, payload),
            )
        row = _exec(
            conn,
            "SELECT updated_at FROM platform_hatim_read WHERE platform_user_id = ? LIMIT 1",
            (pid,),
        ).fetchone()
    if not row:
        return ""
    try:
        return str(row["updated_at"])
    except Exception:
        return str(row[0])
