#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Бір жинақ ішінде бірдей араб мәтіні қайта келген жолдарды белгілеу:
  is_repeated = 1, original_id = ең кіші id (бірінші кездесу).

Қолдану (SQLite):
  .venv/bin/python scripts/mark_hadith_repeats.py --db global_clean.db
  .venv/bin/python scripts/mark_hadith_repeats.py --db global_clean.db --dry-run
"""
from __future__ import annotations

import argparse
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from db.migrations import run_schema_migrations  # noqa: E402


def _norm_ar(text: str | None) -> str:
    if not text:
        return ""
    t = re.sub(r"\s+", " ", text.strip())
    return t


def main() -> int:
    ap = argparse.ArgumentParser(description="Mark repeated hadith rows (same text_ar per source)")
    ap.add_argument("--db", default=str(ROOT / "global_clean.db"))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    db_path = args.db
    run_schema_migrations(db_path)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        cols = {row[1] for row in conn.execute("PRAGMA table_info(hadith)").fetchall()}
        if "is_repeated" not in cols or "original_id" not in cols:
            print("hadith кестесінде is_repeated / original_id жоқ — миграцияны іске қосыңыз.", file=sys.stderr)
            return 1

        rows = conn.execute(
            "SELECT id, source, text_ar FROM hadith ORDER BY source, id"
        ).fetchall()

        by_key: dict[tuple[str, str], list[int]] = defaultdict(list)
        for r in rows:
            src = (r["source"] or "").strip()
            key = (src, _norm_ar(r["text_ar"]))
            if not key[1]:
                continue
            by_key[key].append(int(r["id"]))

        updates: list[tuple[int, int | None]] = []
        for _k, ids in by_key.items():
            if len(ids) <= 1:
                continue
            ids_sorted = sorted(ids)
            canon = ids_sorted[0]
            for hid in ids_sorted[1:]:
                updates.append((hid, canon))

        reset = conn.execute(
            "SELECT COUNT(*) AS c FROM hadith WHERE is_repeated <> 0 OR original_id IS NOT NULL"
        ).fetchone()
        n_reset = int(reset["c"] or 0)
        if n_reset and not args.dry_run:
            conn.execute(
                "UPDATE hadith SET is_repeated = 0, original_id = NULL WHERE is_repeated <> 0 OR original_id IS NOT NULL"
            )

        if args.dry_run:
            print(f"dry-run: would mark {len(updates)} rows as repeats (canonical id min per group)")
            for hid, oid in updates[:20]:
                print(f"  id={hid} -> original_id={oid}")
            if len(updates) > 20:
                print(f"  ... +{len(updates) - 20} more")
            return 0

        for hid, oid in updates:
            conn.execute(
                "UPDATE hadith SET is_repeated = 1, original_id = ?, updated_at = datetime('now') WHERE id = ?",
                (oid, hid),
            )
        conn.commit()
        print(f"marked {len(updates)} repeated rows (reset previous flags: {n_reset})")
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
