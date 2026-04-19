#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Release smoke: API validate + mobile sync simulation (metadata/ETag/since).

Checks:
1) /health, /ready
2) content endpoints: /quran/surahs, /quran/1/1
3) /metadata/changes ETag, then If-None-Match -> 304
4) if diff exists, fetch one changed quran/hadith record
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


def _http_json(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    timeout: int = 10,
) -> tuple[int, dict[str, str], Any]:
    req = urllib.request.Request(url, headers=headers or {}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            ct = resp.headers.get("Content-Type", "")
            data: Any = json.loads(raw) if "json" in ct.lower() and raw.strip() else raw
            return resp.status, dict(resp.headers.items()), data
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(raw)
        except Exception:
            data = raw
        return e.code, dict(e.headers.items()), data


def _with_auth_headers(content_secret: str, access_token: str) -> dict[str, str]:
    h: dict[str, str] = {}
    if content_secret:
        h["X-Raqat-Content-Secret"] = content_secret
    if access_token:
        h["Authorization"] = f"Bearer {access_token}"
    return h


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--api-base", default="http://127.0.0.1:8787", help="Platform API base URL")
    p.add_argument("--content-secret", default="", help="X-Raqat-Content-Secret (optional)")
    p.add_argument("--access-token", default="", help="Bearer token with content scope (optional)")
    args = p.parse_args()

    base = args.api_base.rstrip("/")
    h = _with_auth_headers(args.content_secret.strip(), args.access_token.strip())
    out: dict[str, Any] = {"api_base": base, "checks": {}}

    # 1) Liveness/readiness
    for path in ("/health", "/ready"):
        code, _, body = _http_json(f"{base}{path}")
        out["checks"][path] = {"status": code, "body": body}
        if code != 200:
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 2

    # 2) Basic content endpoints
    code, _, surahs = _http_json(f"{base}/api/v1/quran/surahs", headers=h)
    out["checks"]["/api/v1/quran/surahs"] = {"status": code}
    if code != 200 or not isinstance(surahs, dict) or not surahs.get("ok"):
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 3

    code, _, ayah = _http_json(f"{base}/api/v1/quran/1/1", headers=h)
    out["checks"]["/api/v1/quran/1/1"] = {"status": code}
    if code != 200 or not isinstance(ayah, dict) or not ayah.get("ok"):
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 4

    # 3) Metadata + ETag/304
    code, headers, meta = _http_json(f"{base}/api/v1/metadata/changes", headers=h)
    out["checks"]["/api/v1/metadata/changes:first"] = {"status": code}
    if code != 200 or not isinstance(meta, dict) or not meta.get("ok"):
        out["checks"]["/api/v1/metadata/changes:first"]["body"] = meta
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 5
    etag = headers.get("ETag") or meta.get("etag") or ""
    out["checks"]["metadata_etag"] = etag

    if etag:
        h2 = dict(h)
        h2["If-None-Match"] = etag
        code2, _, _ = _http_json(f"{base}/api/v1/metadata/changes", headers=h2)
        out["checks"]["/api/v1/metadata/changes:if-none-match"] = {"status": code2}
        if code2 != 304:
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 6

    # 4) Incremental smoke (mobile-like behavior)
    q_changed = meta.get("quran_changed") or []
    h_changed = meta.get("hadith_changed") or []
    out["checks"]["incremental_diff_available"] = bool(meta.get("incremental_diff_available"))
    out["checks"]["quran_changed_count"] = len(q_changed)
    out["checks"]["hadith_changed_count"] = len(h_changed)

    if q_changed:
        first = q_changed[0]
        surah = int(first.get("surah"))
        ayah_num = int(first.get("ayah"))
        code, _, _ = _http_json(f"{base}/api/v1/quran/{surah}/{ayah_num}", headers=h)
        out["checks"]["incremental_quran_fetch"] = {"status": code, "surah": surah, "ayah": ayah_num}
        if code != 200:
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 7
    if h_changed:
        hid = int(h_changed[0])
        code, _, _ = _http_json(f"{base}/api/v1/hadith/{hid}", headers=h)
        out["checks"]["incremental_hadith_fetch"] = {"status": code, "hadith_id": hid}
        if code != 200:
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 8

    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
