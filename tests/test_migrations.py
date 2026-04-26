# -*- coding: utf-8 -*-
import sqlite3

from db.connection import db_conn
from db.migrations import run_schema_migrations


def _minimal_content_db(path: str) -> None:
    conn = sqlite3.connect(path)
    conn.executescript(
        """
        CREATE TABLE quran (
            id INTEGER PRIMARY KEY,
            surah INTEGER,
            ayah INTEGER,
            text_ar TEXT
        );
        INSERT INTO quran (surah, ayah) VALUES (1, 1);
        CREATE TABLE hadith (
            id INTEGER PRIMARY KEY,
            source TEXT,
            text_ar TEXT
        );
        INSERT INTO hadith (source) VALUES ('bukhari');
        CREATE TABLE event_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            event_type TEXT,
            event_name TEXT,
            detail TEXT,
            created_at TEXT
        );
        CREATE TABLE feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category TEXT,
            message_text TEXT,
            status TEXT,
            context TEXT,
            created_at TEXT
        );
        CREATE TABLE ai_daily_usage (
            user_id INTEGER NOT NULL,
            day TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (user_id, day)
        );
        CREATE TABLE bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            surah INTEGER NOT NULL,
            ayah INTEGER NOT NULL,
            text_ar TEXT,
            text_lang TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE user_preferences (
            user_id INTEGER PRIMARY KEY,
            lang_code TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            full_name TEXT,
            lang TEXT DEFAULT 'kk'
        );
        INSERT INTO users (user_id, username, full_name, lang) VALUES (100, 'u1', 'N1', 'ru');
        """
    )
    conn.commit()
    conn.close()


def test_migrations_apply_and_idempotent(tmp_path):
    db = tmp_path / "m.db"
    _minimal_content_db(str(db))
    run_schema_migrations(str(db))
    run_schema_migrations(str(db))
    with db_conn(str(db)) as conn:
        n = conn.execute("SELECT COUNT(*) AS c FROM schema_migrations").fetchone()["c"]
        assert int(n) == 16
        qcols = {r[1] for r in conn.execute("PRAGMA table_info(quran)").fetchall()}
        assert "updated_at" in qcols
        tabs = {
            row["name"]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        assert "platform_identities" in tabs
        assert "platform_ai_chat_messages" in tabs
        assert "api_usage_ledger" in tabs
        assert "dhikr" in tabs
        dhikr_n = int(conn.execute("SELECT COUNT(*) AS c FROM dhikr").fetchone()["c"])
        assert dhikr_n >= 10
        idx = {
            row["name"]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='index' "
                "AND (name LIKE 'idx_%' OR name LIKE 'uq_%')"
            ).fetchall()
        }
        assert "idx_quran_surah_ayah" in idx
        assert "idx_platform_chat_user_created" in idx
        assert "uq_platform_chat_user_client" in idx
        fk_chat = conn.execute("PRAGMA foreign_key_list(platform_ai_chat_messages)").fetchall()
        assert any(str(r["table"]) == "platform_identities" for r in fk_chat)
        assert "users" not in {
            row["name"]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        row = conn.execute(
            "SELECT lang_code, telegram_username FROM user_preferences WHERE user_id = 100"
        ).fetchone()
        assert row["lang_code"] == "ru"
        assert row["telegram_username"] == "u1"


def test_merge_skips_when_no_users_table(tmp_path):
    db = tmp_path / "nousers.db"
    c = sqlite3.connect(str(db))
    c.executescript(
        """
        CREATE TABLE quran (id INTEGER PRIMARY KEY, surah INTEGER, ayah INTEGER);
        CREATE TABLE hadith (id INTEGER PRIMARY KEY, source TEXT);
        CREATE TABLE user_preferences (user_id INTEGER PRIMARY KEY, lang_code TEXT NOT NULL);
        """
    )
    c.commit()
    c.close()
    run_schema_migrations(str(db))
    with db_conn(str(db)) as conn:
        assert (
            conn.execute("SELECT COUNT(*) FROM schema_migrations").fetchone()[0] == 16
        )
