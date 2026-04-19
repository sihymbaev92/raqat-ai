#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smoke test: temp SQLite DB + migrations → password login (uuid sub) → GET/PUT /me/hatim.
Run from repo root:
  RAQAT_JWT_SECRET='x'*32 RAQAT_AUTH_PASSWORD=secret python3 scripts/dev_test_hatim_auth_api.py
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
_API = _ROOT / "platform_api"
for _p in (_ROOT, _API):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

os.environ.setdefault("RAQAT_JWT_SECRET", "dev_" * 8)
os.environ.setdefault("RAQAT_AUTH_USERNAME", "admin")
os.environ.setdefault("RAQAT_AUTH_PASSWORD", "testpass123")

from fastapi.testclient import TestClient

from db.migrations import run_schema_migrations


def main() -> int:
    jwt_secret = (os.environ.get("RAQAT_JWT_SECRET") or "").strip()
    if len(jwt_secret) < 32:
        print("Set RAQAT_JWT_SECRET (min 32 chars)", file=sys.stderr)
        return 1

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        os.environ["RAQAT_DB_PATH"] = db_path
        run_schema_migrations(db_path)

        from platform_api.main import app

        with TestClient(app) as client:
            r = client.post(
                "/api/v1/auth/login",
                json={
                    "username": os.environ["RAQAT_AUTH_USERNAME"],
                    "password": os.environ["RAQAT_AUTH_PASSWORD"],
                },
            )
            assert r.status_code == 200, r.text
            tok = r.json()
            access = tok["access_token"]
            assert tok.get("platform_user_id"), tok

            h = client.get("/api/v1/me/hatim", headers={"Authorization": f"Bearer {access}"})
            assert h.status_code == 200, h.text
            body = h.json()
            assert body["ok"] is True
            assert body["read_surahs"] == []

            u = client.put(
                "/api/v1/me/hatim",
                headers={"Authorization": f"Bearer {access}"},
                json={"read_surahs": [1, 2, 114]},
            )
            assert u.status_code == 200, u.text
            assert u.json()["read_surahs"] == [1, 2, 114]

            h2 = client.get("/api/v1/me/hatim", headers={"Authorization": f"Bearer {access}"})
            assert h2.json()["read_surahs"] == [1, 2, 114]

        print("OK:", json.dumps({"platform_user_id": tok.get("platform_user_id"), "hatim": [1, 2, 114]}))
        return 0
    finally:
        try:
            os.unlink(db_path)
        except OSError:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
