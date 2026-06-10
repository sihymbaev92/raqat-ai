# -*- coding: utf-8 -*-
from __future__ import annotations

import gc
import os
import shutil
import tempfile
import unittest
from pathlib import Path

from platform_api.islamic_kb.db import connect, ensure_db
from platform_api.islamic_kb.search import list_islamic_kb_documents


class TestIslamicKbBrowse(unittest.TestCase):
    def test_list_documents_by_site(self) -> None:
        tmp = tempfile.mkdtemp()
        try:
            db = Path(tmp) / "kb.sqlite3"
            ensure_db(db)
            with connect(db) as conn:
                conn.execute(
                    """
                    INSERT INTO islamic_kb_documents
                    (source_site, canonical_url, title, published_at, content_hash, raw_fetched_at, image_url)
                    VALUES ('fatua', 'https://fatua.kz/a', 'A', '2026-05-01', 'h1', '2026-01-01T00:00:00+00:00', 'https://fatua.kz/media/upload/a.png')
                    """
                )
                conn.execute(
                    """
                    INSERT INTO islamic_kb_chunks (document_id, chunk_index, text_plain)
                    VALUES (1, 0, 'Fatua excerpt text here.')
                    """
                )
            os.environ["RAQAT_ISLAMIC_KB_DB_PATH"] = str(db)
            rows = list_islamic_kb_documents(site="fatua", limit=5)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0].source_site, "fatua")
            self.assertIn("Fatua", rows[0].excerpt)
            self.assertEqual(rows[0].published_at, "2026-05-01")
            self.assertEqual(rows[0].image_url, "https://fatua.kz/media/upload/a.png")
        finally:
            os.environ.pop("RAQAT_ISLAMIC_KB_DB_PATH", None)
            gc.collect()
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
