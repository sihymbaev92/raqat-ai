# -*- coding: utf-8 -*-
"""
Тексерілген қазақша Құран мағынасын JSON файлдан sqlite `quran.text_kk` бағанына жазады.

Негізгі мақсат — баспа аударманы (мысалы Ерлан Алимулының тексерілген соңғы нұсқасы)
логотипі мен лицензиясы рұқсат етілген жағдайда қолдану. Автоматты (Gemini) аударма
діни мәтін үшін ұсынылмайды.

JSON пішімі (мысал):
{
  "attribution_kk": "Ерлан Алимулы аудармасы (тексерілген баспа)",
  "source_detail": "Шығарма атауы, жыл — дереккөзді өзіңіз толтырыңыз",
  "ayahs": [
    {"surah": 1, "ayah": 1, "text": "..."},
    ...
  ]
}

Орындау:
  .venv/bin/python3 scripts/import_quran_kk_verified.py --json data/quran_kk_verified.json --db global_clean.db
  .venv/bin/python3 scripts/import_quran_kk_verified.py --json data/quran_kk_verified.json \\
    --attribution-kk "Ерлан Алимулы аудармасы (тексерілген баспа)" --source-detail "Баспа атауы, жыл"

Бір ретте koran.kz транскрипциясымен: bash scripts/sync_quran_official_sources.sh
Ерлан импорт + мобильді бандл: bash scripts/run_erlan_quran_import.sh
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

# Проект түбінен іске қосу: python scripts/import_quran_kk_verified.py
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config.settings import DB_PATH  # noqa: E402
from db.migrations import run_schema_migrations  # noqa: E402


def parse_args():
    p = argparse.ArgumentParser(description="Import verified Kazakh Quran meanings into quran.text_kk.")
    p.add_argument("--json", required=True, help="Path to JSON file (see module docstring)")
    p.add_argument("--db", default=DB_PATH)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument(
        "--allow-partial",
        action="store_true",
        help="Allow fewer than 6224 ayahs (testing only)",
    )
    p.add_argument(
        "--attribution-kk",
        default="",
        help="quran_kk_provenance үшін (JSON-дағыдан басым). Бос болса — JSON attribution_kk.",
    )
    p.add_argument(
        "--source-detail",
        default="",
        help="quran_kk_provenance source_detail (JSON-дағыдан басым).",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    path = Path(args.json)
    if not path.is_file():
        print(f"File not found: {path}", file=sys.stderr)
        return 1

    raw = json.loads(path.read_text(encoding="utf-8"))
    attribution = (args.attribution_kk or raw.get("attribution_kk") or "").strip()
    detail = (args.source_detail or raw.get("source_detail") or "").strip()
    ayahs = raw.get("ayahs") or raw.get("verses")
    if not isinstance(ayahs, list):
        print("JSON must contain 'ayahs' array", file=sys.stderr)
        return 1

    expected = 6224
    if len(ayahs) < expected and not args.allow_partial:
        print(
            f"Expected {expected} ayahs, got {len(ayahs)}. "
            f"Use --allow-partial for incomplete files.",
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
            t = (item.get("text") or "").strip()
        except (KeyError, TypeError, ValueError) as e:
            print(f"Bad row: {item!r} ({e})", file=sys.stderr)
            return 1
        if not t:
            print(f"Empty text for surah={s} ayah={a}", file=sys.stderr)
            return 1
        updates.append((t, s, a))

    print(f"Prepared {len(updates)} updates; attribution={attribution[:60]!r}...")
    if args.dry_run:
        conn.close()
        return 0

    try:
        conn.execute("BEGIN")
        conn.executemany(
            "UPDATE quran SET text_kk = ?, updated_at = datetime('now') WHERE surah = ? AND ayah = ?",
            updates,
        )
        changed = conn.total_changes
        conn.execute("DELETE FROM quran_kk_provenance WHERE id = 1")
        conn.execute(
            """
            INSERT INTO quran_kk_provenance (id, attribution_kk, source_detail, updated_at)
            VALUES (1, ?, ?, datetime('now'))
            """,
            (attribution or None, detail or None),
        )
        conn.commit()
        print(f"OK: sqlite changes={changed}; provenance saved.")
    except Exception as e:
        conn.rollback()
        print(f"Rolled back: {e}", file=sys.stderr)
        conn.close()
        return 1
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
