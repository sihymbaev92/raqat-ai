#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hadith text_kk және KK аударма өрістерін DB-дан толық тазалау (жарияламау)."""
from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from db.migrations import run_schema_migrations  # noqa: E402

KK_COLS = (
    "text_kk",
    "text_kk_literal",
    "text_kk_clean",
    "text_kk_explanation",
    "kk_source_site",
    "kk_source_url",
)


def purge(db_path: Path, *, dry_run: bool) -> dict[str, int]:
    run_schema_migrations(str(db_path))
    conn = sqlite3.connect(str(db_path))
    cols = {row[1] for row in conn.execute("PRAGMA table_info(hadith)").fetchall()}
    stats: dict[str, int] = {}
    for col in KK_COLS:
        if col not in cols:
            continue
        n = conn.execute(
            f"SELECT COUNT(*) FROM hadith WHERE TRIM(COALESCE({col}, '')) <> ''"
        ).fetchone()[0]
        stats[f"cleared_{col}"] = int(n)
        if not dry_run:
            conn.execute(f"UPDATE hadith SET {col} = NULL")
    if not dry_run:
        conn.execute(
            """
            UPDATE hadith
            SET translation_status = NULL, quality_score = NULL, updated_at = datetime('now')
            WHERE translation_status IS NOT NULL OR quality_score IS NOT NULL
            """
        )
        conn.commit()
    conn.close()
    return stats


def main() -> int:
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("--db", default=str(ROOT / "global_clean.db"))
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    st = purge(Path(args.db), dry_run=args.dry_run)
    print("purge_hadith_kk:", st, "(dry_run=" + str(args.dry_run) + ")")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
