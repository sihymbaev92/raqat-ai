from fastapi import APIRouter

from app.api.v1.endpoints.ai import router as ai_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.hadith import router as hadith_router
from app.api.v1.endpoints.halal import router as halal_router
from app.api.v1.endpoints.quran import router as quran_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.worship import router as worship_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(quran_router)
router.include_router(hadith_router)
router.include_router(ai_router)
router.include_router(worship_router)
router.include_router(halal_router)

