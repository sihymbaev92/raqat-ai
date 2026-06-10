# -*- coding: utf-8 -*-
"""Genealogy public API (P0 sqlite fallback)."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import pytest

pytest.importorskip("httpx")
pytest.importorskip("fastapi")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

client = TestClient(app)


def _copy_db_and_migrate(monkeypatch, tmp_path: Path) -> None:
    src = ROOT / "global_clean.db"
    if not src.is_file():
        pytest.skip("global_clean.db missing")
    dst = tmp_path / "genealogy_api_tests.db"
    shutil.copy(src, dst)
    monkeypatch.setenv("RAQAT_DB_PATH", str(dst))
    from db.migrations import run_schema_migrations

    run_schema_migrations(str(dst))


def test_genealogy_list_roots(monkeypatch, tmp_path):
    _copy_db_and_migrate(monkeypatch, tmp_path)
    r = client.get("/api/v1/genealogy/clans")
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is True
    assert body.get("count", 0) >= 0


def test_genealogy_detail_missing(monkeypatch, tmp_path):
    _copy_db_and_migrate(monkeypatch, tmp_path)
    r = client.get("/api/v1/genealogy/clans/no_such_clan_xyz")
    assert r.status_code == 404
