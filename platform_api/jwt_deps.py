# -*- coding: utf-8 -*-
"""Bearer JWT — /users/me және т.б."""
from __future__ import annotations

from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from jwt_auth import decode_access_token

security = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    if not creds or not (creds.scheme or "").lower() == "bearer":
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Missing or invalid Authorization Bearer token."},
        )
    try:
        payload = decode_access_token(creds.credentials)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_TOKEN", "message": "JWT invalid or expired."},
        ) from None
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail={"code": "INVALID_TOKEN", "message": "JWT missing sub."})
    return payload
