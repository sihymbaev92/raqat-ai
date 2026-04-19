from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.response import success_response
from jwt_auth import decode_access_token, payload_scopes

router = APIRouter(prefix="/users", tags=["users"])
_bearer = HTTPBearer(auto_error=False)


def _current_payload(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    if not creds or (creds.scheme or "").lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authorization bearer token required.")
    try:
        return decode_access_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Access token invalid or expired.") from None


@router.get("/me")
def me(payload: dict = Depends(_current_payload)) -> dict:
    return success_response(
        {
            "sub": payload.get("sub"),
            "platform_user_id": payload.get("platform_user_id"),
            "telegram_user_id": payload.get("telegram_user_id"),
            "apple_sub": payload.get("apple_sub"),
            "google_sub": payload.get("google_sub"),
            "scopes": payload_scopes(payload),
        }
    )

