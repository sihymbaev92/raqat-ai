#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GET/PUT/GET /api/v1/me/hatim — prod/local smoke (логин env арқылы).

  RAQAT_SMOKE_AUTH_PASSWORD='...' python scripts/smoke_hatim_api.py --api-base https://api.rahatomir.com
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any


def _put_json(url: str, payload: dict[str, Any], headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="PUT",
        headers={**headers, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def _post_json(url: str, payload: dict[str, Any], headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={**headers, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def _get(url: str, headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--api-base", default="http://127.0.0.1:8787")
    p.add_argument("--auth-username", default="")
    p.add_argument("--auth-password", default="")
    p.add_argument("--read-surahs", default="1,2,114", help="PUT payload (comma-separated)")
    args = p.parse_args()

    base = args.api_base.rstrip("/")
    user = (args.auth_username or os.getenv("RAQAT_SMOKE_AUTH_USERNAME") or os.getenv("RAQAT_AUTH_USERNAME") or "admin").strip()
    pw = (args.auth_password or os.getenv("RAQAT_SMOKE_AUTH_PASSWORD") or os.getenv("RAQAT_AUTH_PASSWORD") or "").strip()
    if not pw:
        print("[error] RAQAT_SMOKE_AUTH_PASSWORD немесе --auth-password", file=sys.stderr)
        return 1

    read_surahs = sorted({int(x.strip()) for x in args.read_surahs.split(",") if x.strip()})

    st_l, b_l = _post_json(f"{base}/api/v1/auth/login", {"username": user, "password": pw}, {})
    tok = b_l.get("access_token") if st_l == 200 else None
    if not tok:
        print(json.dumps({"login": {"status": st_l, "body": b_l}}, ensure_ascii=False, indent=2))
        return 2

    auth = {"Authorization": f"Bearer {tok}"}
    st_g, b_g = _get(f"{base}/api/v1/me/hatim", auth)
    if st_g != 200 or b_g.get("ok") is not True:
        print(json.dumps({"get": {"status": st_g, "body": b_g}}, ensure_ascii=False, indent=2))
        return 3

    st_p, b_p = _put_json(f"{base}/api/v1/me/hatim", {"read_surahs": read_surahs}, auth)
    if st_p != 200 or b_p.get("read_surahs") != read_surahs:
        print(json.dumps({"put": {"status": st_p, "body": b_p}}, ensure_ascii=False, indent=2))
        return 4

    st_v, b_v = _get(f"{base}/api/v1/me/hatim", auth)
    ok = st_v == 200 and b_v.get("read_surahs") == read_surahs
    out = {
        "api_base": base,
        "read_surahs": read_surahs,
        "before": b_g.get("read_surahs"),
        "after": b_v.get("read_surahs"),
        "ok": ok,
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))
    if not ok:
        return 5
    print("--- smoke_hatim_api: OK ---")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
