# -*- coding: utf-8 -*-
from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from hadith_scrape.extract import ScrapedHadithRow, content_hash

_SCHEMA = """
CREATE TABLE IF NOT EXISTS scraped_hadith (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hadith_id TEXT NOT NULL,
  hadith_text TEXT NOT NULL,
  narrator TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL UNIQUE,
  source_site TEXT NOT NULL,
  collection_hint TEXT NOT NULL DEFAULT '',
  page_title TEXT NOT NULL DEFAULT '',
  content_hash TEXT NOT NULL,
  scraped_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scraped_hadith_site ON scraped_hadith(source_site);
CREATE INDEX IF NOT EXISTS idx_scraped_hadith_hash ON scraped_hadith(content_hash);
"""


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.executescript(_SCHEMA)
    return conn


def upsert_rows(conn: sqlite3.Connection, rows: list[ScrapedHadithRow]) -> tuple[int, int]:
    inserted = 0
    skipped = 0
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    for row in rows:
        h = content_hash(row.hadith_text)
        try:
            conn.execute(
                """
                INSERT INTO scraped_hadith (
                  hadith_id, hadith_text, narrator, source_url, source_site,
                  collection_hint, page_title, content_hash, scraped_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    row.hadith_id,
                    row.hadith_text,
                    row.narrator,
                    row.source_url,
                    row.source_site,
                    row.collection_hint,
                    row.page_title,
                    h,
                    now,
                ),
            )
            inserted += 1
        except sqlite3.IntegrityError:
            skipped += 1
    conn.commit()
    return inserted, skipped


def stats(conn: sqlite3.Connection) -> dict[str, int]:
    total = conn.execute("SELECT COUNT(*) FROM scraped_hadith").fetchone()[0]
    by_site = conn.execute(
        "SELECT source_site, COUNT(*) AS n FROM scraped_hadith GROUP BY source_site ORDER BY n DESC"
    ).fetchall()
    return {"total": int(total), "by_site": {r["source_site"]: int(r["n"]) for r in by_site}}


def export_json(conn: sqlite3.Connection) -> list[dict]:
    cur = conn.execute(
        """
        SELECT hadith_id, hadith_text, narrator, source_url, source_site,
               collection_hint, page_title, scraped_at
        FROM scraped_hadith
        ORDER BY id
        """
    )
    return [dict(r) for r in cur.fetchall()]
