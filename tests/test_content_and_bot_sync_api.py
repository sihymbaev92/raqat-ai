# -*- coding: utf-8 -*-
"""GET /health, /ready, /api/v1/info, /metrics, /api/v1/stats/content, /api/v1/quran/surahs,
/api/v1/hadith/random (source опциялы), /api/v1/bot/sync/* (құпия)."""
from __future__ import annotations

import shutil
import sqlite3
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


@pytest.fixture(autouse=True)
def _no_content_read_secret_for_api_tests(monkeypatch: pytest.MonkeyPatch) -> None:
    """Жергілікті .env-тегі RAQAT_CONTENT_READ_SECRET контент GET-терін 401-ге бұрмасын."""
    monkeypatch.delenv("RAQAT_CONTENT_READ_SECRET", raising=False)


def test_health_public():
    r = client.get("/health")
    assert r.status_code == 200, r.text
    assert r.json().get("status") == "ok"


def test_ready_ok_with_temp_db(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    _copy_db(monkeypatch, tmp_path)
    r = client.get("/ready")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True


def test_api_v1_info_public():
    r = client.get("/api/v1/info")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("name")
    assert j.get("version")
    assert isinstance(j.get("links"), dict)


def test_metrics_prometheus_public():
    r = client.get("/metrics")
    assert r.status_code == 200, r.text
    ct = (r.headers.get("content-type") or "").lower()
    assert "text/plain" in ct or "openmetrics" in ct


def test_stats_content_ok_with_temp_db(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    _copy_db(monkeypatch, tmp_path)
    r = client.get("/api/v1/stats/content")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("ok") is True
    assert "tables" in j


def test_quran_surahs_ok_with_temp_db(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    _copy_db(monkeypatch, tmp_path)
    r = client.get("/api/v1/quran/surahs")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("ok") is True
    surahs = j.get("surahs")
    assert isinstance(surahs, list)
    assert len(surahs) >= 1


def _ensure_bot_sync_sqlite_tables(db_path: Path) -> None:
    """Кей minimal DB үлгілерінде bot/sync үшін кестелер жоқ — тест үшін қосамыз."""
    conn = sqlite3.connect(str(db_path))
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).fetchall()
        tables = {r[0] for r in rows}
        if "user_preferences" not in tables:
            conn.execute(
                """
                CREATE TABLE user_preferences (
                    user_id INTEGER PRIMARY KEY NOT NULL,
                    lang_code TEXT NOT NULL DEFAULT 'kk',
                    telegram_username TEXT,
                    full_name TEXT,
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
                """
            )
        if "bookmarks" not in tables:
            conn.execute(
                """
                CREATE TABLE bookmarks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    surah INTEGER NOT NULL,
                    ayah INTEGER NOT NULL,
                    text_ar TEXT,
                    text_lang TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        conn.commit()
    finally:
        conn.close()


def _copy_db(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    src = ROOT / "global_clean.db"
    if not src.is_file():
        pytest.skip("global_clean.db missing")
    dst = tmp_path / "api_content_tests.db"
    shutil.copy(src, dst)
    monkeypatch.setenv("RAQAT_DB_PATH", str(dst))
    from db.migrations import run_schema_migrations

    run_schema_migrations(str(dst))
    _ensure_bot_sync_sqlite_tables(dst)


def test_hadith_random_without_source_returns_hadith_or_404(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    _copy_db(monkeypatch, tmp_path)
    r = client.get("/api/v1/hadith/random", params={"lang": "kk"})
    assert r.status_code in (200, 404), r.text
    if r.status_code == 200:
        j = r.json()
        assert j.get("ok") is True
        assert isinstance(j.get("hadith"), dict)


def test_hadith_random_with_source_optional(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    _copy_db(monkeypatch, tmp_path)
    r = client.get("/api/v1/hadith/random", params={"lang": "kk", "source": "bukhari"})
    assert r.status_code in (200, 404), r.text


def test_bot_sync_user_requires_secret(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    _copy_db(monkeypatch, tmp_path)
    monkeypatch.setenv("RAQAT_BOT_SYNC_SECRET", "test-bot-sync-secret-value-min-32")
    r = client.post(
        "/api/v1/bot/sync/user",
        json={"user_id": 42, "lang": "kk", "username": "u", "full_name": "N"},
    )
    assert r.status_code == 401


def test_bot_sync_user_ok_with_header(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    _copy_db(monkeypatch, tmp_path)
    secret = "test-bot-sync-secret-value-min-32"
    monkeypatch.setenv("RAQAT_BOT_SYNC_SECRET", secret)
    r = client.post(
        "/api/v1/bot/sync/user",
        json={"user_id": 42_001, "lang": "ru", "username": "sync_u", "full_name": "Sync User"},
        headers={"X-Raqat-Bot-Sync-Secret": secret},
    )
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True
    lang = client.get(
        "/api/v1/bot/sync/user/42001/lang",
        headers={"X-Raqat-Bot-Sync-Secret": secret},
    )
    assert lang.status_code == 200
    assert lang.json().get("lang") == "ru"
