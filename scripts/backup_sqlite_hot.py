#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite онлайн көшірме: sqlite3.Connection.backup() (uvicorn жүріп тұрғанда да қолдануға болады).

Мысал (репо түбірінен):
  python scripts/backup_sqlite_hot.py --source global_clean.db
  python scripts/backup_sqlite_hot.py --source global_clean.db --dest-dir backups/sqlite --keep-days 14

`--keep-days 0` — ескі файлдарды жоймау.
"""
from __future__ import annotations

import argparse
import os
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


def _resolve_source(raw: str, root: Path) -> Path:
    p = Path(raw).expanduser()
    if not p.is_absolute():
        p = (root / p).resolve()
    return p


def _prune(dest_dir: Path, stem: str, keep_days: int) -> int:
    if keep_days <= 0:
        return 0
    cutoff = time.time() - keep_days * 86400
    removed = 0
    pat = f"{stem}_*.db"
    for child in dest_dir.glob(pat):
        try:
            if child.is_file() and child.stat().st_mtime < cutoff:
                child.unlink()
                removed += 1
        except OSError:
            pass
    return removed


def backup(source: Path, dest_dir: Path) -> Path:
    if not source.is_file():
        raise FileNotFoundError(str(source))
    dest_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = dest_dir / f"{source.stem}_{ts}.db"

    src_conn = sqlite3.connect(str(source))
    try:
        dst_conn = sqlite3.connect(str(dest))
        try:
            src_conn.backup(dst_conn)
        finally:
            dst_conn.close()
    finally:
        src_conn.close()
    return dest


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--source",
        default=os.getenv("RAQAT_DB_PATH") or os.getenv("DB_PATH") or "global_clean.db",
        help="Көз SQLite (әдепті: RAQAT_DB_PATH, DB_PATH, немесе global_clean.db)",
    )
    ap.add_argument(
        "--dest-dir",
        type=Path,
        default=Path(os.getenv("RAQAT_SQLITE_BACKUP_DIR") or "backups/sqlite"),
        help="Мақсат қалта (әдепті: backups/sqlite)",
    )
    ap.add_argument(
        "--keep-days",
        type=int,
        default=int(os.getenv("RAQAT_SQLITE_BACKUP_KEEP_DAYS") or "14"),
        help="Осыдан артық ескі {stem}_*.db файлдарын жою (0 = жоймау)",
    )
    args = ap.parse_args()

    source = _resolve_source(args.source, root)
    dest_dir = args.dest_dir if args.dest_dir.is_absolute() else (root / args.dest_dir).resolve()

    out = backup(source, dest_dir)
    pruned = _prune(dest_dir, source.stem, args.keep_days)
    print(f"backup_ok path={out} pruned_old_files={pruned}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except FileNotFoundError as e:
        print(e, file=sys.stderr)
        raise SystemExit(2) from e
