from __future__ import annotations

from hashlib import md5

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.response import success_response
from app.infrastructure.cache import cache_get_json, cache_set_json
from app.infrastructure.queue import enqueue_task

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatBody(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    async_mode: bool = Field(default=False)


@router.post("/chat")
def ai_chat(body: ChatBody) -> dict:
    key = "raqat:ai:chat:" + md5(body.prompt.strip().encode("utf-8")).hexdigest()
    cached = cache_get_json(key)
    if cached:
        return success_response({"mode": "cache", **cached})

    if body.async_mode:
        queued = enqueue_task("raqat.ai.chat", {"prompt": body.prompt.strip()})
        if queued.get("queued"):
            return success_response(
                {
                    "mode": "queued",
                    "task_id": queued.get("task_id"),
                    "status": "accepted",
                    "pipeline": ["intent", "retrieval", "reasoning", "safety", "audit"],
                }
            )

    # Graceful fallback: return deterministic placeholder when queue/AI unavailable.
    out = {
        "mode": "sync-fallback",
        "answer": "AI service temporary fallback mode is active. Qur'an/Hadith services remain available.",
        "pipeline": ["intent", "retrieval", "reasoning", "safety", "audit"],
        "safety": {"risk_level": "low", "disclaimer": "Informational response."},
    }
    cache_set_json(key, out, ttl_seconds=45)
    return success_response(out)

