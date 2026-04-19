from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.response import success_response
from ai_security import optional_content_read_secret
from content_reader import quran_one_ayah, quran_search, quran_surah_index, quran_surah_slice

router = APIRouter(prefix="/quran", tags=["quran"])


@router.get("/surahs")
def surahs(_: None = Depends(optional_content_read_secret)) -> dict:
    return success_response({"items": quran_surah_index()})


@router.get("/search")
def search(
    q: str = Query(..., min_length=1),
    lang: str = Query("kk"),
    include_translit: bool = Query(True),
    limit: int = Query(5, ge=1, le=100),
    _: None = Depends(optional_content_read_secret),
) -> dict:
    return success_response(
        {"items": quran_search(q, lang=lang, include_translit=include_translit, limit=limit)}
    )


@router.get("/surahs/{surah}/ayahs")
def surah_ayahs(
    surah: int,
    from_ayah: int | None = Query(None, ge=1),
    to_ayah: int | None = Query(None, ge=1),
    _: None = Depends(optional_content_read_secret),
) -> dict:
    if surah < 1 or surah > 114:
        raise HTTPException(status_code=400, detail="surah must be 1..114")
    rows = quran_surah_slice(surah, from_ayah, to_ayah)
    if not rows:
        raise HTTPException(status_code=404, detail="surah or range not found")
    return success_response({"surah": surah, "count": len(rows), "ayahs": rows})


@router.get("/surahs/{surah}/ayahs/{ayah}")
def one_ayah(surah: int, ayah: int, _: None = Depends(optional_content_read_secret)) -> dict:
    row = quran_one_ayah(surah, ayah)
    if not row:
        raise HTTPException(status_code=404, detail="ayah not found")
    return success_response({"ayah": row})

