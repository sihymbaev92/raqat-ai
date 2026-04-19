#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Platform API қысқа smoke: /health, /ready, (опция) metadata/changes, quran/surahs.

Legacy (`main.py`) және `app.main` (`success`/`data` орамы) екі жауап пішінін де тануға тырысады.

Мысал:
  .venv/bin/python scripts/smoke_platform_api.py --api-base http://127.0.0.1:8787
  .venv/bin/python scripts/smoke_platform_api.py --api-base http://127.0.0.1:8788 --content-secret "$S" --metadata

Bootstrap логин + /users/me (құпияны env арқылы беру ұсынылады):
  RAQAT_SMOKE_AUTH_PASSWORD='...' .venv/bin/python scripts/smoke_platform_api.py --api-base http://127.0.0.1:8787 --auth-login
  (опция: RAQAT_SMOKE_AUTH_USERNAME, әдепкі admin)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any


def _http(
    url: str,
    *,
    headers: dict[str, str],
    method: str = "GET",
    data: bytes | None = None,
    timeout: float = 15.0,
) -> tuple[int, dict[str, Any]]:
    req = urllib.request.Request(url, headers=headers, method=method, data=data)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            body: dict[str, Any] = json.loads(raw) if raw.strip() else {}
            return resp.status, body
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def _unwrap(body: dict[str, Any]) -> dict[str, Any]:
    if body.get("success") and isinstance(body.get("data"), dict):
        return body["data"]
    return body


def _health_ok(body: dict[str, Any]) -> bool:
    d = _unwrap(body)
    return d.get("status") == "ok" or (body.get("success") and d.get("status") == "ok")


def _ready_ok(status: int, body: dict[str, Any]) -> bool:
    if status != 200:
        return False
    d = _unwrap(body)
    if d.get("ok") is True:
        return True
    deps = d.get("dependencies")
    if isinstance(deps, dict) and deps.get("ok") is True:
        return True
    return False


def _http_post_json(
    url: str,
    *,
    headers: dict[str, str],
    payload: dict[str, Any],
    timeout: float = 15.0,
) -> tuple[int, dict[str, Any]]:
    data = json.dumps(payload).encode("utf-8")
    h = {**headers, "Content-Type": "application/json"}
    return _http(url, headers=h, method="POST", data=data, timeout=timeout)


def _extract_access_token(body: dict[str, Any]) -> str | None:
    """Legacy auth (`ok` + токендер түбінде) немесе `app.main` (`success` + `data`)."""
    if body.get("ok") is True and isinstance(body.get("access_token"), str):
        return body["access_token"]
    d = _unwrap(body)
    if isinstance(d.get("access_token"), str):
        return d["access_token"]
    return None


def _extract_users_me_sub(body: dict[str, Any]) -> str | None:
    if isinstance(body.get("sub"), str):
        return body["sub"]
    d = _unwrap(body)
    if isinstance(d.get("sub"), str):
        return d["sub"]
    return None


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--api-base", default="http://127.0.0.1:8787", help="Platform API base URL")
    p.add_argument("--content-secret", default="", help="X-Raqat-Content-Secret")
    p.add_argument("--metadata", action="store_true", help="GET /api/v1/metadata/changes")
    p.add_argument("--if-none-match", default="", dest="if_none_match", help="metadata If-None-Match")
    p.add_argument(
        "--auth-login",
        action="store_true",
        help="POST /api/v1/auth/login + GET /api/v1/users/me (RAQAT_SMOKE_AUTH_PASSWORD немесе --auth-password)",
    )
    p.add_argument("--auth-username", default="", help="Әдепкі: RAQAT_SMOKE_AUTH_USERNAME немесе admin")
    p.add_argument(
        "--auth-password",
        default="",
        help="Құпия (argv-да көрінеді); бос болса RAQAT_SMOKE_AUTH_PASSWORD env",
    )
    args = p.parse_args()

    base = args.api_base.rstrip("/")
    headers: dict[str, str] = {}
    sec = args.content_secret.strip()
    if sec:
        headers["X-Raqat-Content-Secret"] = sec

    out: dict[str, Any] = {"api_base": base, "checks": {}}

    st, b = _http(f"{base}/health", headers=headers)
    out["checks"]["/health"] = {"status": st, "ok": _health_ok(b)}
    if not _health_ok(b):
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 2

    st, b = _http(f"{base}/ready", headers=headers)
    out["checks"]["/ready"] = {"status": st, "ok": _ready_ok(st, b)}
    if not _ready_ok(st, b):
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 3

    st, b = _http(f"{base}/api/v1/quran/surahs", headers=headers)
    d = _unwrap(b)
    surahs = d.get("surahs")
    ok_surahs = st == 200 and isinstance(surahs, list) and len(surahs) > 0
    out["checks"]["/api/v1/quran/surahs"] = {"status": st, "ok": ok_surahs, "count": len(surahs) if isinstance(surahs, list) else 0}
    if not ok_surahs:
        if st in (401, 403) and not sec:
            out["checks"]["/api/v1/quran/surahs"]["hint"] = "try --content-secret if API enforces X-Raqat-Content-Secret"
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 4

    if args.metadata:
        h2 = dict(headers)
        if args.if_none_match.strip():
            h2["If-None-Match"] = args.if_none_match.strip()
        url = f"{base}/api/v1/metadata/changes"
        st, b = _http(url, headers=h2)
        ok_meta = st in (200, 304)
        out["checks"]["/api/v1/metadata/changes"] = {"status": st, "ok": ok_meta}
        if st == 200 and isinstance(b, dict):
            du = _unwrap(b)
            out["checks"]["/api/v1/metadata/changes"]["body_ok"] = "quran_changed" in du or du.get("ok") is not None
        if not ok_meta:
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 5

    if args.auth_login:
        user = (args.auth_username or os.getenv("RAQAT_SMOKE_AUTH_USERNAME") or "admin").strip() or "admin"
        pw = (args.auth_password or os.getenv("RAQAT_SMOKE_AUTH_PASSWORD") or "").strip()
        if not pw:
            print(
                "[error] --auth-login: RAQAT_SMOKE_AUTH_PASSWORD орнатыңыз немесе --auth-password беріңіз.",
                file=sys.stderr,
            )
            return 6
        st_l, b_l = _http_post_json(
            f"{base}/api/v1/auth/login",
            headers=headers,
            payload={"username": user, "password": pw},
        )
        tok = _extract_access_token(b_l)
        ok_login = st_l == 200 and bool(tok)
        out["checks"]["POST /api/v1/auth/login"] = {"status": st_l, "ok": ok_login}
        if not ok_login:
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 7
        auth_h = {**headers, "Authorization": f"Bearer {tok}"}
        st_m, b_m = _http(f"{base}/api/v1/users/me", headers=auth_h)
        sub = _extract_users_me_sub(b_m)
        ok_me = st_m == 200 and bool(sub)
        out["checks"]["GET /api/v1/users/me"] = {
            "status": st_m,
            "ok": ok_me,
            "sub": sub,
            "matches_login_user": (sub == user) if sub else False,
        }
        if not ok_me:
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 8

    print(json.dumps(out, ensure_ascii=False, indent=2))
    print("--- smoke_platform_api: OK ---")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
