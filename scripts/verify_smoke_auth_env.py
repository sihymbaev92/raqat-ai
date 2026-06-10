#!/usr/bin/env python3
"""VPS: verify RAQAT_AUTH_PASSWORD_BCRYPT vs RAQAT_SMOKE_AUTH_PASSWORD (.env sourced)."""
from __future__ import annotations

import os
import sys

from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def main() -> int:
    u = (os.getenv("RAQAT_AUTH_USERNAME") or "").strip()
    h = (os.getenv("RAQAT_AUTH_PASSWORD_BCRYPT") or "").strip().strip("'\"")
    p = (os.getenv("RAQAT_SMOKE_AUTH_PASSWORD") or "").strip().strip("'\"")
    print(f"user={u!r} hash_prefix={(h[:10] + '…') if h else None} pw_len={len(p)}")
    if not h or not p:
        print("missing hash or smoke password")
        return 1
    ok = pwd.verify(p, h)
    print(f"verify={ok}")
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
