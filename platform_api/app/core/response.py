from __future__ import annotations

from typing import Any


def success_response(data: Any, request_id: str | None = None) -> dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "meta": {"request_id": request_id or "n/a"},
    }


def error_response(code: str, message: str, request_id: str | None = None) -> dict[str, Any]:
    return {
        "success": False,
        "error": {"code": code, "message": message},
        "meta": {"request_id": request_id or "n/a"},
    }

