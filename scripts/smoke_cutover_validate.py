#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cutover кейінгі тексеру: PG көшірме валидациясы (жол саны) + HTTP smoke.

Мысал:
  export PG_DSN='postgresql://...'
  .venv/bin/python scripts/smoke_cutover_validate.py \\
    --sqlite ./global_clean.db --pg-dsn "$PG_DSN" --api-base http://127.0.0.1:8787
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--sqlite", required=True, help="SQLite path (салыстыру үшін)")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--pg-dsn", help="postgresql://...")
    g.add_argument("--pg", dest="pg_dsn_alt", help="= --pg-dsn")
    p.add_argument("--api-base", default="http://127.0.0.1:8787")
    p.add_argument("--content-secret", default="", help="smoke_platform_api үшін")
    p.add_argument("--skip-validate", action="store_true", help="Тек HTTP smoke")
    p.add_argument("--skip-http", action="store_true", help="Тек validate_pg_copy")
    args = p.parse_args()
    dsn = args.pg_dsn or args.pg_dsn_alt

    sqlite = str(Path(args.sqlite).expanduser().resolve())

    if not args.skip_validate:
        vcmd = [
            sys.executable,
            str(ROOT / "scripts" / "validate_pg_copy.py"),
            "--sqlite",
            sqlite,
        ]
        if args.pg_dsn:
            vcmd.extend(["--pg-dsn", args.pg_dsn])
        else:
            vcmd.extend(["--pg", dsn])
        v = subprocess.run(vcmd, cwd=str(ROOT))
        if v.returncode != 0:
            return v.returncode

    if not args.skip_http:
        cmd = [
            sys.executable,
            str(ROOT / "scripts" / "smoke_platform_api.py"),
            "--api-base",
            args.api_base,
        ]
        if args.content_secret.strip():
            cmd.extend(["--content-secret", args.content_secret.strip()])
        h = subprocess.run(cmd, cwd=str(ROOT))
        if h.returncode != 0:
            return h.returncode

    print("--- smoke_cutover_validate: OK ---")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
