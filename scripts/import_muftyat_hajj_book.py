#!/usr/bin/env python3
"""
Import «Қажылық» (muftyat.kz book 28689) as bundled page images + extracted text.

Source: https://www.muftyat.kz/kk/book/28689/
PDF:    https://www.muftyat.kz/media/muftyat/982258_1387348468.pdf

Usage:
  python scripts/import_muftyat_hajj_book.py
  python scripts/import_muftyat_hajj_book.py --skip-download
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))
from muftyat_kk_normalize import normalize_muftyat_kk_page_text

PDF_URL = "https://www.muftyat.kz/media/muftyat/982258_1387348468.pdf"
PDF_LOCAL = REPO / "data" / "muftyat-hajj.pdf"
OUT_DIR = REPO / "mobile" / "assets" / "hajj" / "muftyat"
CATALOG_JSON = REPO / "mobile" / "assets" / "hajj" / "muftyat-catalog.json"
MANIFEST_TS = REPO / "mobile" / "src" / "content" / "hajjMuftyatPages.ts"
META_TS = REPO / "mobile" / "src" / "content" / "hajjMuftyatCatalog.ts"
PAGE_TEXT_JSON = REPO / "mobile" / "src" / "content" / "hajjMuftyatPageText.json"
PAGE_TEXT_TS = REPO / "mobile" / "src" / "content" / "hajjMuftyatPageText.ts"

UA = {"User-Agent": "Mozilla/5.0 (compatible; RAQAT-import/1.0)"}

# Кіріспе — әдепкі ашық (PDF 3–5-бет)
INTRO_SECTION = {
    "id": "qajylyq",
    "title": "Қажылық",
    "startPage": 3,
    "endPage": 5,
    "defaultOpen": True,
}

TALBIYAH_SECTION = {
    "id": "talbiyah",
    "title": "Тәлбия",
    "startPage": 7,
    "endPage": 9,
}


def download_pdf() -> None:
    PDF_LOCAL.parent.mkdir(parents=True, exist_ok=True)
    if PDF_LOCAL.exists() and PDF_LOCAL.stat().st_size > 50_000:
        print(f"PDF exists: {PDF_LOCAL}")
        return
    print(f"Downloading {PDF_URL} ...")
    req = urllib.request.Request(PDF_URL, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        PDF_LOCAL.write_bytes(r.read())
    print(f"Saved {PDF_LOCAL} ({PDF_LOCAL.stat().st_size} bytes)")


def normalize_text(raw: str) -> str:
    t = raw.replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    # drop isolated page numbers
    lines = [ln.strip() for ln in t.split("\n") if ln.strip()]
    cleaned: list[str] = []
    for ln in lines:
        if re.fullmatch(r"\d{1,3}", ln):
            continue
        cleaned.append(ln)
    return "\n".join(cleaned).strip()


GARBAGE_CHAR_RE = re.compile(r"[\u0100-\u024F\u0300-\u036F\u0250-\u02AF]")
ARAB_CHAR_RE = re.compile(r"[\u0600-\u06FF]")
KK_CHAR_RE = re.compile(r"[а-яёәіңғүұқөһ]", re.I)
KEEP_LINE_RE = re.compile(
    r"^(Оқылуы|Мағынасы|Қажылық|مناسك الحج|Ескерту|Меккеге кірген|Пайғамбар)",
    re.I,
)


def is_garbage_line(line: str) -> bool:
    t = line.strip()
    if not t:
        return True
    if KEEP_LINE_RE.match(t):
        return False
    if t.startswith("(Ескерту:"):
        return False
    garbage = len(GARBAGE_CHAR_RE.findall(t))
    arab = len(ARAB_CHAR_RE.findall(t))
    kk = len(KK_CHAR_RE.findall(t))
    if arab >= 8 and garbage < 3:
        return False
    if kk >= 10:
        return False
    if garbage >= 4:
        return True
    if garbage >= 2 and kk < 6 and arab < 6:
        return True
    return False


def sanitize_page_text(raw: str) -> str:
    kept: list[str] = []
    for line in raw.replace("\r\n", "\n").split("\n"):
        if is_garbage_line(line):
            continue
        kept.append(line.rstrip())
    out = "\n".join(kept)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return normalize_muftyat_kk_page_text(out.strip())


def text_quality(text: str) -> tuple[bool, float]:
    cleaned = sanitize_page_text(text)
    if len(cleaned) < 60:
        return False, 0.0
    kk = len(re.findall(r"[а-яёәіңғүұқөһ]", cleaned, re.I))
    arab = len(re.findall(r"[\u0600-\u06FF]", cleaned))
    garbage = len(GARBAGE_CHAR_RE.findall(cleaned))
    letters = kk + arab + len(re.findall(r"[a-z]", cleaned, re.I))
    ratio = letters / max(len(cleaned), 1)
    score = ratio - garbage / max(len(cleaned), 1)
    if garbage / max(len(cleaned), 1) > 0.04:
        return False, score
    return score >= 0.35 and letters >= 40 and kk >= 40, score


def parse_toc(doc) -> list[dict]:
    toc_text = ""
    for i in range(doc.page_count):
        t = doc[i].get_text("text")
        if "Мазмұны" in t or "мазмұны" in t.lower():
            toc_text += "\n" + t
    entries: list[tuple[str, int]] = []
    for line in toc_text.splitlines():
        line = line.strip()
        m = re.match(r"^(.+?)\.{2,}\s*(\d+)\s*$", line)
        if not m:
            m = re.match(r"^(.+?)\s+(\d{1,3})\s*$", line)
        if not m:
            continue
        title = m.group(1).strip()
        if title.lower() in ("мазмұны", "қажылық", "مناسك الحج"):
            continue
        page = int(m.group(2))
        if page < 3 or page > 210:
            continue
        if len(title) < 2:
            continue
        entries.append((title, page))
    if not entries:
        raise RuntimeError("TOC parse failed")
    # dedupe by page, keep first title
    seen_pages: set[int] = set()
    uniq: list[tuple[str, int]] = []
    for title, page in entries:
        if page in seen_pages:
            continue
        seen_pages.add(page)
        uniq.append((title, page))
    uniq.sort(key=lambda x: x[1])
    sections: list[dict] = []
    for i, (title, start) in enumerate(uniq):
        end = doc.page_count
        for j in range(i + 1, len(uniq)):
            nxt = uniq[j][1]
            if nxt > start:
                end = nxt - 1
                break
        # trim back matter (TOC starts ~212)
        end = min(end, 211)
        slug = re.sub(r"[^\w\-]+", "-", title.lower(), flags=re.U)
        slug = re.sub(r"-+", "-", slug).strip("-")[:48] or f"sec-{start}"
        sections.append(
            {
                "id": slug,
                "title": title,
                "startPage": start,
                "endPage": end,
            }
        )
    return sections


def reorder_sections(sections: list[dict]) -> list[dict]:
    """Кітап бет реті: кіріспе (3–5), ихрам (6), тәлбия (7–9), …"""
    reserved_pages = set(range(TALBIYAH_SECTION["startPage"], TALBIYAH_SECTION["endPage"] + 1))
    reserved_pages.update(range(INTRO_SECTION["startPage"], INTRO_SECTION["endPage"] + 1))
    trimmed: list[dict] = []
    for s in sections:
        start, end = int(s["startPage"]), int(s["endPage"])
        if end < start:
            continue
        pages = [p for p in range(start, end + 1) if p not in reserved_pages]
        if not pages:
            continue
        trimmed.append({**s, "startPage": pages[0], "endPage": pages[-1]})
    trimmed.sort(key=lambda x: x["startPage"])
    # Ихрам (6) PDF TOC-та жоқ болса — қосу
    merged = [{**INTRO_SECTION}, {**TALBIYAH_SECTION}, *trimmed]
    merged.sort(key=lambda x: x["startPage"])
    return merged


def export_pages(doc, dpi_scale: float = 2.0, jpeg_quality: int = 88) -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    import fitz

    matrix = fitz.Matrix(dpi_scale, dpi_scale)
    n = doc.page_count
    for i in range(n):
        page_num = i + 1
        out = OUT_DIR / f"page-{page_num:03d}.jpg"
        if out.exists() and out.stat().st_size > 5_000:
            continue
        pix = doc[i].get_pixmap(matrix=matrix, alpha=False)
        pix.save(str(out), jpg_quality=jpeg_quality)
        if page_num % 20 == 0 or page_num == n:
            print(f"  exported {page_num}/{n}")
    return n


def extract_page_texts(doc) -> list[dict]:
    pages: list[dict] = []
    for i in range(doc.page_count):
        page_num = i + 1
        raw = doc[i].get_text("text")
        text = sanitize_page_text(normalize_text(raw))
        readable, score = text_quality(raw)
        pages.append(
            {
                "page": page_num,
                "text": text if readable else "",
                "readable": readable,
                "score": round(score, 3),
            }
        )
    return pages


def write_outputs(total_pages: int, sections: list[dict], page_texts: list[dict]) -> None:
    meta = {
        "sourceTitle": "Қажылық",
        "sourceOrg": "Қазақстан мұсылмандары Діни басқармасы (muftyat.kz)",
        "sourceUrl": "https://www.muftyat.kz/kk/book/28689/",
        "pdfUrl": PDF_URL,
        "totalPages": total_pages,
        "year": 2010,
        "authors": ["Ламашәріп Қайрат Қайырбекұлы"],
        "sections": sections,
    }
    CATALOG_JSON.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_JSON.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "/** Auto-generated by scripts/import_muftyat_hajj_book.py — do not edit by hand. */",
        "import type { ImageSourcePropType } from \"react-native\";",
        "",
        "export type HajjMuftyatPage = {",
        "  page: number;",
        "  source: ImageSourcePropType;",
        "};",
        "",
        "export const HAJJ_MUFTYAT_SOURCE = {",
        f"  title: {json.dumps(meta['sourceTitle'], ensure_ascii=False)},",
        f"  org: {json.dumps(meta['sourceOrg'], ensure_ascii=False)},",
        f"  url: {json.dumps(meta['sourceUrl'])},",
        f"  pdfUrl: {json.dumps(meta['pdfUrl'])},",
        f"  totalPages: {total_pages},",
        f"  year: {meta['year']},",
        f"  authors: {json.dumps(meta['authors'], ensure_ascii=False)},",
        "} as const;",
        "",
        "export const HAJJ_MUFTYAT_PAGES: HajjMuftyatPage[] = [",
    ]
    for p in range(1, total_pages + 1):
        lines.append(
            f"  {{ page: {p}, source: require(\"../../assets/hajj/muftyat/page-{p:03d}.jpg\") }},"
        )
    lines.append("];")
    lines.append("")
    MANIFEST_TS.write_text("\n".join(lines), encoding="utf-8")

    sec_lines = [
        "/** Auto-generated section index — scripts/import_muftyat_hajj_book.py */",
        "",
        "export type HajjMuftyatSection = {",
        "  id: string;",
        "  title: string;",
        "  startPage: number;",
        "  endPage: number;",
        "  defaultOpen?: boolean;",
        "};",
        "",
        "export const HAJJ_MUFTYAT_SECTIONS: HajjMuftyatSection[] = ",
        json.dumps(sections, ensure_ascii=False, indent=2),
        ";",
        "",
    ]
    META_TS.write_text("\n".join(sec_lines), encoding="utf-8")

    PAGE_TEXT_JSON.write_text(json.dumps(page_texts, ensure_ascii=False, indent=2), encoding="utf-8")
    PAGE_TEXT_TS.write_text(
        "\n".join(
            [
                "/** Auto-generated — scripts/import_muftyat_hajj_book.py */",
                "import pageTextData from \"./hajjMuftyatPageText.json\";",
                "",
                "export type HajjMuftyatPageText = {",
                "  page: number;",
                "  text: string;",
                "  readable: boolean;",
                "  score: number;",
                "};",
                "",
                "const PAGES = pageTextData as HajjMuftyatPageText[];",
                "",
                "export function getHajjMuftyatPageText(page: number): HajjMuftyatPageText | undefined {",
                "  return PAGES.find((p) => p.page === page);",
                "}",
                "",
            ]
        ),
        encoding="utf-8",
    )
    readable = sum(1 for p in page_texts if p["readable"])
    print(f"Wrote catalog ({len(sections)} sections), {total_pages} pages, {readable} readable text pages")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--scale", type=float, default=2.0)
    args = parser.parse_args()
    if not args.skip_download:
        download_pdf()
    if not PDF_LOCAL.exists():
        sys.exit("PDF missing")
    import fitz

    doc = fitz.open(str(PDF_LOCAL))
    sections = reorder_sections(parse_toc(doc))
    n = export_pages(doc, dpi_scale=args.scale)
    page_texts = extract_page_texts(doc)
    doc.close()
    write_outputs(n, sections, page_texts)
    print(f"Done: {n} pages -> {OUT_DIR}")


if __name__ == "__main__":
    main()
