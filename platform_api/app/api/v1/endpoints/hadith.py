from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.response import success_response
from ai_security import optional_content_read_secret
from content_reader import hadith_by_id, hadith_search

router = APIRouter(prefix="/hadith", tags=["hadith"])


@router.get("/collections")
def collections_placeholder(_: None = Depends(optional_content_read_secret)) -> dict:
    return success_response(
        {
            "items": [
                {"id": "bukhari", "title": "Sahih al-Bukhari"},
                {"id": "muslim", "title": "Sahih Muslim"},
                {"id": "abudawud", "title": "Sunan Abu Dawud"},
            ]
        }
    )


@router.get("/search")
def search(
    q: str = Query(..., min_length=1),
    lang: str = Query("kk"),
    limit: int = Query(60, ge=1, le=200),
    _: None = Depends(optional_content_read_secret),
) -> dict:
    return success_response({"items": hadith_search(q, lang=lang, limit=limit)})


@router.get("/{hadith_id}")
def one(hadith_id: int, _: None = Depends(optional_content_read_secret)) -> dict:
    row = hadith_by_id(hadith_id)
    if not row:
        raise HTTPException(status_code=404, detail="hadith not found")
    return success_response({"hadith": row})

