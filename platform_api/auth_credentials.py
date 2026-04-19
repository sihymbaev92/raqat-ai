# -*- coding: utf-8 -*-
"""Bootstrap логин: env username + bcrypt немесе уақытша plaintext құпия."""
from __future__ import annotations

import hmac
import os

from passlib.context import CryptContext

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def expected_username() -> str:
    return (os.getenv("RAQAT_AUTH_USERNAME") or "admin").strip() or "admin"


def verify_password(username: str, password: str) -> bool:
    if (username or "").strip() != expected_username():
        return False
    bcrypt_hash = (os.getenv("RAQAT_AUTH_PASSWORD_BCRYPT") or "").strip()
    plain = (os.getenv("RAQAT_AUTH_PASSWORD") or "").strip()
    if bcrypt_hash:
        try:
            return _pwd.verify(password, bcrypt_hash)
        except ValueError:
            return False
    if plain:
        return hmac.compare_digest(password, plain)
    return False


def auth_login_configured() -> bool:
    return bool(
        (os.getenv("RAQAT_AUTH_PASSWORD_BCRYPT") or "").strip()
        or (os.getenv("RAQAT_AUTH_PASSWORD") or "").strip()
    )
