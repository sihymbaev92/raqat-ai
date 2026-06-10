#!/usr/bin/env python3
"""Жергілікті/VPS: пайдаланушы және оқиға санағын шығару."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from services.ops_service import build_analytics_summary, build_health_snapshot  # noqa: E402


def main() -> int:
    h = build_health_snapshot()
    print("=== RAQAT usage snapshot ===")
    print(f"users_with_prefs (Telegram/bot prefs): {h.get('user_count', 0)}")
    print(f"events_last_15m: {h.get('events_last_15m', 0)}")
    print(f"last_event_at: {h.get('last_event_at')}")
    for hours, label in ((24, "24h"), (168, "7d"), (720, "30d")):
        a = build_analytics_summary(hours=hours)
        print(f"\n--- {label} ---")
        print(f"events: {a.get('events', 0)}")
        print(f"active_users (distinct user_id in event_log): {a.get('active_users', 0)}")
        top = a.get("top_events") or []
        if top:
            print("top_events:", ", ".join(f"{r['event_name']}={r['total']}" for r in top[:5]))
    try:
        from db.get_db import get_db_writer
        from db.sql_dialect import table_names

        with get_db_writer() as conn:
            tables = table_names(conn)
            if "platform_users" in tables:
                row = conn.execute("SELECT COUNT(*) AS c FROM platform_users").fetchone()
                c = row["c"] if hasattr(row, "get") else row[0]
                print(f"\nplatform_users (mobile/web JWT): {c}")
            if "api_usage_ledger" in tables:
                row = conn.execute(
                    "SELECT COUNT(DISTINCT platform_user_id) AS c FROM api_usage_ledger"
                ).fetchone()
                c = row["c"] if hasattr(row, "get") else row[0]
                print(f"distinct platform users in usage ledger: {c}")
    except Exception as exc:
        print(f"\n(extra tables skipped: {exc})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
