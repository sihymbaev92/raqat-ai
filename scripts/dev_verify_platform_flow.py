#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Локальды тексеру: миграциялар → (опция) hadith seed синкі → API арқылы «бір user» ағымы.

Қолмен INSERT жоқ — тек `run_schema_migrations`, скрипттер және HTTP (TestClient).

Мысал:
  RAQAT_DB_PATH=./global_clean.db python scripts/dev_verify_platform_flow.py
  python scripts/dev_verify_platform_flow.py --db ./global_clean.db --hadith-seed
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]


def _default_db() -> str:
    raw = (os.getenv("RAQAT_DB_PATH") or os.getenv("DB_PATH") or "").strip()
    if raw:
        return str(Path(raw).expanduser().resolve())
    try:
        from config.settings import DB_PATH as _p

        return str(Path(_p).resolve())
    except Exception:
        return str((ROOT / "global_clean.db").resolve())


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--db", default=None, help="SQLite жолы (әдепкі: RAQAT_DB_PATH / DB_PATH / config.DB_PATH)")
    p.add_argument(
        "--telegram-user-id",
        type=int,
        default=987_654_321,
        help="Тест tg id (боттағы /start сияқты уникалды id)",
    )
    p.add_argument(
        "--hadith-seed",
        action="store_true",
        help="hadith_corpus_sync import-json (тек бар id-ға text_kk жаңарту, шағын seed)",
    )
    args = p.parse_args()

    db_path = str(Path(args.db or _default_db()).resolve())
    if not Path(db_path).is_file():
        print(f"DB file not found: {db_path}", file=sys.stderr)
        return 1

    os.environ["RAQAT_DB_PATH"] = db_path
    os.environ.setdefault("RAQAT_JWT_SECRET", "k" * 32)
    os.environ.setdefault("RAQAT_BOT_LINK_SECRET", "b" * 32)
    os.environ.setdefault("RAQAT_AI_PROXY_SECRET", "a" * 32)

    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))
    if str(ROOT / "platform_api") not in sys.path:
        sys.path.insert(0, str(ROOT / "platform_api"))

    from db.migrations import run_schema_migrations

    print("1) run_schema_migrations …")
    run_schema_migrations(db_path)
    print("   OK")

    if args.hadith_seed:
        seed = ROOT / "mobile" / "assets" / "bundled" / "hadith-sahih-seed.json"
        if not seed.is_file():
            print(f"SKIP --hadith-seed: missing {seed}", file=sys.stderr)
        else:
            print("2) hadith_corpus_sync import-json (seed) …")
            r = subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "scripts" / "hadith_corpus_sync.py"),
                    "import-json",
                    "--db",
                    db_path,
                    "--input",
                    str(seed),
                    "--allow-errors",
                ],
                cwd=str(ROOT),
            )
            if r.returncode != 0:
                print("   hadith import-json non-zero exit (allow_errors may still update rows)", file=sys.stderr)

    print("3) API: link/telegram → ai/chat → users/me/history …")
    from fastapi.testclient import TestClient

    from main import app

    tid = int(args.telegram_user_id)
    client = TestClient(app)
    r = client.post(
        "/api/v1/auth/link/telegram",
        json={"telegram_user_id": tid},
        headers={"X-Raqat-Bot-Link-Secret": os.environ["RAQAT_BOT_LINK_SECRET"]},
    )
    if r.status_code != 200:
        print(r.text, file=sys.stderr)
        return 2
    body = r.json()
    token = body.get("access_token")
    pid = body.get("platform_user_id")
    if not token or not pid:
        print(f"Bad link response: {body!r}", file=sys.stderr)
        return 2

    with mock.patch("ai_routes.generate_ai_reply", return_value="[dev_verify] assistant"):
        c = client.post(
            "/api/v1/ai/chat",
            json={"prompt": "[dev_verify] user prompt"},
            headers={"Authorization": f"Bearer {token}"},
        )
    if c.status_code != 200:
        print(c.text, file=sys.stderr)
        return 3

    hist = client.get("/api/v1/users/me/history", headers={"Authorization": f"Bearer {token}"})
    if hist.status_code != 200:
        print(hist.text, file=sys.stderr)
        return 4
    items = hist.json().get("items") or []
    if len(items) < 2:
        print(f"Expected at least 2 history items, got {len(items)}: {hist.json()!r}", file=sys.stderr)
        return 5
    # Тарих беті: ескі → жаңа; қайта жүргізуде элементтер көбейеді — соңғы жұпты тексереміз
    prev, last = items[-2], items[-1]
    if last.get("body") != "[dev_verify] assistant" or prev.get("body") != "[dev_verify] user prompt":
        print(f"Unexpected latest history pair: {prev!r} {last!r}", file=sys.stderr)
        return 5

    print("4) Read-only SQL тексеру …")
    from db.get_db import get_db_reader, is_postgresql_configured

    if is_postgresql_configured():
        q_one = "SELECT platform_user_id FROM platform_identities WHERE telegram_user_id = %s"
        q_cnt = "SELECT COUNT(*) AS c FROM platform_ai_chat_messages WHERE platform_user_id = %s"
        params = (tid,)
        params_pid = (str(pid),)
    else:
        q_one = "SELECT platform_user_id FROM platform_identities WHERE telegram_user_id = ?"
        q_cnt = "SELECT COUNT(*) AS c FROM platform_ai_chat_messages WHERE platform_user_id = ?"
        params = (tid,)
        params_pid = (str(pid),)

    with get_db_reader() as con:
        row = con.execute(q_one, params).fetchone()
        row_pid = None
        if row:
            if isinstance(row, dict):
                row_pid = row.get("platform_user_id")
            else:
                try:
                    row_pid = row["platform_user_id"]  # sqlite Row
                except Exception:
                    row_pid = row[0]
        if not row or str(row_pid) != str(pid):
            print("platform_identities: row mismatch", file=sys.stderr)
            return 6
        crow = con.execute(q_cnt, params_pid).fetchone()
        if isinstance(crow, dict):
            n_msg = crow.get("c", 0)
        else:
            try:
                n_msg = crow["c"]
            except Exception:
                n_msg = crow[0]
        if int(n_msg) < 2:
            print(f"platform_ai_chat_messages: expected >=2, got {n_msg}", file=sys.stderr)
            return 7

    print("--- Бәрі OK ---")
    print(f"    db={db_path}")
    print(f"    telegram_user_id={tid} platform_user_id={pid}")
    print(f"    history items={len(items)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
