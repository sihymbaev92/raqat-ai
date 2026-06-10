# -*- coding: utf-8 -*-
from __future__ import annotations

import hashlib
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from islamic_kb.config import islamic_kb_db_path

_SCHEMA = """
CREATE TABLE IF NOT EXISTS islamic_kb_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_site TEXT NOT NULL,
  canonical_url TEXT NOT NULL UNIQUE,
  title TEXT,
  published_at TEXT,
  category TEXT,
  author TEXT,
  language TEXT DEFAULT 'kk',
  content_hash TEXT NOT NULL,
  raw_fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS islamic_kb_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  text_plain TEXT NOT NULL,
  FOREIGN KEY(document_id) REFERENCES islamic_kb_documents(id) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE IF NOT EXISTS islamic_kb_fts USING fts5(
  title,
  text_plain,
  source_site UNINDEXED,
  canonical_url UNINDEXED,
  document_id UNINDEXED,
  chunk_id UNINDEXED,
  tokenize='unicode61'
);
"""


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def content_hash(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def _migrate_schema(conn: sqlite3.Connection) -> None:
    cols = {str(r[1]) for r in conn.execute("PRAGMA table_info(islamic_kb_documents)").fetchall()}
    if "image_url" not in cols:
        conn.execute("ALTER TABLE islamic_kb_documents ADD COLUMN image_url TEXT")
    if "license_note" not in cols:
        conn.execute("ALTER TABLE islamic_kb_documents ADD COLUMN license_note TEXT")


def ensure_db(path: Path | None = None) -> Path:
    p = path or islamic_kb_db_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(p) as conn:
        conn.executescript(_SCHEMA)
        _migrate_schema(conn)
        conn.commit()
    return p


@contextmanager
def connect(path: Path | None = None) -> Iterator[sqlite3.Connection]:
    p = ensure_db(path)
    conn = sqlite3.connect(p)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def kb_stats(path: Path | None = None) -> dict:
    with connect(path) as conn:
        docs = conn.execute("SELECT COUNT(*) FROM islamic_kb_documents").fetchone()[0]
        chunks = conn.execute("SELECT COUNT(*) FROM islamic_kb_chunks").fetchone()[0]
        by_site = conn.execute(
            "SELECT source_site, COUNT(*) AS n FROM islamic_kb_documents GROUP BY source_site"
        ).fetchall()
    return {
        "documents": int(docs),
        "chunks": int(chunks),
        "by_site": {str(r["source_site"]): int(r["n"]) for r in by_site},
    }
