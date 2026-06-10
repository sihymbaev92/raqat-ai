#!/usr/bin/env python3
"""Redis AI exact/semantic кэшінен уақытша (Gemini busy) жауаптарды өшіру — VPS-те бір рет."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV = ROOT / ".env"


def load_env() -> None:
    try:
        from dotenv import load_dotenv

        load_dotenv(ENV)
    except ImportError:
        pass


def main() -> int:
    load_env()
    try:
        from ai_reply_guards import is_degraded_ai_reply
        from app.infrastructure.redis_client import get_redis_client
    except Exception as exc:
        print("import_fail:", exc)
        return 1

    client = get_redis_client()
    if client is None:
        print("redis: unavailable")
        return 1

    exact_deleted = 0
    for key in client.scan_iter("raqat:ai:exact:v1:*", count=200):
        try:
            raw = client.get(key)
            if not raw:
                continue
            data = json.loads(raw)
            txt = data.get("text") if isinstance(data, dict) else None
            if isinstance(txt, str) and is_degraded_ai_reply(txt):
                client.delete(key)
                exact_deleted += 1
        except Exception:
            continue

    sem_key = "raqat:ai:semantic:v1:entries"
    sem_removed = 0
    try:
        raw = client.get(sem_key)
        if raw:
            entries = json.loads(raw)
            if isinstance(entries, list):
                kept = [
                    ent
                    for ent in entries
                    if isinstance(ent, dict)
                    and isinstance(ent.get("t"), str)
                    and not is_degraded_ai_reply(str(ent["t"]))
                ]
                sem_removed = len(entries) - len(kept)
                if sem_removed:
                    if kept:
                        ttl = client.ttl(sem_key)
                        payload = json.dumps(kept, ensure_ascii=False)
                        if ttl and ttl > 0:
                            client.setex(sem_key, ttl, payload)
                        else:
                            client.set(sem_key, payload)
                    else:
                        client.delete(sem_key)
    except Exception as exc:
        print("semantic_warn:", exc)

    print(f"exact_deleted={exact_deleted} semantic_removed={sem_removed}")
    print("Done. Restart: systemctl restart raqat-platform-api")
    return 0


if __name__ == "__main__":
    sys.exit(main())
