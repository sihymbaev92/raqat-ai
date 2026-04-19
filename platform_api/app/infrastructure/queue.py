from __future__ import annotations

from typing import Any

from app.core.config import settings


def enqueue_task(task_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    """
    Queue abstraction for heavy async work.
    Returns queue status; caller can gracefully fallback when unavailable.
    Broker — `celery_app` (RAQAT_REDIS_URL / RAQAT_CELERY_BROKER_URL).
    """
    if settings.queue_backend.lower() != "celery":
        return {"queued": False, "backend": settings.queue_backend, "reason": "unsupported_backend"}
    try:
        from celery_app import app as celery_application  # type: ignore

        async_result = celery_application.send_task(task_name, kwargs={"payload": payload})
        return {"queued": True, "backend": "celery", "task_id": str(async_result.id)}
    except Exception as exc:
        return {"queued": False, "backend": "celery", "reason": str(exc)}

