#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cross-device sync smoke: бір JWT аккаунтта екі құрылғы merge симуляциясы.

Қажет: RAQAT_SMOKE_AUTH_PASSWORD (немесе --auth-password), API base (prod/local).

Сценарий (mobile merge логикасына сәйкес):
  1) Device A: hatim [1,2], bookmarks [36] → серверге push
  2) Device B: hatim local [114], bookmarks local [1] → remote merge → push
  3) Device A: қайта pull → union [1,2,114] hatim, [1,36] bookmarks

  python scripts/smoke_cross_device_sync.py --api-base https://api.rahatomir.com
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
    method: str = "GET",
    headers: dict[str, str] | None = None,
    payload: dict[str, Any] | None = None,
) -> tuple[int, dict[str, Any]]:
    h = dict(headers or {})
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def _sort_unique(nums: list[int]) -> list[int]:
    return sorted({n for n in nums if 1 <= n <= 114})


def _merge_bookmarks(local: list[int], remote: list[int]) -> list[int]:
    return _sort_unique(local + remote)


def _merge_hatim(local: list[int], remote: list[int]) -> list[int]:
    return _sort_unique(local + remote)


def _login(base: str, user: str, password: str) -> str:
    st, body = _http(
        f"{base}/api/v1/auth/login",
        method="POST",
        payload={"username": user, "password": password},
    )
    tok = body.get("access_token") if isinstance(body, dict) else None
    if st != 200 or not tok:
        raise RuntimeError(f"login failed status={st} body={body!r}")
    return str(tok)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--api-base", default=os.getenv("RAQAT_PLATFORM_API_BASE", "https://api.rahatomir.com"))
    p.add_argument("--auth-username", default="")
    p.add_argument("--auth-password", default="")
    args = p.parse_args()

    base = args.api_base.rstrip("/")
    user = (args.auth_username or os.getenv("RAQAT_SMOKE_AUTH_USERNAME") or "raqat-smoke").strip()
    pw = (args.auth_password or os.getenv("RAQAT_SMOKE_AUTH_PASSWORD") or "").strip()
    if not pw:
        print("[error] RAQAT_SMOKE_AUTH_PASSWORD керек (немесе --auth-password)", file=sys.stderr)
        return 2

    token = _login(base, user, pw)
    auth = {"Authorization": f"Bearer {token}"}

    # Device A — push baseline
    st_a_h, _ = _http(f"{base}/api/v1/me/hatim", method="PUT", headers=auth, payload={"read_surahs": [1, 2]})
    st_a_b, _ = _http(f"{base}/api/v1/me/quran-bookmarks", method="PUT", headers=auth, payload={"surahs": [36]})
    if st_a_h != 200 or st_a_b != 200:
        print(f"FAIL device A push hatim={st_a_h} bookmarks={st_a_b}", file=sys.stderr)
        return 3

    # Device B — local state + merge from server
    st_g_h, body_g_h = _http(f"{base}/api/v1/me/hatim", headers=auth)
    st_g_b, body_g_b = _http(f"{base}/api/v1/me/quran-bookmarks", headers=auth)
    if st_g_h != 200 or st_g_b != 200:
        print("FAIL device B fetch remote", file=sys.stderr)
        return 4

    remote_hatim = _sort_unique(list(body_g_h.get("read_surahs") or []))
    remote_bookmarks = _sort_unique(list(body_g_b.get("surahs") or []))
    device_b_hatim_local = [114]
    device_b_bookmarks_local = [1]
    merged_hatim = _merge_hatim(device_b_hatim_local, remote_hatim)
    merged_bookmarks = _merge_bookmarks(device_b_bookmarks_local, remote_bookmarks)

    st_b_h, body_b_h = _http(
        f"{base}/api/v1/me/hatim",
        method="PUT",
        headers=auth,
        payload={"read_surahs": merged_hatim},
    )
    st_b_b, body_b_b = _http(
        f"{base}/api/v1/me/quran-bookmarks",
        method="PUT",
        headers=auth,
        payload={"surahs": merged_bookmarks},
    )
    if st_b_h != 200 or st_b_b != 200:
        print("FAIL device B push merged", file=sys.stderr)
        return 5

    # Device A — pull final union
    st_f_h, body_f_h = _http(f"{base}/api/v1/me/hatim", headers=auth)
    st_f_b, body_f_b = _http(f"{base}/api/v1/me/quran-bookmarks", headers=auth)
    final_hatim = _sort_unique(list(body_f_h.get("read_surahs") or []))
    final_bookmarks = _sort_unique(list(body_f_b.get("surahs") or []))

    expect_hatim = [1, 2, 114]
    expect_bookmarks = [1, 36]
    ok_hatim = final_hatim == expect_hatim
    ok_bookmarks = final_bookmarks == expect_bookmarks

    out = {
        "api_base": base,
        "device_a_push": {"hatim": [1, 2], "bookmarks": [36]},
        "device_b_local": {"hatim": device_b_hatim_local, "bookmarks": device_b_bookmarks_local},
        "device_b_merged": {"hatim": merged_hatim, "bookmarks": merged_bookmarks},
        "final": {"hatim": final_hatim, "bookmarks": final_bookmarks},
        "ok_hatim": ok_hatim,
        "ok_bookmarks": ok_bookmarks,
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))
    if ok_hatim and ok_bookmarks:
        print("--- smoke_cross_device_sync: OK ---")
        return 0
    print("--- smoke_cross_device_sync: FAIL ---", file=sys.stderr)
    return 6


if __name__ == "__main__":
    raise SystemExit(main())
