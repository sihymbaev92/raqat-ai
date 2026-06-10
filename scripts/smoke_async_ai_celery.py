#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Async AI + Celery E2E smoke: POST /api/v1/ai/chat (async_mode) → poll GET /api/v1/ai/task/{id}.

Мысал:
  .venv/bin/python scripts/smoke_async_ai_celery.py --api-base http://127.0.0.1:8787
  RAQAT_AI_PROXY_SECRET=... python scripts/smoke_async_ai_celery.py
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any


def _http(
    url: str,
    *,
    headers: dict[str, str],
    method: str = "GET",
    data: bytes | None = None,
    timeout: float = 30.0,
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


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--api-base", default="http://127.0.0.1:8787")
    p.add_argument("--prompt", default="Намаз не? Қысқаша жауап.")
    p.add_argument("--poll-interval", type=float, default=2.0)
    p.add_argument("--timeout", type=float, default=120.0)
    args = p.parse_args()

    base = args.api_base.rstrip("/")
    headers: dict[str, str] = {"Content-Type": "application/json"}
    ai_secret = (os.getenv("RAQAT_AI_PROXY_SECRET") or "").strip()
    if ai_secret:
        headers["X-Raqat-Ai-Secret"] = ai_secret

    payload = {
        "prompt": args.prompt,
        "async_mode": True,
        "detail_level": "quick",
        "staged_pipeline": False,
    }
    st, body = _http(
        f"{base}/api/v1/ai/chat",
        headers=headers,
        method="POST",
        data=json.dumps(payload).encode("utf-8"),
        timeout=30.0,
    )
    out: dict[str, Any] = {
        "api_base": base,
        "enqueue": {"status": st, "body": body},
    }
    if st != 200 or not body.get("async") or not body.get("task_id"):
        print(json.dumps(out, ensure_ascii=False, indent=2))
        print("[error] async enqueue failed", file=sys.stderr)
        return 2

    task_id = str(body["task_id"])
    deadline = time.monotonic() + args.timeout
    poll_path = body.get("poll_path") or f"/api/v1/ai/task/{task_id}"
    poll_url = f"{base}{poll_path}" if poll_path.startswith("/") else f"{base}/{poll_path}"

    last: dict[str, Any] = {}
    while time.monotonic() < deadline:
        st_p, last = _http(poll_url, headers=headers, timeout=15.0)
        out["poll"] = {"status": st_p, "last": last}
        if st_p != 200:
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 3
        if last.get("ready"):
            break
        time.sleep(args.poll_interval)
    else:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        print("[error] poll timeout", file=sys.stderr)
        return 4

    state = last.get("state")
    if state == "FAILURE" or last.get("error"):
        print(json.dumps(out, ensure_ascii=False, indent=2))
        print(f"[error] task failed: {last.get('error')}", file=sys.stderr)
        return 5

    result = last.get("result")
    text = ""
    ai_ok = False
    infra_note = ""
    if isinstance(result, dict):
        text = str(result.get("text") or result.get("reply") or "").strip()
        ai_ok = result.get("ok") is True and bool(text)
        if result.get("error") == "gemini_busy":
            infra_note = "celery_ok_gemini_busy"
    elif isinstance(result, str):
        text = result.strip()
        ai_ok = bool(text)

    out["result_chars"] = len(text)
    out["result_preview"] = text[:200] if text else ""
    infra_ok = state == "SUCCESS" and isinstance(result, dict)
    out["ok"] = ai_ok
    out["infra_ok"] = infra_ok
    if infra_note:
        out["note"] = infra_note
    print(json.dumps(out, ensure_ascii=False, indent=2))
    if infra_ok and not ai_ok and infra_note:
        print("--- smoke_async_ai_celery: OK (queue+worker; Gemini busy) ---")
        return 0
    if not ai_ok:
        print("[error] empty or unsuccessful result", file=sys.stderr)
        return 6
    print("--- smoke_async_ai_celery: OK ---")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
