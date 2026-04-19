# -*- coding: utf-8 -*-
"""
Хадис қазақша мағынасы (text_kk) сапасын тексеру.

Мақсат: аударма орнына араб иснад мәтіні қалған жолдарды анықтау;
регрессия тесттері жаңа «бос/араб» аудармалардың кірмеуін бақылайды.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, TypedDict

# Араб әріптері (иснад / дұрыс енгізілген араб дәйексөз)
_AR = re.compile(r"[\u0600-\u06FF\uFE70-\uFEFF]")
# Кирилл (қазақ аудармасы)
_CYR = re.compile(r"[\u0400-\u04FF]")


class HadithRow(TypedDict, total=False):
    id: str
    arabic: str
    textKk: str


def is_text_kk_mostly_arabic_isnad(text_kk: str | None) -> bool:
    """
    True: text_kk іс жүзінде араб иснад (кирилл аз, араб көп).
    Бос жолдар False.
    """
    if not (text_kk or "").strip():
        return False
    ar = len(_AR.findall(text_kk))
    cy = len(_CYR.findall(text_kk))
    return ar > cy * 2 and ar > 20


def find_arabic_isnad_leakage_ids(hadiths: list[dict[str, Any]]) -> list[str]:
    """Сәтсіз аударма деп саналатын id тізімі (тәртіп бойынша)."""
    bad: list[str] = []
    for h in hadiths:
        kk = h.get("textKk")
        if is_text_kk_mostly_arabic_isnad(kk if isinstance(kk, str) else None):
            hid = h.get("id")
            if isinstance(hid, str):
                bad.append(hid)
    return sorted(bad)


def load_hadith_bundle(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def cyrillic_to_arabic_letter_ratio(text_kk: str | None) -> tuple[int, int]:
    """Қайтару: (кирилл таңба саны, араб таңба саны)."""
    if not text_kk:
        return 0, 0
    return len(_CYR.findall(text_kk)), len(_AR.findall(text_kk))
