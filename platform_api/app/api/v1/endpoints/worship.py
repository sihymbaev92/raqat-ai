from fastapi import APIRouter

from app.core.response import success_response

router = APIRouter(prefix="/worship", tags=["worship"])


@router.get("/prayer-times")
def prayer_times_placeholder() -> dict:
    return success_response(
        {
            "message": "Worship tools skeleton is ready.",
            "tools": ["prayer-times", "qibla", "tasbih", "reminders"],
        }
    )

