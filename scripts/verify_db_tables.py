# -*- coding: utf-8 -*-
"""Check global_clean.db has expected tables."""
import sqlite3
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
db = root / "global_clean.db"
if not db.is_file():
    print("Missing:", db)
    sys.exit(1)
conn = sqlite3.connect(str(db))
cur = conn.cursor()
for name in ("quran", "hadith"):
    n = cur.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?",
        (name,),
    ).fetchone()[0]
    print(f"table {name}: {'ok' if n else 'MISSING'}")
conn.close()
