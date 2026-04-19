#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bot API-only content smoke test.

Checks endpoints used by bot handlers in API-only mode:
1) /ready
2) /api/v1/hadith/random
3) /api/v1/hadith/search
4) /api/v1/quran/search
5) /api/v1/quran/{surah}
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


def _http_json(url: str, headers: dict[str, str], timeout: int = 10) -> tuple[int, Any]:
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def _ok_json(status: int, body: Any) -> bool:
    return status == 200 and isinstance(body, dict) and bool(body.get("ok"))


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--api-base", default="http://127.0.0.1:8787", help="Platform API base URL")
    p.add_argument("--content-secret", default="", help="Optional X-Raqat-Content-Secret")
    p.add_argument("--lang", default="kk", help="Content language for search/random checks")
    p.add_argument("--surah", type=int, default=1, help="Surah id for /quran/{surah} check")
    args = p.parse_args()

    base = args.api_base.rstrip("/")
    headers: dict[str, str] = {}
    if args.content_secret.strip():
        headers["X-Raqat-Content-Secret"] = args.content_secret.strip()

    checks: dict[str, Any] = {"api_base": base, "results": {}}

    ready_status, ready_body = _http_json(f"{base}/ready", headers)
    checks["results"]["/ready"] = {"status": ready_status, "ok": _ok_json(ready_status, ready_body)}
    if ready_status != 200:
        print(json.dumps(checks, ensure_ascii=False, indent=2))
        return 2

    hadith_random_url = (
        f"{base}/api/v1/hadith/random?"
        + urllib.parse.urlencode(
            {
                "source": "Sahih al-Bukhari",
                "strict_sahih": "false",
                "lang": args.lang,
            }
        )
    )
    s, b = _http_json(hadith_random_url, headers)
    checks["results"]["/api/v1/hadith/random"] = {
        "status": s,
        "ok": _ok_json(s, b),
        "has_hadith": isinstance(b, dict) and isinstance(b.get("hadith"), dict),
    }
    if not _ok_json(s, b):
        print(json.dumps(checks, ensure_ascii=False, indent=2))
        return 3

    hadith_search_url = (
        f"{base}/api/v1/hadith/search?"
        + urllib.parse.urlencode({"q": "намаз", "lang": args.lang, "limit": 3})
    )
    s, b = _http_json(hadith_search_url, headers)
    checks["results"]["/api/v1/hadith/search"] = {
        "status": s,
        "ok": _ok_json(s, b),
        "items": len(b.get("items") or []) if isinstance(b, dict) else 0,
    }
    if not _ok_json(s, b):
        print(json.dumps(checks, ensure_ascii=False, indent=2))
        return 4

    quran_search_url = (
        f"{base}/api/v1/quran/search?"
        + urllib.parse.urlencode({"q": "бисмил", "lang": args.lang, "limit": 3, "include_translit": "true"})
    )
    s, b = _http_json(quran_search_url, headers)
    checks["results"]["/api/v1/quran/search"] = {
        "status": s,
        "ok": _ok_json(s, b),
        "items": len(b.get("items") or []) if isinstance(b, dict) else 0,
    }
    if not _ok_json(s, b):
        print(json.dumps(checks, ensure_ascii=False, indent=2))
        return 5

    s, b = _http_json(f"{base}/api/v1/quran/{int(args.surah)}", headers)
    checks["results"]["/api/v1/quran/{surah}"] = {
        "status": s,
        "ok": _ok_json(s, b),
        "ayahs": len(b.get("ayahs") or []) if isinstance(b, dict) else 0,
    }
    if not _ok_json(s, b):
        print(json.dumps(checks, ensure_ascii=False, indent=2))
        return 6

    print(json.dumps(checks, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
