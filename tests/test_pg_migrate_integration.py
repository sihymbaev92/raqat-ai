# -*- coding: utf-8 -*-
"""
Локальды PostgreSQL (Docker) + migrate скрипті интеграциясы.

Қосу: `RAQAT_PG_TEST_DSN` (мысалы postgresql://postgres:postgres@127.0.0.1:5432/raqat_test)
және `pip install -r requirements-postgres.txt`.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.integration
def test_migrate_bootstrap_validate_with_docker_pg(tmp_path):
    dsn = (os.getenv("RAQAT_PG_TEST_DSN") or "").strip()
    if not dsn:
        pytest.skip(
            "RAQAT_PG_TEST_DSN орнатылмаған — Docker Postgres және DSN құрыңыз "
            "(docs/MIGRATION_SQLITE_TO_POSTGRES.md § Docker)."
        )
    pytest.importorskip("psycopg")

    from tests.test_migrations import _minimal_content_db

    db = tmp_path / "migrate_src.db"
    _minimal_content_db(str(db))
    from db.migrations import run_schema_migrations

    run_schema_migrations(str(db))

    script = ROOT / "scripts" / "migrate_sqlite_to_postgres.py"
    cmd = [
        sys.executable,
        str(script),
        "--sqlite",
        str(db),
        "--pg-dsn",
        dsn,
        "--bootstrap-ddl",
        "--with-quran-hadith",
        "--truncate",
        "--validate",
    ]
    r = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, f"stdout={r.stdout!r}\nstderr={r.stderr!r}"
