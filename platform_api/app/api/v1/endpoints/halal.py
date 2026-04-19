from fastapi import APIRouter

from app.core.response import success_response

router = APIRouter(prefix="/halal", tags=["halal"])


@router.post("/check-text")
def halal_check_text_placeholder() -> dict:
    return success_response(
        {
            "message": "Halal service skeleton is ready.",
            "modes": ["text-analysis", "image-analysis", "verdict-explanation"],
        }
    )

