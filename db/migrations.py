# -*- coding: utf-8 -*-
"""
Ordered schema migrations (versioned). Safe to run on every startup.
"""
from __future__ import annotations

import logging
from collections.abc import Callable

from db.connection import db_conn

logger = logging.getLogger("raqat_ai.db")


def _table_names(conn) -> set[str]:
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).fetchall()
    return {row["name"] for row in rows}


def _ensure_migrations_table(conn) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )


def _applied_versions(conn) -> set[int]:
    rows = conn.execute("SELECT version FROM schema_migrations").fetchall()
    return {int(row["version"]) for row in rows}


def _migration_001_indexes(conn) -> None:
    tables = _table_names(conn)
    if "quran" in tables:
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_quran_surah_ayah ON quran(surah, ayah)"
        )
    if "hadith" in tables:
        conn.execute("CREATE INDEX IF NOT EXISTS idx_hadith_source ON hadith(source)")
    if "event_log" in tables:
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_event_log_user_created ON event_log(user_id, created_at)"
        )
    if "feedback" in tables:
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON feedback(user_id, created_at)"
        )
    if "ai_daily_usage" in tables:
        conn.execute("CREATE INDEX IF NOT EXISTS idx_ai_daily_usage_day ON ai_daily_usage(day)")
    if "bookmarks" in tables:
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id)"
        )


def _migration_002_merge_legacy_users(conn) -> None:
    """
    Merge legacy `users` into `user_preferences`, add profile columns, drop `users`.
    """
    tables = _table_names(conn)
    if "users" not in tables or "user_preferences" not in tables:
        return

    cols = {row[1] for row in conn.execute("PRAGMA table_info(user_preferences)").fetchall()}
    if "telegram_username" not in cols:
        conn.execute(
            "ALTER TABLE user_preferences ADD COLUMN telegram_username TEXT NULL"
        )
    if "full_name" not in cols:
        conn.execute("ALTER TABLE user_preferences ADD COLUMN full_name TEXT NULL")

    for row in conn.execute(
        "SELECT user_id, username, full_name, lang FROM users"
    ).fetchall():
        uid = int(row["user_id"])
        lang = (row["lang"] or "kk").strip() or "kk"
        uname = row["username"]
        fname = row["full_name"]
        exists = conn.execute(
            "SELECT 1 FROM user_preferences WHERE user_id = ? LIMIT 1",
            (uid,),
        ).fetchone()
        if not exists:
            conn.execute(
                """
                INSERT INTO user_preferences (
                    user_id, lang_code, telegram_username, full_name, updated_at
                )
                VALUES (?, ?, ?, ?, datetime('now'))
                """,
                (uid, lang, uname, fname),
            )
        else:
            conn.execute(
                """
                UPDATE user_preferences SET
                    telegram_username = COALESCE(telegram_username, ?),
                    full_name = COALESCE(full_name, ?),
                    updated_at = datetime('now')
                WHERE user_id = ?
                """,
                (uname, fname, uid),
            )

    conn.execute("DROP TABLE IF EXISTS users")
    logger.info("Legacy table users merged into user_preferences and dropped")


def _fk_defined(conn, table: str) -> bool:
    rows = conn.execute(f"PRAGMA foreign_key_list({table})").fetchall()
    return bool(rows)


def _backfill_user_ids_for_fk(conn, tables: set[str]) -> None:
    queries: list[str] = []
    if "feedback" in tables:
        queries.append("SELECT DISTINCT user_id FROM feedback")
    if "event_log" in tables:
        queries.append("SELECT DISTINCT user_id FROM event_log WHERE user_id IS NOT NULL")
    if "bookmarks" in tables:
        queries.append("SELECT DISTINCT user_id FROM bookmarks")
    if "ai_daily_usage" in tables:
        queries.append("SELECT DISTINCT user_id FROM ai_daily_usage")
    if "khatm_progress" in tables:
        queries.append("SELECT DISTINCT user_id FROM khatm_progress")
    if "khatm_meta" in tables:
        queries.append("SELECT DISTINCT user_id FROM khatm_meta")
    for q in queries:
        for row in conn.execute(q).fetchall():
            uid = row[0]
            if uid is None:
                continue
            conn.execute(
                """
                INSERT OR IGNORE INTO user_preferences (user_id, lang_code, updated_at)
                VALUES (?, 'kk', datetime('now'))
                """,
                (int(uid),),
            )


def _migration_003_foreign_keys(conn) -> None:
    """
    Қосалқы кестелерді user_preferences(user_id) бойынша байланыстырады.
    Ескі кестелерде FK жоқ болса ғана қайта құрады.
    """
    tables = _table_names(conn)
    if "user_preferences" not in tables:
        return

    _backfill_user_ids_for_fk(conn, tables)

    if "feedback" in tables and not _fk_defined(conn, "feedback"):
        conn.executescript(
            """
            CREATE TABLE feedback_fk_rebuild (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                category TEXT NOT NULL,
                message_text TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                context TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO feedback_fk_rebuild
                SELECT id, user_id, category, message_text, status, context, created_at
                FROM feedback;
            DROP TABLE feedback;
            ALTER TABLE feedback_fk_rebuild RENAME TO feedback;
            """
        )

    if "event_log" in tables and not _fk_defined(conn, "event_log"):
        conn.executescript(
            """
            CREATE TABLE event_log_fk_rebuild (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES user_preferences(user_id) ON DELETE SET NULL,
                event_type TEXT NOT NULL,
                event_name TEXT NOT NULL,
                detail TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO event_log_fk_rebuild
                SELECT id, user_id, event_type, event_name, detail, created_at
                FROM event_log;
            DROP TABLE event_log;
            ALTER TABLE event_log_fk_rebuild RENAME TO event_log;
            """
        )

    if "bookmarks" in tables and not _fk_defined(conn, "bookmarks"):
        conn.executescript(
            """
            CREATE TABLE bookmarks_fk_rebuild (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                surah INTEGER NOT NULL,
                ayah INTEGER NOT NULL,
                text_ar TEXT,
                text_lang TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO bookmarks_fk_rebuild
                SELECT id, user_id, surah, ayah, text_ar, text_lang, created_at
                FROM bookmarks;
            DROP TABLE bookmarks;
            ALTER TABLE bookmarks_fk_rebuild RENAME TO bookmarks;
            """
        )

    if "ai_daily_usage" in tables and not _fk_defined(conn, "ai_daily_usage"):
        conn.executescript(
            """
            CREATE TABLE ai_daily_usage_fk_rebuild (
                user_id INTEGER NOT NULL REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                day TEXT NOT NULL,
                count INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (user_id, day)
            );
            INSERT INTO ai_daily_usage_fk_rebuild SELECT user_id, day, count FROM ai_daily_usage;
            DROP TABLE ai_daily_usage;
            ALTER TABLE ai_daily_usage_fk_rebuild RENAME TO ai_daily_usage;
            """
        )

    if "khatm_progress" in tables and not _fk_defined(conn, "khatm_progress"):
        conn.executescript(
            """
            CREATE TABLE khatm_progress_fk_rebuild (
                user_id INTEGER PRIMARY KEY REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                surah INTEGER NOT NULL,
                ayah INTEGER NOT NULL,
                completed_khatms INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO khatm_progress_fk_rebuild
                SELECT user_id, surah, ayah, completed_khatms, updated_at
                FROM khatm_progress;
            DROP TABLE khatm_progress;
            ALTER TABLE khatm_progress_fk_rebuild RENAME TO khatm_progress;
            """
        )

    if "khatm_meta" in tables and not _fk_defined(conn, "khatm_meta"):
        conn.executescript(
            """
            CREATE TABLE khatm_meta_fk_rebuild (
                user_id INTEGER PRIMARY KEY REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                daily_goal_ayahs INTEGER NOT NULL DEFAULT 20,
                streak_days INTEGER NOT NULL DEFAULT 0,
                last_goal_date TEXT,
                today_read_ayahs INTEGER NOT NULL DEFAULT 0,
                today_read_date TEXT,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO khatm_meta_fk_rebuild
                SELECT user_id, daily_goal_ayahs, streak_days, last_goal_date,
                       today_read_ayahs, today_read_date, updated_at
                FROM khatm_meta;
            DROP TABLE khatm_meta;
            ALTER TABLE khatm_meta_fk_rebuild RENAME TO khatm_meta;
            """
        )

    tables = _table_names(conn)
    if "event_log" in tables:
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_event_log_created_at ON event_log(created_at)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_event_log_event_name ON event_log(event_name)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_event_log_user_created ON event_log(user_id, created_at)"
        )
    if "feedback" in tables:
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_feedback_status_created ON feedback(status, created_at DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON feedback(user_id, created_at)"
        )
    if "ai_daily_usage" in tables:
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_ai_daily_usage_day ON ai_daily_usage(day)"
        )
    if "bookmarks" in tables:
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id)"
        )

    bad = conn.execute("PRAGMA foreign_key_check").fetchall()
    if bad:
        raise RuntimeError(f"foreign_key_check failed: {bad!r}")
    logger.info("Foreign keys verified (PRAGMA foreign_key_check OK)")


def _table_has_fk_to(conn, child_table: str, parent_table: str, from_col: str) -> bool:
    rows = conn.execute(f"PRAGMA foreign_key_list({child_table})").fetchall()
    for r in rows:
        if str(r["table"]) == parent_table and str(r["from"]) == from_col:
            return True
    return False


def _migration_008_platform_fk_chat_indexes(conn) -> None:
    """
    platform_ai_chat_messages → platform_identities (CASCADE),
    api_usage_ledger.platform_user_id → platform_identities (SET NULL, nullable),
    чат үшін қосымша индекстер және (platform_user_id, client_id) partial UNIQUE.
    """
    tables = _table_names(conn)
    if "platform_identities" not in tables:
        return

    if "platform_ai_chat_messages" in tables:
        if not _table_has_fk_to(
            conn, "platform_ai_chat_messages", "platform_identities", "platform_user_id"
        ):
            conn.execute(
                """
                DELETE FROM platform_ai_chat_messages
                WHERE platform_user_id NOT IN (
                    SELECT platform_user_id FROM platform_identities
                )
                """
            )
            conn.execute(
                """
                DELETE FROM platform_ai_chat_messages
                WHERE id NOT IN (
                    SELECT MIN(id) FROM platform_ai_chat_messages
                    WHERE client_id IS NOT NULL AND TRIM(client_id) != ''
                    GROUP BY platform_user_id, client_id
                )
                AND client_id IS NOT NULL AND TRIM(client_id) != ''
                """
            )
            conn.executescript(
                """
                CREATE TABLE platform_ai_chat_messages_fk_rebuild (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platform_user_id TEXT NOT NULL REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE,
                    role TEXT NOT NULL,
                    body TEXT NOT NULL,
                    source TEXT NOT NULL DEFAULT 'unknown',
                    client_id TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
                INSERT INTO platform_ai_chat_messages_fk_rebuild (
                    id, platform_user_id, role, body, source, client_id, created_at
                )
                SELECT id, platform_user_id, role, body, source, client_id, created_at
                FROM platform_ai_chat_messages;
                DROP TABLE platform_ai_chat_messages;
                ALTER TABLE platform_ai_chat_messages_fk_rebuild RENAME TO platform_ai_chat_messages;
                """
            )

    if "platform_ai_chat_messages" in _table_names(conn):
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_platform_identities_telegram "
            "ON platform_identities(telegram_user_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_platform_chat_user_id "
            "ON platform_ai_chat_messages(platform_user_id, id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_platform_chat_user_created "
            "ON platform_ai_chat_messages(platform_user_id, created_at)"
        )
        conn.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_chat_user_client
            ON platform_ai_chat_messages(platform_user_id, client_id)
            WHERE client_id IS NOT NULL AND TRIM(client_id) != ''
            """
        )

    tables = _table_names(conn)
    if "api_usage_ledger" in tables and not _table_has_fk_to(
        conn, "api_usage_ledger", "platform_identities", "platform_user_id"
    ):
        conn.execute(
            """
            UPDATE api_usage_ledger
            SET platform_user_id = NULL
            WHERE platform_user_id IS NOT NULL
              AND platform_user_id NOT IN (
                  SELECT platform_user_id FROM platform_identities
              )
            """
        )
        conn.executescript(
            """
            CREATE TABLE api_usage_ledger_fk_rebuild (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                route TEXT NOT NULL,
                platform_user_id TEXT REFERENCES platform_identities(platform_user_id) ON DELETE SET NULL,
                telegram_user_id INTEGER,
                source_auth TEXT NOT NULL,
                units INTEGER NOT NULL DEFAULT 1,
                prompt_chars INTEGER,
                response_chars INTEGER,
                meta_json TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            INSERT INTO api_usage_ledger_fk_rebuild (
                id, event_type, route, platform_user_id, telegram_user_id,
                source_auth, units, prompt_chars, response_chars, meta_json, created_at
            )
            SELECT id, event_type, route, platform_user_id, telegram_user_id,
                   source_auth, units, prompt_chars, response_chars, meta_json, created_at
            FROM api_usage_ledger;
            DROP TABLE api_usage_ledger;
            ALTER TABLE api_usage_ledger_fk_rebuild RENAME TO api_usage_ledger;
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_ledger(created_at)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_api_usage_platform ON api_usage_ledger(platform_user_id, created_at)"
        )

    bad = conn.execute("PRAGMA foreign_key_check").fetchall()
    if bad:
        raise RuntimeError(f"foreign_key_check after migration 008: {bad!r}")


def _migration_004_quran_kk_provenance(conn) -> None:
    """
    Қазақша мағына үшін тексерілген аударма дереккөзінің жолы (мысалы Ерлан Алимулы баспасы).
    """
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS quran_kk_provenance (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            attribution_kk TEXT,
            source_detail TEXT,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    conn.execute("INSERT OR IGNORE INTO quran_kk_provenance (id) VALUES (1)")


def _migration_005_content_updated_at(conn) -> None:
    """
    Құран/хадис жолдары үшін updated_at (инкременттік /metadata/changes diff).
    """
    tables = _table_names(conn)
    for table in ("quran", "hadith"):
        if table not in tables:
            continue
        cols = {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
        if "updated_at" not in cols:
            # SQLite ADD COLUMN: функциялық DEFAULT жоқ; бар жолдарды бірден толтырамыз.
            conn.execute(f"ALTER TABLE {table} ADD COLUMN updated_at TEXT")
            conn.execute(f"UPDATE {table} SET updated_at = datetime('now') WHERE updated_at IS NULL")
        conn.execute(
            f"CREATE INDEX IF NOT EXISTS idx_{table}_updated_at ON {table}(updated_at)"
        )


def _migration_006_platform_identity_and_chat(conn) -> None:
    """
    Платформа uuid ↔ telegram (келешекте apple/google),
    AI чат тарихы (API + бот бір JSON схемасы).
    """
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS platform_identities (
            platform_user_id TEXT PRIMARY KEY NOT NULL,
            telegram_user_id INTEGER UNIQUE,
            apple_sub TEXT UNIQUE,
            google_sub TEXT UNIQUE,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS platform_ai_chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform_user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            body TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'unknown',
            client_id TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_platform_identities_telegram "
        "ON platform_identities(telegram_user_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_platform_chat_user_id "
        "ON platform_ai_chat_messages(platform_user_id, id)"
    )


def _migration_007_refresh_revoke_and_usage(conn) -> None:
    """
    Refresh token rotation (JTI revocation) және API usage ledger.
    """
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS revoked_refresh_jti (
            jti TEXT PRIMARY KEY NOT NULL,
            expires_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS api_usage_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            route TEXT NOT NULL,
            platform_user_id TEXT,
            telegram_user_id INTEGER,
            source_auth TEXT NOT NULL,
            units INTEGER NOT NULL DEFAULT 1,
            prompt_chars INTEGER,
            response_chars INTEGER,
            meta_json TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_ledger(created_at)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_api_usage_platform ON api_usage_ledger(platform_user_id, created_at)"
    )


def _migration_009_dhikr(conn) -> None:
    """Тасбих + зікір: `dhikr` кестесі және бастапқы жолдар."""
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS dhikr (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT NOT NULL UNIQUE,
            text_ar TEXT NOT NULL,
            text_kk TEXT,
            text_ru TEXT,
            text_en TEXT,
            default_target INTEGER NOT NULL DEFAULT 33,
            phase_rule TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_dhikr_sort ON dhikr(sort_order, id)")
    seeds: list[tuple] = [
        (
            1,
            "after_salah",
            "سُبْحَانَ اللَّهِ · الْحَمْدُ لِلَّهِ · اللَّهُ أَكْبَرُ",
            "Намаздан кейінгі тәсбих (33+33+33)",
            "Тасбих после намаза (33+33+33)",
            "Post-prayer tasbih (33+33+33)",
            99,
            "triple_salah",
            0,
        ),
        (
            2,
            "subhanallah",
            "سُبْحَانَ اللَّهِ",
            "СубханаЛлаһ",
            "СубханАллах",
            "SubhanAllah",
            33,
            None,
            10,
        ),
        (
            3,
            "alhamdulillah",
            "الْحَمْدُ لِلَّهِ",
            "Әлхамдулиллаһ",
            "Альхамдулиллях",
            "Alhamdulillah",
            33,
            None,
            20,
        ),
        (
            4,
            "allahu_akbar",
            "اللَّهُ أَكْبَرُ",
            "Аллаһу акбар",
            "Аллаху Акбар",
            "Allahu Akbar",
            33,
            None,
            30,
        ),
        (
            5,
            "subhan_wa_bihamdihi",
            "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
            "СубханаЛлаһи уа биҳамдиһи",
            "СубханАллахи ва бихамдихи",
            "SubhanAllahi wa bihamdihi",
            100,
            None,
            40,
        ),
        (
            6,
            "la_ilaha",
            "لَا إِلَٰهَ إِلَّا اللَّهُ",
            "Ла илаһа иллаллаһ",
            "Ля иляха илляллах",
            "La ilaha illa Allah",
            100,
            None,
            50,
        ),
        (
            7,
            "astaghfirullah",
            "أَسْتَغْفِرُ اللَّهَ",
            "Астағфируллаһ",
            "Астагфируллах",
            "Astaghfirullah",
            100,
            None,
            60,
        ),
        (
            8,
            "hasbunallah",
            "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
            "ҲасбунаЛлаһу уа ниғмал уәкил",
            "Хасбуналлаху ва ниъмаль-вакиль",
            "Hasbunallahu wa ni'mal wakeel",
            100,
            None,
            70,
        ),
        (
            9,
            "la_hawla",
            "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
            "Ла һаула уа ла қувватта илла биллаһ",
            "Ля хауля ва ля куввата илля биллях",
            "La hawla wa la quwwata illa billah",
            100,
            None,
            80,
        ),
        (
            10,
            "salawat_ibrahimiyya",
            "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
            "Аллаһумма салли 'алә Мухаммад",
            "Аллахумма салли 'аля Мухаммад",
            "Allahumma salli 'ala Muhammad",
            10,
            None,
            90,
        ),
        (
            11,
            "subhan_rabbil_adheem",
            "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
            "Субхана раббиәл-'азим",
            "Субхана Раббияль-Азим",
            "Subhana Rabbiyal-'Adheem",
            33,
            None,
            100,
        ),
        (
            12,
            "subhan_rabbiyal_aala",
            "سُبْحَانَ رَبِّيَ الْأَعْلَى",
            "Субхана раббиәл-а'ла",
            "Субхана Раббияль-А'ля",
            "Subhana Rabbiyal-A'la",
            33,
            None,
            110,
        ),
        (
            13,
            "bismillah",
            "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            "Бисмиллаһир-Рахманир-Рахим",
            "Бисмилляхир-Рахманир-Рахим",
            "Bismillahir-Rahmanir-Rahim",
            3,
            None,
            120,
        ),
        (
            14,
            "rabbana_atina",
            "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
            "Раббана әтина фид-дunya хасанatan…",
            "Раббана атина…",
            "Rabbana atina…",
            7,
            None,
            130,
        ),
        (
            15,
            "allahumma_barik",
            "اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
            "Аллаһумма барик 'алә Мухаммад",
            "Аллахумма барик 'аля Мухаммад",
            "Allahumma barik 'ala Muhammad",
            10,
            None,
            140,
        ),
    ]
    conn.executemany(
        """
        INSERT OR IGNORE INTO dhikr (id, slug, text_ar, text_kk, text_ru, text_en, default_target, phase_rule, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        seeds,
    )


def _migration_010_audit_events(conn) -> None:
    """Audit оқиғалары (AI, auth, т.б.) — governance_store.append_audit_event."""
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS audit_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            route TEXT NOT NULL,
            actor_type TEXT NOT NULL,
            platform_user_id TEXT,
            telegram_user_id INTEGER,
            summary TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action, created_at)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_audit_events_platform ON audit_events(platform_user_id, created_at)"
    )


def _migration_011_community_dua(conn) -> None:
    """Қауымдық дұға кестелері (қолданба ішінде бөлісу)."""
    from db.community_schema import ensure_community_tables

    ensure_community_tables(conn)


def _migration_012_user_hatim_and_password_login(conn) -> None:
    """Пароль логин ↔ uuid және хатым прогресі (сервер)."""
    from db.user_data_schema import ensure_user_data_tables

    ensure_user_data_tables(conn)


def _migration_013_oauth_and_phone_login(conn) -> None:
    """Google/Apple oauth_subject және телефон OTP кестелері."""
    from db.oauth_phone_schema import ensure_oauth_phone_tables

    ensure_oauth_phone_tables(conn)


def _migration_014_repair_user_data_tables(conn) -> None:
    """
    Кейбір снапшоттарда 12 нұсқа қолданылған деп жазылған, бірақ
    platform_password_logins / platform_hatim_read кестелері жоқ.
    CREATE IF NOT EXISTS — қайта құру қауіпсіз.
    """
    tables = _table_names(conn)
    if "platform_password_logins" in tables and "platform_hatim_read" in tables:
        return
    from db.user_data_schema import ensure_user_data_tables

    ensure_user_data_tables(conn)


MIGRATIONS: list[tuple[int, str, Callable]] = [
    (1, "indexes_and_fts_supporting", _migration_001_indexes),
    (2, "merge_legacy_users", _migration_002_merge_legacy_users),
    (3, "foreign_keys_user_preferences", _migration_003_foreign_keys),
    (4, "quran_kk_provenance", _migration_004_quran_kk_provenance),
    (5, "content_updated_at_quran_hadith", _migration_005_content_updated_at),
    (6, "platform_identity_and_chat", _migration_006_platform_identity_and_chat),
    (7, "refresh_revoke_and_usage_ledger", _migration_007_refresh_revoke_and_usage),
    (8, "platform_fk_chat_indexes_usage_fk", _migration_008_platform_fk_chat_indexes),
    (9, "dhikr_tasbih_seed", _migration_009_dhikr),
    (10, "audit_events", _migration_010_audit_events),
    (11, "community_dua", _migration_011_community_dua),
    (12, "user_hatim_and_password_login", _migration_012_user_hatim_and_password_login),
    (13, "oauth_and_phone_login", _migration_013_oauth_and_phone_login),
    (14, "repair_user_data_tables_if_missing", _migration_014_repair_user_data_tables),
]


def run_schema_migrations(db_path: str) -> None:
    with db_conn(db_path) as conn:
        _ensure_migrations_table(conn)
        applied = _applied_versions(conn)
        for version, name, fn in MIGRATIONS:
            if version in applied:
                continue
            try:
                fn(conn)
                conn.execute(
                    "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
                    (version, name),
                )
                logger.info("DB migration applied: %s %s", version, name)
            except Exception:
                logger.exception("DB migration failed: %s %s", version, name)
                raise
