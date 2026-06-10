#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Сахих Бұхари/Муслим: kk_source_site + kk_source_url (хадис нөмірі бойынша).

Қазақша аударма DB-ге жазыlmайды — тек дереккөз сілтемесі (sunnah.com нумерациясы).
Кейін scrape merge kk_source_* жаңартуы мүмкін (Fatua/Muftyat/Islam/Muslim.kz).

  python scripts/assign_hadith_provenance.py --db global_clean.db
  python scripts/assign_hadith_provenance.py --db global_clean.db --dry-run
"""
from __future__ import annotations

import argparse
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from db.migrations import run_schema_migrations  # noqa: E402

SAHIH = ("Sahih al-Bukhari", "Sahih Muslim")
SLUG = {"Sahih al-Bukhari": "bukhari", "Sahih Muslim": "muslim"}


def sunnah_url(source: str, hadith_no: str | None) -> str | None:
    slug = SLUG.get(source or "")
    if not slug:
        return None
    raw = (hadith_no or "").strip()
    if not raw:
        return None
    head = re.split(r"[\s/]", raw, maxsplit=1)[0]
    if not re.match(r"^\d+(\.\d+)?$", head):
        return None
    return f"https://sunnah.com/{slug}:{head}"


def main() -> int:
    p = argparse.ArgumentParser(description="Hadith canonical source URLs (no KK text)")
    p.add_argument("--db", default=str(ROOT / "global_clean.db"))
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    run_schema_migrations(str(args.db))

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    cols = {r[1] for r in conn.execute("PRAGMA table_info(hadith)").fetchall()}
    if "kk_source_site" not in cols or "kk_source_url" not in cols:
        print("hadith.kk_source_* columns missing — run migrations", file=sys.stderr)
        return 1

    updated = 0
    for source in SAHIH:
        rows = conn.execute(
            """
            SELECT id, hadith_no FROM hadith
            WHERE source = ? AND COALESCE(is_repeated, 0) = 0
            """,
            (source,),
        ).fetchall()
        for r in rows:
            url = sunnah_url(source, r["hadith_no"])
            if not url:
                continue
            if args.dry_run:
                updated += 1
                continue
            conn.execute(
                """
                UPDATE hadith
                SET kk_source_site = 'sunnah',
                    kk_source_url = ?,
                    updated_at = datetime('now')
                WHERE id = ?
                """,
                (url, int(r["id"])),
            )
            updated += 1

    if not args.dry_run:
        conn.commit()
    conn.close()
    print(f"assign_hadith_provenance: updated={updated} dry_run={args.dry_run}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
