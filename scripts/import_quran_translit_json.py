#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
`quran.translit` бағанын JSON файлдан толық немесе ішінара жаңартады (114 сүре / 6224 аят).

Негізгі толтыру жолы емес: әдетте алдымен koran.kz (`import_quran_translit_koran_kz.py`),
содан кейін бос жолдарға алгоритм (`backfill_quran_translit.py`). Бұл скрипт — расталған
түзетулер, басқа көзден көшіру немесе миграция үшін.

Пішім (мысал):
{
  "attribution": "Қолмен түзетілген транскрипция",
  "ayahs": [
    {"surah": 1, "ayah": 1, "translit": "бисмил ляяһир ..."},
    ...
  ]
}

Қолдану:
  python scripts/import_quran_translit_json.py --json data/quran_translit_custom.json --db global_clean.db --dry-run
  python scripts/import_quran_translit_json.py --json data/quran_translit_custom.json --db global_clean.db
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config.settings import DB_PATH  # noqa: E402
from db.migrations import run_schema_migrations  # noqa: E402


def parse_args():
    p = argparse.ArgumentParser(description="Import Quran transliterations into quran.translit.")
    p.add_argument("--json", required=True, help="Path to JSON (see module docstring)")
    p.add_argument("--db", default=DB_PATH)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument(
        "--allow-partial",
        action="store_true",
        help="Allow fewer than 6224 rows (testing)",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    path = Path(args.json)
    if not path.is_file():
        print(f"File not found: {path}", file=sys.stderr)
        return 1

    raw = json.loads(path.read_text(encoding="utf-8"))
    ayahs = raw.get("ayahs") or raw.get("verses")
    if not isinstance(ayahs, list):
        print("JSON must contain 'ayahs' array", file=sys.stderr)
        return 1

    expected = 6224
    if len(ayahs) < expected and not args.allow_partial:
        print(
            f"Expected {expected} ayahs, got {len(ayahs)}. Use --allow-partial for incomplete files.",
            file=sys.stderr,
        )
        return 1

    run_schema_migrations(args.db)

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("SELECT 1 FROM quran LIMIT 1")
    except sqlite3.Error as e:
        print(f"DB error: {e}", file=sys.stderr)
        conn.close()
        return 1

    updates = []
    for item in ayahs:
        try:
            s = int(item["surah"])
            a = int(item["ayah"])
            t = (item.get("translit") or item.get("text") or "").strip()
        except (KeyError, TypeError, ValueError) as e:
            print(f"Bad row: {item!r} ({e})", file=sys.stderr)
            return 1
        if not t:
            print(f"Empty translit for surah={s} ayah={a}", file=sys.stderr)
            return 1
        updates.append((t, s, a))

    att = (raw.get("attribution") or "").strip()
    print(f"Prepared {len(updates)} translit updates; attribution={att[:72]!r}...")
    if args.dry_run:
        conn.close()
        return 0

    try:
        conn.execute("BEGIN")
        conn.executemany(
            "UPDATE quran SET translit = ?, updated_at = datetime('now') WHERE surah = ? AND ayah = ?",
            updates,
        )
        changed = conn.total_changes
        conn.commit()
        print(f"OK: sqlite changes={changed}")
    except Exception as e:
        conn.rollback()
        print(f"Rolled back: {e}", file=sys.stderr)
        conn.close()
        return 1
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
