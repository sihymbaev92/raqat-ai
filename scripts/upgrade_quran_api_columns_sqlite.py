#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ескі SQLite `quran` кестесіне API үйлесімді бағандар қосады:
  surah_name, translit, updated_at (жоқ болса) + 114 сүре атауын толтырады.

`schema_migrations` жоқ legacy global_clean.db үшін тікелей қолдануға болады.
Платформа DB startup `run_schema_migrations` ішінде 17-миграция да сондай істейді.

Мысал:
  python scripts/upgrade_quran_api_columns_sqlite.py --db global_clean.db
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from db.connection import db_conn  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--db",
        type=Path,
        default=ROOT / "global_clean.db",
        help="SQLite файлы (әдепкі: түбір global_clean.db)",
    )
    args = p.parse_args()
    db_path: Path = args.db
    if not db_path.is_file():
        print(f"DB табылмады: {db_path}", file=sys.stderr)
        return 1
    conn = db_conn(str(db_path))
    try:
        from db.migrations import _migration_017_quran_api_columns

        _migration_017_quran_api_columns(conn)
        conn.commit()
    finally:
        conn.close()
    print("OK:", db_path.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
