#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bootstrap login bcrypt hash (stdout). Құпияны argv-ға енгізбейді.

  set RAQAT_AUTH_PASSWORD=your-secret
  python scripts/gen_auth_password_bcrypt.py

  python scripts/gen_auth_password_bcrypt.py --generate   # random 24 chars + hash (local smoke only)
"""
from __future__ import annotations

import argparse
import getpass
import os
import secrets
import string

from passlib.context import CryptContext

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--generate",
        action="store_true",
        help="Random password (24 chars) + bcrypt; prints password= and bcrypt= lines",
    )
    args = p.parse_args()

    if args.generate:
        alphabet = string.ascii_letters + string.digits
        plain = "".join(secrets.choice(alphabet) for _ in range(24))
    else:
        plain = (os.getenv("RAQAT_AUTH_PASSWORD") or "").strip()
        if not plain:
            plain = getpass.getpass("RAQAT_AUTH_PASSWORD (hidden): ").strip()
        if not plain:
            print("[error] empty password", file=__import__("sys").stderr)
            return 1

    bcrypt_hash = _pwd.hash(plain)
    if args.generate:
        print(f"password={plain}")
        print(f"bcrypt={bcrypt_hash}")
    else:
        print(bcrypt_hash)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
