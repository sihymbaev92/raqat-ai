#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite → PostgreSQL: реттелген көшіру + индекстер + валидация.

Рет: (1) extension + schema bootstrap (2) advisory lock (3) identities → ledger → chat
(4) quran/hadith **COPY** (chunked) (5) updated_at индекстері (6) **setval** SERIAL
(7) validate.

PostgreSQL-та `platform_user_id` — UUID, әдепкі `gen_random_uuid()` (sqlite-тен
көшіргенде нақты uuid INSERT етіледі).

Мысал:
  pip install -r scripts/requirements-pg-migrate.txt
  python scripts/migrate_sqlite_to_postgres.py --sqlite ./global_clean.db --pg-dsn "$PG_DSN" \\
    --bootstrap-ddl --with-quran-hadith --truncate --validate

Опциялар: `--sanitize-sqlite-fk` — PG FK үшін sqlite көшірмесінде жетім chat жолдарын жою /
usage.platform_user_id NULL (файл өзгереді; көшірмеға қолданыңыз).

`--skip-advisory-lock` — PostgreSQL `pg_try_advisory_lock` өшіріледі (екі көшіру бір уақытта соқтығысқанда ғана).

`--resume` — дәрек көзімен жол саны сәйкес келген кестені қайта көшіруді өткізіп жібереді (қайта іске қосу).
Жартылай COPY қалғанда жол сандары сәйкеспейді — алдымен `--truncate` немесе қолмен TRUNCATE.

Көлемді `quran` / `hadith`: әдепкі **COPY FROM STDIN** (chunked оқу); кіші кестелер — `executemany`.
"""
from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# gen_random_uuid(): PG 13+ ядро; ескі нұсқалар үшін pgcrypto.
EXTENSIONS_SQL = """
CREATE EXTENSION IF NOT EXISTS pgcrypto;
"""

BOOTSTRAP_DDL = """
CREATE TABLE IF NOT EXISTS platform_identities (
    platform_user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT UNIQUE,
    apple_sub TEXT UNIQUE,
    google_sub TEXT UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS platform_ai_chat_messages (
    id BIGSERIAL PRIMARY KEY,
    platform_user_id UUID NOT NULL REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    body TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'unknown',
    client_id TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS revoked_refresh_jti (
    jti TEXT PRIMARY KEY NOT NULL,
    expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS api_usage_ledger (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    route TEXT NOT NULL,
    platform_user_id UUID REFERENCES platform_identities(platform_user_id) ON DELETE SET NULL,
    telegram_user_id BIGINT,
    source_auth TEXT NOT NULL,
    units INTEGER NOT NULL DEFAULT 1,
    prompt_chars INTEGER,
    response_chars INTEGER,
    meta_json TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quran (
    id BIGINT PRIMARY KEY,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    surah_name TEXT,
    text_ar TEXT,
    text_kk TEXT,
    text_ru TEXT,
    text_en TEXT,
    translit TEXT,
    updated_at TEXT
);
CREATE TABLE IF NOT EXISTS hadith (
    id BIGINT PRIMARY KEY,
    source TEXT,
    text_ar TEXT,
    text_kk TEXT,
    text_ru TEXT,
    text_en TEXT,
    grade TEXT,
    updated_at TEXT,
    is_repeated SMALLINT NOT NULL DEFAULT 0,
    original_id BIGINT NULL
);
CREATE INDEX IF NOT EXISTS idx_platform_chat_user_id ON platform_ai_chat_messages(platform_user_id, id);
CREATE INDEX IF NOT EXISTS idx_platform_chat_user_created ON platform_ai_chat_messages(platform_user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_chat_user_client
    ON platform_ai_chat_messages(platform_user_id, client_id)
    WHERE client_id IS NOT NULL AND BTRIM(client_id) <> '';
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_platform ON api_usage_ledger(platform_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_quran_surah_ayah ON quran(surah, ayah);
"""

# Көлемді кестелерден кейін — /metadata/changes since сұраулары үшін.
INDEXES_AFTER_BULK_SQL = """
CREATE INDEX IF NOT EXISTS idx_quran_updated_at ON quran(updated_at);
CREATE INDEX IF NOT EXISTS idx_hadith_updated_at ON hadith(updated_at);
CREATE INDEX IF NOT EXISTS idx_hadith_is_repeated ON hadith(is_repeated);
CREATE INDEX IF NOT EXISTS idx_hadith_original_id ON hadith(original_id);
"""

# COPY кезінде id көрсетілген кестелерде SERIAL/IDENTITY келесі INSERT үшін синхрондау керек.
_SETVAL_TABLES = (
    "api_usage_ledger",
    "platform_ai_chat_messages",
    "quran",
    "hadith",
)


def _sqlite_conn(path: str) -> sqlite3.Connection:
    c = sqlite3.connect(path)
    c.row_factory = sqlite3.Row
    return c


def _pg_connect(dsn: str):
    import psycopg

    return psycopg.connect(dsn)


# Барлық migrate сеанстары үшін бір кілт (келесі мажор өзгерісте өзгертуге болады).
_MIGRATE_ADVISORY_LOCK_KEY = 0x52415141545F4D47  # 'RAQAT_MG'


def _pg_try_migrate_lock(pg) -> bool:
    with pg.cursor() as cur:
        cur.execute("SELECT pg_try_advisory_lock(%s::bigint)", (_MIGRATE_ADVISORY_LOCK_KEY,))
        ok = bool(cur.fetchone()[0])
    pg.commit()
    return ok


def _pg_unlock_migrate_lock(pg) -> None:
    try:
        with pg.cursor() as cur:
            cur.execute("SELECT pg_advisory_unlock(%s::bigint)", (_MIGRATE_ADVISORY_LOCK_KEY,))
        pg.commit()
    except Exception:
        pass


def _iter_sqlite_rows(
    sq: sqlite3.Connection,
    table: str,
    columns: tuple[str, ...],
    *,
    batch: int,
):
    col_list = ", ".join(columns)
    cur = sq.execute(f"SELECT {col_list} FROM {table}")
    while True:
        chunk = cur.fetchmany(batch)
        if not chunk:
            break
        for r in chunk:
            yield tuple(r[c] for c in columns)


def _copy_table_copy_stdin(
    sq: sqlite3.Connection,
    pg,
    table: str,
    columns: tuple[str, ...],
    *,
    truncate_pg: bool,
    sqlite_fetch_batch: int = 10_000,
) -> int:
    """
    PostgreSQL COPY FROM STDIN — quran/hadith сияқты үлкен кестелер үшін.
    """
    if not _table_exists_sqlite(sq, table):
        return 0
    cnt = int(sq.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"])
    if cnt == 0:
        return 0
    col_sql = ", ".join(columns)
    copy_stmt = f'COPY "{table}" ({col_sql}) FROM STDIN'
    with pg.cursor() as cur:
        if truncate_pg:
            cur.execute(f'TRUNCATE TABLE "{table}" CASCADE')
        with cur.copy(copy_stmt) as copy:
            for row in _iter_sqlite_rows(
                sq, table, columns, batch=sqlite_fetch_batch
            ):
                copy.write_row(row)
    pg.commit()
    return cnt


def _table_exists_sqlite(conn: sqlite3.Connection, name: str) -> bool:
    r = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
        (name,),
    ).fetchone()
    return bool(r)


def _prepare_sqlite_fk_for_pg_copy(sq: sqlite3.Connection) -> None:
    """
    PG bootstrap-та FK бар: жетім chat / usage жолдарын алдын ала тазалаймыз
    (sqlite миграция 008 болмаған копиялар үшін).
    """
    if _table_exists_sqlite(sq, "platform_ai_chat_messages") and _table_exists_sqlite(
        sq, "platform_identities"
    ):
        sq.execute(
            """
            DELETE FROM platform_ai_chat_messages
            WHERE platform_user_id NOT IN (
                SELECT platform_user_id FROM platform_identities
            )
            """
        )
    if _table_exists_sqlite(sq, "api_usage_ledger") and _table_exists_sqlite(
        sq, "platform_identities"
    ):
        sq.execute(
            """
            UPDATE api_usage_ledger
            SET platform_user_id = NULL
            WHERE platform_user_id IS NOT NULL
              AND platform_user_id NOT IN (
                  SELECT platform_user_id FROM platform_identities
              )
            """
        )
    sq.commit()


def _count_sqlite(conn: sqlite3.Connection, table: str) -> int | None:
    if not _table_exists_sqlite(conn, table):
        return None
    return int(conn.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"])


_PG_COUNT_WHITELIST = frozenset(
    {
        "platform_identities",
        "platform_ai_chat_messages",
        "revoked_refresh_jti",
        "api_usage_ledger",
        "quran",
        "hadith",
    }
)


def _pg_rowcount_matches_sqlite_for_resume(
    sq: sqlite3.Connection, pg, table: str, *, resume: bool
) -> bool:
    if not resume:
        return False
    sc = _count_sqlite(sq, table)
    if sc is None or sc < 1:
        return False
    with pg.cursor() as cur:
        pc = _count_pg(cur, table)
    return pc is not None and pc == sc


def _count_pg(cur, table: str) -> int | None:
    if table not in _PG_COUNT_WHITELIST:
        return None
    try:
        cur.execute(f'SELECT COUNT(*) FROM "{table}"')
        return int(cur.fetchone()[0])
    except Exception:
        return None


def _truncate_pg_tables(pg, tables: tuple[str, ...]) -> None:
    with pg.cursor() as cur:
        for t in tables:
            cur.execute(f"TRUNCATE TABLE {t} CASCADE")
    pg.commit()


def _copy_simple_table(
    sq: sqlite3.Connection,
    pg,
    table: str,
    columns: tuple[str, ...],
    *,
    truncate_pg: bool,
) -> int:
    if not _table_exists_sqlite(sq, table):
        return 0
    rows = sq.execute(f"SELECT {', '.join(columns)} FROM {table}").fetchall()
    if not rows:
        return 0
    placeholders = ", ".join(["%s"] * len(columns))
    col_list = ", ".join(columns)
    with pg.cursor() as cur:
        if truncate_pg:
            cur.execute(f"TRUNCATE TABLE {table} CASCADE")
        cur.executemany(
            f"INSERT INTO {table} ({col_list}) VALUES ({placeholders})",
            [tuple(r[c] for c in columns) for r in rows],
        )
    pg.commit()
    return len(rows)


def _validate_counts(sq: sqlite3.Connection, pg, tables: tuple[str, ...]) -> bool:
    ok = True
    with pg.cursor() as cur:
        for t in tables:
            sc = _count_sqlite(sq, t)
            pc = _count_pg(cur, t)
            if sc is None and pc is None:
                print(f"[validate] {t}: skip (missing both)")
                continue
            if sc is None or pc is None:
                print(f"[validate] {t}: MISMATCH missing side sqlite={sc} pg={pc}")
                ok = False
                continue
            if sc != pc:
                print(f"[validate] {t}: COUNT_MISMATCH sqlite={sc} pg={pc}")
                ok = False
            else:
                print(f"[validate] {t}: OK count={sc}")
    return ok


def _fix_pg_sequences_after_bulk_copy(pg) -> None:
    """BIGSERIAL/IDENTITY: MAX(id) бойынша setval (COPY id көрсетілген кезде міндетті)."""
    with pg.cursor() as cur:
        for table in _SETVAL_TABLES:
            try:
                cur.execute(f'SELECT MAX(id) FROM "{table}"')
                r = cur.fetchone()
                mx = int(r[0]) if r and r[0] is not None else 0
                cur.execute(
                    "SELECT pg_get_serial_sequence(%s, 'id')",
                    (table,),
                )
                srow = cur.fetchone()
                seq = srow[0] if srow else None
                if not seq:
                    continue
                if mx < 1:
                    cur.execute("SELECT setval(%s::regclass, 1, false)", (seq,))
                else:
                    cur.execute("SELECT setval(%s::regclass, %s, true)", (seq, mx))
            except Exception as exc:
                print(f"[setval] skip {table}: {exc}", file=sys.stderr)
    pg.commit()
    print("Phase 6.5: SERIAL/IDENTITY sequences aligned to MAX(id).")


def _validate_updated_at_samples(sq: sqlite3.Connection, pg) -> None:
    for t in ("quran", "hadith"):
        if not _table_exists_sqlite(sq, t):
            continue
        cols = {row[1] for row in sq.execute(f"PRAGMA table_info({t})").fetchall()}
        if "updated_at" not in cols:
            print(f"[validate] {t}.updated_at: no column in sqlite")
            continue
        n_null = int(
            sq.execute(
                f"SELECT COUNT(*) FROM {t} WHERE updated_at IS NULL OR TRIM(COALESCE(updated_at,'')) = ''"
            ).fetchone()[0]
        )
        print(f"[validate] {t}.updated_at empty rows in sqlite: {n_null}")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--sqlite", required=True, help="SQLite db path")
    p.add_argument("--pg-dsn", required=True, help="postgresql://...")
    p.add_argument("--bootstrap-ddl", action="store_true", help="CREATE EXTENSION + tables on PG")
    p.add_argument(
        "--with-quran-hadith",
        action="store_true",
        help="Copy quran + hadith (large; optional)",
    )
    p.add_argument("--truncate", action="store_true", help="TRUNCATE before insert (dangerous)")
    p.add_argument(
        "--validate",
        action="store_true",
        help="After copy (or alone with existing data): compare row counts",
    )
    p.add_argument(
        "--validate-only",
        action="store_true",
        help="Only run validation (no copy)",
    )
    p.add_argument(
        "--sanitize-sqlite-fk",
        action="store_true",
        help="SQLite файлында жетім chat жолдарын жою және usage.platform_user_id NULL (PG FK үшін; файл өзгереді)",
    )
    p.add_argument(
        "--skip-advisory-lock",
        action="store_true",
        help="pg_try_advisory_lock өшіріледі (әдепкі: көшіру кезінде қосылады)",
    )
    p.add_argument(
        "--copy-fetch-batch",
        type=int,
        default=10_000,
        metavar="N",
        help="SQLite-тан COPY үшін fetchmany өлшемі (әдепкі 10000)",
    )
    p.add_argument(
        "--resume",
        action="store_true",
        help="PG кестесіндегі жол саны SQLite-пен толық сәйкес болса осы кестені қайта көшіруді өткізіп жіберу "
        "(қайта іске қосу; жартылай көшірмеден кейін қайта көшу үшін алдымен TRUNCATE не тазалау қажет)",
    )
    args = p.parse_args()

    try:
        pg = _pg_connect(args.pg_dsn)
    except Exception as e:
        print("PostgreSQL connection failed:", e, file=sys.stderr)
        return 2

    sq = _sqlite_conn(args.sqlite)

    if args.validate_only:
        tables = (
            "platform_identities",
            "platform_ai_chat_messages",
            "revoked_refresh_jti",
            "api_usage_ledger",
            "quran",
            "hadith",
        )
        ok = _validate_counts(sq, pg, tables)
        _validate_updated_at_samples(sq, pg)
        sq.close()
        pg.close()
        return 0 if ok else 3

    if not args.skip_advisory_lock:
        if not _pg_try_migrate_lock(pg):
            print(
                "migrate: PostgreSQL advisory lock алынбады — басқа migrate сеансы жүріп жатыр "
                "немесе алдыңғы сеанс құлап lock қалды. Күтіңіз немесе --skip-advisory-lock (сақ емес).",
                file=sys.stderr,
            )
            sq.close()
            pg.close()
            return 4

    exit_code = 0
    try:
        exit_code = _migrate_body(args, sq, pg)
    finally:
        if not args.skip_advisory_lock:
            _pg_unlock_migrate_lock(pg)
        sq.close()
        pg.close()
    return exit_code


def _migrate_body(args, sq: sqlite3.Connection, pg) -> int:
    """Негізгі көшіру (advisory lock main() ішінде алынған)."""
    if args.truncate and not args.bootstrap_ddl:
        print(
            "WARN: --truncate without --bootstrap-ddl: PG кестелері бар деп болжанады.",
            file=sys.stderr,
        )

    if args.bootstrap_ddl:
        with pg.cursor() as cur:
            cur.execute(EXTENSIONS_SQL)
            cur.execute(BOOTSTRAP_DDL)
        pg.commit()
        print("Phase 1: extensions + schema bootstrap OK.")

    if args.truncate:
        _truncate_pg_tables(
            pg,
            (
                "platform_ai_chat_messages",
                "platform_identities",
                "api_usage_ledger",
                "revoked_refresh_jti",
                "hadith",
                "quran",
            ),
        )
        print("Phase 2: TRUNCATE CASCADE on target tables.")

    total = 0
    t = args.truncate

    if args.sanitize_sqlite_fk:
        _prepare_sqlite_fk_for_pg_copy(sq)

    # Phase 3–5: identities (FK parent) → кіші кестелер → chat (FK child)
    phase_identity: list[tuple[str, tuple[str, ...]]] = [
        (
            "platform_identities",
            ("platform_user_id", "telegram_user_id", "apple_sub", "google_sub", "created_at", "updated_at"),
        ),
    ]
    for name, cols in phase_identity:
        if not _table_exists_sqlite(sq, name):
            print(f"skip (missing in sqlite): {name}")
            continue
        if _pg_rowcount_matches_sqlite_for_resume(sq, pg, name, resume=args.resume):
            print(f"[resume] skip copy {name}: counts already match sqlite")
            continue
        n = _copy_simple_table(sq, pg, name, cols, truncate_pg=False)
        print(f"copy {name}: {n} rows")
        total += n

    phase_small: list[tuple[str, tuple[str, ...]]] = [
        ("revoked_refresh_jti", ("jti", "expires_at")),
        (
            "api_usage_ledger",
            (
                "event_type",
                "route",
                "platform_user_id",
                "telegram_user_id",
                "source_auth",
                "units",
                "prompt_chars",
                "response_chars",
                "meta_json",
                "created_at",
            ),
        ),
    ]
    for name, cols in phase_small:
        if not _table_exists_sqlite(sq, name):
            print(f"skip (missing in sqlite): {name}")
            continue
        if _pg_rowcount_matches_sqlite_for_resume(sq, pg, name, resume=args.resume):
            print(f"[resume] skip copy {name}: counts already match sqlite")
            continue
        n = _copy_simple_table(sq, pg, name, cols, truncate_pg=False)
        print(f"copy {name}: {n} rows")
        total += n

    phase_chat: list[tuple[str, tuple[str, ...]]] = [
        (
            "platform_ai_chat_messages",
            ("platform_user_id", "role", "body", "source", "client_id", "created_at"),
        ),
    ]
    for name, cols in phase_chat:
        if not _table_exists_sqlite(sq, name):
            print(f"skip (missing in sqlite): {name}")
            continue
        if _pg_rowcount_matches_sqlite_for_resume(sq, pg, name, resume=args.resume):
            print(f"[resume] skip copy {name}: counts already match sqlite")
            continue
        n = _copy_simple_table(sq, pg, name, cols, truncate_pg=False)
        print(f"copy {name}: {n} rows")
        total += n

    if args.with_quran_hadith:
        qcols_all = (
            "id",
            "surah",
            "ayah",
            "surah_name",
            "text_ar",
            "text_kk",
            "text_ru",
            "text_en",
            "translit",
            "updated_at",
        )
        if _table_exists_sqlite(sq, "quran"):
            have = {row[1] for row in sq.execute("PRAGMA table_info(quran)").fetchall()}
            cols = tuple(c for c in qcols_all if c in have)
            if cols:
                if _pg_rowcount_matches_sqlite_for_resume(sq, pg, "quran", resume=args.resume):
                    print("[resume] skip copy quran: counts already match sqlite")
                else:
                    n = _copy_table_copy_stdin(
                        sq,
                        pg,
                        "quran",
                        cols,
                        truncate_pg=t,
                        sqlite_fetch_batch=max(100, int(args.copy_fetch_batch)),
                    )
                    print(f"copy quran (COPY): {n} rows")
                    total += n
        hcols_all = ("id", "source", "text_ar", "text_kk", "text_ru", "text_en", "grade", "updated_at")
        if _table_exists_sqlite(sq, "hadith"):
            hhave = {row[1] for row in sq.execute("PRAGMA table_info(hadith)").fetchall()}
            hcols2 = tuple(c for c in hcols_all if c in hhave)
            if hcols2:
                if _pg_rowcount_matches_sqlite_for_resume(sq, pg, "hadith", resume=args.resume):
                    print("[resume] skip copy hadith: counts already match sqlite")
                else:
                    n2 = _copy_table_copy_stdin(
                        sq,
                        pg,
                        "hadith",
                        hcols2,
                        truncate_pg=t,
                        sqlite_fetch_batch=max(100, int(args.copy_fetch_batch)),
                    )
                    print(f"copy hadith (COPY): {n2} rows")
                    total += n2

    # Phase 6: updated_at индекстері (IF NOT EXISTS; көлемді деректерден кейін)
    try:
        with pg.cursor() as cur:
            cur.execute(INDEXES_AFTER_BULK_SQL)
        pg.commit()
        print("Phase 6: updated_at indexes ensured.")
    except Exception as exc:
        print("Phase 6 index warning:", exc, file=sys.stderr)

    try:
        _fix_pg_sequences_after_bulk_copy(pg)
    except Exception as exc:
        print("Phase 6.5 setval warning:", exc, file=sys.stderr)

    exit_code = 0
    if args.validate:
        tables = (
            "platform_identities",
            "platform_ai_chat_messages",
            "revoked_refresh_jti",
            "api_usage_ledger",
        )
        if args.with_quran_hadith:
            tables += ("quran", "hadith")
        ok = _validate_counts(sq, pg, tables)
        _validate_updated_at_samples(sq, pg)
        if not ok:
            print("Validation reported mismatches.", file=sys.stderr)
            exit_code = 3

    print("done, total rows copied (approx):", total)
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
