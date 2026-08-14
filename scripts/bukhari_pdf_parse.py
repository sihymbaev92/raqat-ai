"""Parse Sahih al-Bukhari QMDB PDF (Kazakh) into hadith number -> text."""
from __future__ import annotations

import re
from pathlib import Path

import fitz

HADITH_START_STRICT = re.compile(
    r"(?:^|\n)\s*(\d+)\s*-\s*(?!бап\.)([А-ЯӘІҢҒҮҰҚӨҺ])",
    re.MULTILINE,
)

HADITH_START_RELAXED = re.compile(
    r"(?<![0-9])(\d+)\s*-\s*(?!бап\.)([А-ЯӘІҢҒҮҰҚӨҺ])",
    re.MULTILINE,
)

# Backward-compatible alias (relaxed — OCR mid-line markers).
HADITH_START = HADITH_START_RELAXED

CHAPTER_MARK = re.compile(r"\d+\s*-\s*бап\.", re.IGNORECASE)


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def is_arabic_line(line: str) -> bool:
    ar = sum(1 for c in line if "\u0600" <= c <= "\u06FF")
    return ar > 8 and len(line) > 20


def clean_kk_body(raw: str) -> str:
    lines: list[str] = []
    for line in raw.splitlines():
        line = line.strip()
        if not line or re.fullmatch(r"\d+", line):
            continue
        if line.startswith("WWW.") or "Қазақстан мұсылмандары" in line:
            continue
        if is_arabic_line(line):
            continue
        if CHAPTER_MARK.search(line):
            break
        lines.append(line)
    body = normalize_ws(" ".join(lines))
    return body


def _chunk_body(text: str, pos: int, end: int) -> str:
    chunk = text[pos:end]
    chunk = re.sub(r"^\s*\d+\s*-\s*", "", chunk, count=1)
    return clean_kk_body(chunk)


def parse_text(text: str, *, relaxed: bool = False) -> dict[int, str]:
    patterns = [HADITH_START_STRICT]
    if relaxed:
        patterns.append(HADITH_START_RELAXED)

    out: dict[int, str] = {}
    for pattern in patterns:
        starts = [(m.start(), int(m.group(1))) for m in pattern.finditer(text)]
        for i, (pos, num) in enumerate(starts):
            if num <= 0:
                continue
            if num in out and pattern is HADITH_START_RELAXED:
                continue
            end = starts[i + 1][0] if i + 1 < len(starts) else len(text)
            body = _chunk_body(text, pos, end)
            if len(body) < 40:
                continue
            if pattern is HADITH_START_RELAXED and not looks_like_kazakh(body):
                continue
            if num not in out or len(body) > len(out[num]):
                out[num] = body
    return out


def extract_pages(path: Path) -> list[str]:
    doc = fitz.open(str(path))
    pages = [doc.load_page(i).get_text("text") for i in range(doc.page_count)]
    doc.close()
    return pages


def parse_volume(path: Path) -> dict[int, str]:
    text = "\n".join(extract_pages(path))
    return parse_text(text, relaxed=False)


def looks_like_kazakh(text: str) -> bool:
    cyr = len(re.findall(r"[\u0400-\u04FF]", text))
    return cyr >= max(30, len(text) * 0.2)


__all__ = [
    "parse_volume",
    "parse_text",
    "looks_like_kazakh",
    "extract_pages",
    "HADITH_START",
    "HADITH_START_STRICT",
    "HADITH_START_RELAXED",
]
