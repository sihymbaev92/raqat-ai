#!/usr/bin/env python3
"""
Import «Құран оқып - үйренейік!» (KMDA / muftyat.kz) as bundled page images.

Source: https://www.muftyat.kz/kk/book/28695/
PDF:    https://www.muftyat.kz/media/muftyat/231950_1387364184.pdf

Usage:
  python scripts/import_muftyat_tajweed_book.py
  python scripts/import_muftyat_tajweed_book.py --skip-download
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PDF_URL = "https://www.muftyat.kz/media/muftyat/231950_1387364184.pdf"
PDF_LOCAL = REPO / "data" / "muftyat-quran-oqip-uyreneyik.pdf"
OUT_DIR = REPO / "mobile" / "assets" / "tajweed" / "muftyat"
CATALOG_JSON = REPO / "mobile" / "assets" / "tajweed" / "muftyat-catalog.json"
MANIFEST_TS = REPO / "mobile" / "src" / "content" / "tajweedMuftyatPages.ts"
META_TS = REPO / "mobile" / "src" / "content" / "tajweedMuftyatCatalog.ts"

UA = {"User-Agent": "Mozilla/5.0 (compatible; RAQAT-import/1.0)"}

# TOC from PDF «Мазмұны» (page numbers are 1-based book pages)
SECTIONS: list[dict] = [
    {"id": "foreword", "title": "Алғы сөз", "startPage": 3},
    {"id": "intro", "title": "Кіріспе", "startPage": 5},
    {"id": "part1", "title": "1-бөлім. Араб тілі әліппесі", "startPage": 13, "isPart": True},
    {"id": "harakat", "title": "1. Харакаттар мен сукун", "startPage": 13},
    {"id": "madd-letters", "title": "2. Мәдд әріптері", "startPage": 33},
    {"id": "hamza", "title": "3. Һәмзә", "startPage": 37},
    {"id": "wasl-hamza", "title": "4. Уасл һәмзә", "startPage": 38},
    {"id": "ta-marbuta", "title": "5. Тә мәрбута", "startPage": 40},
    {"id": "al-article", "title": "6. Әл артиклі", "startPage": 41},
    {"id": "part2", "title": "2-бөлім. Тәжуид ережелері", "startPage": 43, "isPart": True},
    {"id": "nun-rules", "title": "Сукунды нун және тәнуин", "startPage": 43},
    {"id": "mim-rules", "title": "Сукунды мим", "startPage": 50},
    {"id": "shadda-nun-mim", "title": "Шәддәлы нун және мим", "startPage": 51},
    {"id": "mutamathil", "title": "Мутәмәсиләйни / мутәжәнис / мутәқариб", "startPage": 52},
    {"id": "qalqala", "title": "Қалқала әріптері", "startPage": 54},
    {"id": "tafkhim-tarqeeq", "title": "Тәфхим және тәрқиқ", "startPage": 55},
    {"id": "heavy-light-mix", "title": "Кейде жуан, кейде жіңішке", "startPage": 56},
    {"id": "madd", "title": "Мәдд", "startPage": 61},
    {"id": "ha-kinaya", "title": "«Һә» әл-Кинәйә", "startPage": 63},
    {"id": "waqf", "title": "Уақф", "startPage": 71},
    {"id": "sajda", "title": "Сәжде аяттары", "startPage": 73},
    {"id": "sakt", "title": "Сәкта", "startPage": 76},
    {"id": "imala", "title": "Имәлә", "startPage": 77},
    {"id": "short-surahs", "title": "Қысқа сүрелер", "startPage": 78, "isPart": True},
    {"id": "ayahs", "title": "Аяттар", "startPage": 88},
    {"id": "duas", "title": "Дұғалар", "startPage": 94},
    {"id": "namaz-duas", "title": "Намазда оқылатын дұғалар", "startPage": 96},
    {"id": "misc-duas", "title": "Әр түрлі дұғалар", "startPage": 99},
    {"id": "refs", "title": "Қолданылған әдебиеттер", "startPage": 102},
]


def download_pdf() -> None:
    PDF_LOCAL.parent.mkdir(parents=True, exist_ok=True)
    if PDF_LOCAL.exists() and PDF_LOCAL.stat().st_size > 100_000:
        print(f"PDF exists: {PDF_LOCAL}")
        return
    print(f"Downloading {PDF_URL} ...")
    req = urllib.request.Request(PDF_URL, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        PDF_LOCAL.write_bytes(r.read())
    print(f"Saved {PDF_LOCAL} ({PDF_LOCAL.stat().st_size} bytes)")


def export_pages(dpi_scale: float = 2.0, jpeg_quality: int = 88) -> int:
    import fitz  # pymupdf

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(str(PDF_LOCAL))
    n = doc.page_count
    matrix = fitz.Matrix(dpi_scale, dpi_scale)
    for i in range(n):
        page_num = i + 1
        name = f"page-{page_num:03d}.jpg"
        out = OUT_DIR / name
        if out.exists() and out.stat().st_size > 5_000:
            continue
        pix = doc[i].get_pixmap(matrix=matrix, alpha=False)
        pix.save(str(out), jpg_quality=jpeg_quality)
        if page_num % 10 == 0 or page_num == n:
            print(f"  exported {page_num}/{n}")
    doc.close()
    return n


def write_catalog(total_pages: int) -> None:
    sections = []
    for i, s in enumerate(SECTIONS):
        start = int(s["startPage"])
        end = total_pages
        for j in range(i + 1, len(SECTIONS)):
            nxt = int(SECTIONS[j]["startPage"])
            if nxt > start:
                end = nxt - 1
                break
        sections.append(
            {
                **s,
                "startPage": start,
                "endPage": end,
            }
        )

    meta = {
        "sourceTitle": "Құран оқып-үйренейік!",
        "sourceOrg": "Қазақстан мұсылмандары Діни басқармасы",
        "sourceUrl": "https://www.muftyat.kz/kk/book/28695/",
        "pdfUrl": PDF_URL,
        "totalPages": total_pages,
        "year": 2011,
        "authors": ["Еркебұлан Ыбрайымұлы", "Нұрлан Сайлауұлы"],
        "sections": sections,
    }
    CATALOG_JSON.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    # TypeScript manifest with static requires (RN bundler)
    lines = [
        "/** Auto-generated by scripts/import_muftyat_tajweed_book.py — do not edit by hand. */",
        "import type { ImageSourcePropType } from \"react-native\";",
        "",
        "export type TajweedMuftyatPage = {",
        "  page: number;",
        "  source: ImageSourcePropType;",
        "};",
        "",
        "export const TAJWEED_MUFTYAT_SOURCE = {",
        f"  title: {json.dumps(meta['sourceTitle'], ensure_ascii=False)},",
        f"  org: {json.dumps(meta['sourceOrg'], ensure_ascii=False)},",
        f"  url: {json.dumps(meta['sourceUrl'])},",
        f"  pdfUrl: {json.dumps(meta['pdfUrl'])},",
        f"  totalPages: {total_pages},",
        f"  year: {meta['year']},",
        f"  authors: {json.dumps(meta['authors'], ensure_ascii=False)},",
        "} as const;",
        "",
        "export const TAJWEED_MUFTYAT_PAGES: TajweedMuftyatPage[] = [",
    ]
    for p in range(1, total_pages + 1):
        lines.append(
            f"  {{ page: {p}, source: require(\"../../assets/tajweed/muftyat/page-{p:03d}.jpg\") }},"
        )
    lines.append("];")
    lines.append("")
    MANIFEST_TS.write_text("\n".join(lines), encoding="utf-8")

    sec_lines = [
        "/** Auto-generated section index — scripts/import_muftyat_tajweed_book.py */",
        "",
        "export type TajweedMuftyatSection = {",
        "  id: string;",
        "  title: string;",
        "  startPage: number;",
        "  endPage: number;",
        "  isPart?: boolean;",
        "};",
        "",
        "export const TAJWEED_MUFTYAT_SECTIONS: TajweedMuftyatSection[] = ",
        json.dumps(
            [
                {k: v for k, v in s.items() if k in ("id", "title", "startPage", "endPage", "isPart")}
                for s in sections
            ],
            ensure_ascii=False,
            indent=2,
        ),
        ";",
        "",
    ]
    META_TS.write_text("\n".join(sec_lines), encoding="utf-8")
    print(f"Wrote {CATALOG_JSON.name}, {MANIFEST_TS.name}, {META_TS.name}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--scale", type=float, default=2.0)
    args = parser.parse_args()
    if not args.skip_download:
        download_pdf()
    if not PDF_LOCAL.exists():
        sys.exit("PDF missing — run without --skip-download")
    n = export_pages(dpi_scale=args.scale)
    write_catalog(n)
    # Per-page TTS text (Kazakh + Arabic segments)
    import subprocess

    extract = REPO / "scripts" / "extract_muftyat_page_text.py"
    if extract.exists():
        subprocess.run([sys.executable, str(extract)], check=True)
    print(f"Done: {n} pages in {OUT_DIR}")


if __name__ == "__main__":
    main()
