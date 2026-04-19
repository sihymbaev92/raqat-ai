# -*- coding: utf-8 -*-
from __future__ import annotations

from datetime import date, timedelta

from db.dialect_sql import execute as _exec
from db.dialect_sql import table_names
from db.get_db import is_postgresql_configured
from services.language_service import _lang_db, ensure_user_preferences_row, ensure_user_preferences_table

DEFAULT_DAILY_GOAL = 20


def _today_iso() -> str:
    return date.today().isoformat()


def _yesterday_iso() -> str:
    return (date.today() - timedelta(days=1)).isoformat()


def _default_meta(user_id: int) -> dict[str, int | str | None]:
    return {
        "user_id": user_id,
        "daily_goal_ayahs": DEFAULT_DAILY_GOAL,
        "streak_days": 0,
        "last_goal_date": None,
        "today_read_ayahs": 0,
        "today_read_date": None,
    }


def ensure_progress_table() -> None:
    ensure_user_preferences_table()
    with _lang_db() as conn:
        if is_postgresql_configured():
            t = table_names(conn)
            if "khatm_progress" not in t:
                conn.execute(
                    """
                    CREATE TABLE khatm_progress (
                        user_id BIGINT PRIMARY KEY
                            REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                        surah INTEGER NOT NULL,
                        ayah INTEGER NOT NULL,
                        completed_khatms INTEGER NOT NULL DEFAULT 0,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            if "khatm_meta" not in t:
                conn.execute(
                    """
                    CREATE TABLE khatm_meta (
                        user_id BIGINT PRIMARY KEY
                            REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                        daily_goal_ayahs INTEGER NOT NULL DEFAULT 20,
                        streak_days INTEGER NOT NULL DEFAULT 0,
                        last_goal_date TEXT,
                        today_read_ayahs INTEGER NOT NULL DEFAULT 0,
                        today_read_date TEXT,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            return
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS khatm_progress (
                user_id INTEGER PRIMARY KEY REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                surah INTEGER NOT NULL,
                ayah INTEGER NOT NULL,
                completed_khatms INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS khatm_meta (
                user_id INTEGER PRIMARY KEY REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                daily_goal_ayahs INTEGER NOT NULL DEFAULT 20,
                streak_days INTEGER NOT NULL DEFAULT 0,
                last_goal_date TEXT,
                today_read_ayahs INTEGER NOT NULL DEFAULT 0,
                today_read_date TEXT,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def _point_row(conn, surah: int, ayah: int):
    return _exec(
        conn,
        """
        SELECT id, surah, ayah
        FROM quran
        WHERE surah = ? AND ayah = ?
        LIMIT 1
        """,
        (surah, ayah),
    ).fetchone()


def _load_meta(conn, user_id: int) -> dict[str, int | str | None]:
    row = _exec(
        conn,
        """
        SELECT user_id, daily_goal_ayahs, streak_days, last_goal_date, today_read_ayahs, today_read_date
        FROM khatm_meta
        WHERE user_id = ?
        LIMIT 1
        """,
        (user_id,),
    ).fetchone()
    if not row:
        return _default_meta(user_id)
    return {
        "user_id": int(row["user_id"]),
        "daily_goal_ayahs": int(row["daily_goal_ayahs"] or DEFAULT_DAILY_GOAL),
        "streak_days": int(row["streak_days"] or 0),
        "last_goal_date": row["last_goal_date"],
        "today_read_ayahs": int(row["today_read_ayahs"] or 0),
        "today_read_date": row["today_read_date"],
    }


def _save_meta(conn, meta: dict[str, int | str | None]) -> None:
    _exec(
        conn,
        """
        INSERT INTO khatm_meta (
            user_id,
            daily_goal_ayahs,
            streak_days,
            last_goal_date,
            today_read_ayahs,
            today_read_date,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            daily_goal_ayahs = excluded.daily_goal_ayahs,
            streak_days = excluded.streak_days,
            last_goal_date = excluded.last_goal_date,
            today_read_ayahs = excluded.today_read_ayahs,
            today_read_date = excluded.today_read_date,
            updated_at = CURRENT_TIMESTAMP
        """,
        (
            meta["user_id"],
            meta["daily_goal_ayahs"],
            meta["streak_days"],
            meta["last_goal_date"],
            meta["today_read_ayahs"],
            meta["today_read_date"],
        ),
    )


def _effective_meta(meta: dict[str, int | str | None]) -> dict[str, int | str | None]:
    today = _today_iso()
    yesterday = _yesterday_iso()
    today_read_ayahs = int(meta["today_read_ayahs"] or 0) if meta["today_read_date"] == today else 0
    streak_days = int(meta["streak_days"] or 0)
    if meta["last_goal_date"] not in {today, yesterday}:
        streak_days = 0

    daily_goal = max(1, int(meta["daily_goal_ayahs"] or DEFAULT_DAILY_GOAL))
    return {
        **meta,
        "daily_goal_ayahs": daily_goal,
        "today_read_ayahs": today_read_ayahs,
        "streak_days": streak_days,
        "goal_remaining": max(0, daily_goal - today_read_ayahs),
        "goal_done_today": today_read_ayahs >= daily_goal,
    }


def get_user_khatm_meta(user_id: int) -> dict[str, int | str | None]:
    ensure_progress_table()
    with _lang_db() as conn:
        meta = _load_meta(conn, user_id)
    return _effective_meta(meta)


def set_user_daily_goal(user_id: int, daily_goal_ayahs: int) -> dict[str, int | str | None]:
    ensure_progress_table()
    ensure_user_preferences_row(user_id)
    goal = max(1, min(int(daily_goal_ayahs), 500))
    with _lang_db() as conn:
        meta = _load_meta(conn, user_id)
        meta["daily_goal_ayahs"] = goal
        _save_meta(conn, meta)
    return get_user_khatm_meta(user_id)


def get_total_ayah_count() -> int:
    ensure_progress_table()
    with _lang_db() as conn:
        row = _exec(conn, "SELECT COUNT(*) AS total FROM quran", ()).fetchone()
    return int((row["total"] if row else 0) or 0)


def get_surah_ayah_count(surah: int) -> int:
    with _lang_db() as conn:
        row = _exec(
            conn,
            "SELECT COUNT(*) AS total FROM quran WHERE surah = ?",
            (surah,),
        ).fetchone()
    return int((row["total"] if row else 0) or 0)


def get_user_khatm(user_id: int):
    ensure_progress_table()
    with _lang_db() as conn:
        progress = _exec(
            conn,
            """
            SELECT user_id, surah, ayah, completed_khatms, updated_at
            FROM khatm_progress
            WHERE user_id = ?
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()
        meta = _effective_meta(_load_meta(conn, user_id))

        if not progress:
            return None

        point = _point_row(conn, int(progress["surah"]), int(progress["ayah"]))
        if not point:
            return None

        total = int(
            _exec(conn, "SELECT COUNT(*) AS total FROM quran", ()).fetchone()["total"] or 0
        )
        surah_total = int(
            _exec(
                conn,
                "SELECT COUNT(*) AS total FROM quran WHERE surah = ?",
                (int(progress["surah"]),),
            ).fetchone()["total"]
            or 0
        )

    current_index = int(point["id"])
    return {
        "user_id": int(progress["user_id"]),
        "surah": int(progress["surah"]),
        "ayah": int(progress["ayah"]),
        "current_index": current_index,
        "total_ayahs": total,
        "remaining_ayahs": max(0, total - current_index),
        "percent": (current_index * 100.0 / total) if total else 0.0,
        "surah_total": surah_total,
        "completed_khatms": int(progress["completed_khatms"] or 0),
        "updated_at": progress["updated_at"],
        "daily_goal_ayahs": int(meta["daily_goal_ayahs"] or DEFAULT_DAILY_GOAL),
        "streak_days": int(meta["streak_days"] or 0),
        "today_read_ayahs": int(meta["today_read_ayahs"] or 0),
        "goal_remaining": int(meta["goal_remaining"] or 0),
        "goal_done_today": bool(meta["goal_done_today"]),
    }


def save_user_khatm(user_id: int, surah: int, ayah: int):
    ensure_progress_table()
    ensure_user_preferences_row(user_id)
    today = _today_iso()
    yesterday = _yesterday_iso()

    with _lang_db() as conn:
        point = _point_row(conn, surah, ayah)
        if not point:
            return None

        total = int(
            _exec(conn, "SELECT COUNT(*) AS total FROM quran", ()).fetchone()["total"] or 0
        )
        previous = _exec(
            conn,
            """
            SELECT surah, ayah, completed_khatms
            FROM khatm_progress
            WHERE user_id = ?
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()

        meta = _load_meta(conn, user_id)
        daily_goal = max(1, int(meta["daily_goal_ayahs"] or DEFAULT_DAILY_GOAL))
        previous_today_read = (
            int(meta["today_read_ayahs"] or 0) if meta["today_read_date"] == today else 0
        )
        if meta["today_read_date"] != today:
            meta["today_read_date"] = today
            meta["today_read_ayahs"] = 0

        completed_khatms = int(previous["completed_khatms"] or 0) if previous else 0
        previous_index = 0
        if previous:
            previous_point = _point_row(
                conn,
                int(previous["surah"]),
                int(previous["ayah"]),
            )
            previous_index = int(previous_point["id"]) if previous_point else 0

        current_index = int(point["id"])
        progress_delta = max(0, current_index - previous_index)
        meta["today_read_ayahs"] = int(meta["today_read_ayahs"] or 0) + progress_delta

        if total and current_index == total and previous_index < total:
            completed_khatms += 1

        current_today_read = int(meta["today_read_ayahs"] or 0)
        if current_today_read >= daily_goal and previous_today_read < daily_goal:
            if meta["last_goal_date"] == yesterday:
                meta["streak_days"] = int(meta["streak_days"] or 0) + 1
            elif meta["last_goal_date"] == today:
                meta["streak_days"] = int(meta["streak_days"] or 0)
            else:
                meta["streak_days"] = 1
            meta["last_goal_date"] = today

        _exec(
            conn,
            """
            INSERT INTO khatm_progress (user_id, surah, ayah, completed_khatms, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                surah = excluded.surah,
                ayah = excluded.ayah,
                completed_khatms = excluded.completed_khatms,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, surah, ayah, completed_khatms),
        )
        _save_meta(conn, meta)

    return get_user_khatm(user_id)
