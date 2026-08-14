#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Сахих әл-Бұхари (ҚМДБ, 2005) PDF-тен қазақша хадис мәтінін SQLite-ке импорт.

I том: мәтін қабаты дұрыс (PyMuPDF).
II том: шрифт кодировкасы бұзылған — Tesseract OCR (kaz+rus).

Дереккөз белгісі:
  kk_source_site = qmdb_bukhari_2005
  kk_source_label (export) = Сахих әл-Бұхари · ҚМДБ (2005), Доскелді Қожатайұлы аудармасы

Қолдану:
  python scripts/import_hadith_kk_from_bukhari_pdf.py \\
    --vol1 "C:/Users/.../Sakhikh__1241_l-b_1201_khari_I_Khadis_ilimi.pdf" \\
    --vol2 "C:/Users/.../Sakhikh__1241_l-B_1201_khari_II_Khadis_ilimi.pdf" \\
    --db global_clean.db --ocr-vol2 --apply
"""
from __future__ import annotations

import argparse
import io
import json
import os
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from bukhari_pdf_parse import looks_like_kazakh, parse_volume, parse_text  # noqa: E402
from services.text_cleanup import clean_text_content  # noqa: E402

SOURCE_SITE = "qmdb_bukhari_2005"
SOURCE_LABEL = "Сахих әл-Бұхари · ҚМДБ (2005), Доскелді Қожатайұлы аудармасы"
BOOK_TITLE_KK = "Сахих әл-Бұхари (ҚМДБ, 2005)"
DEFAULT_TESS = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
DEFAULT_TESSDATA = ROOT / "data" / "tessdata"
OCR_CACHE = ROOT / "data" / "bukhari_vol2_ocr_pages.jsonl"


def ocr_volume(path: Path, *, cache: Path, dpi: float = 2.5) -> dict[int, str]:
    import fitz
    import pytesseract
    from PIL import Image

    if Path(os.environ.get("TESSDATA_PREFIX", DEFAULT_TESSDATA)).exists():
        os.environ.setdefault("TESSDATA_PREFIX", str(DEFAULT_TESSDATA))
    tesseract_cmd = os.environ.get("TESSERACT_CMD", str(DEFAULT_TESS))
    if Path(tesseract_cmd).exists():
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    done: dict[int, str] = {}
    if cache.is_file():
        for line in cache.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            done[int(row["page"])] = row["text"]

    doc = fitz.open(str(path))
    try:
        for i in range(doc.page_count):
            if i in done:
                continue
            page = doc.load_page(i)
            pix = page.get_pixmap(matrix=fitz.Matrix(dpi, dpi))
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text = pytesseract.image_to_string(img, lang="kaz+rus", config="--psm 6")
            done[i] = text
            cache.parent.mkdir(parents=True, exist_ok=True)
            with cache.open("a", encoding="utf-8") as f:
                f.write(json.dumps({"page": i, "text": text}, ensure_ascii=False) + "\n")
            if (i + 1) % 25 == 0:
                print(f"OCR vol2: {i + 1}/{doc.page_count}", file=sys.stderr)
    finally:
        doc.close()

    merged = "\n".join(done[k] for k in sorted(done))
    return parse_volume_from_text(merged)


def parse_volume_from_text(text: str) -> dict[int, str]:
    return parse_text(text, relaxed=True)


def merge_volumes(v1: dict[int, str], v2: dict[int, str]) -> dict[int, str]:
    out = dict(v2)
    for n, t in v1.items():
        if looks_like_kazakh(t):
            out[n] = t
        elif n not in out:
            out[n] = t
    return out


def load_db_map(conn: sqlite3.Connection) -> dict[str, int]:
    rows = conn.execute(
        """
        SELECT id, hadith_no FROM hadith
        WHERE source = 'Sahih al-Bukhari'
          AND hadith_no IS NOT NULL AND TRIM(hadith_no) <> ''
        """
    ).fetchall()
    m: dict[str, int] = {}
    for rid, ref in rows:
        m[str(ref).strip()] = int(rid)
    return m


def strip_arabic_tail(text: str) -> str:
    text = re.sub(r"[\s\-·]*[\u0600-\u06FF][\u0600-\u06FF\s\-·]*$", "", text).strip()
    return text


def apply_to_db(
    conn: sqlite3.Connection,
    hadiths: dict[int, str],
    *,
    dry_run: bool,
) -> tuple[int, int, int]:
    ref_map = load_db_map(conn)
    cols = {r[1] for r in conn.execute("PRAGMA table_info(hadith)").fetchall()}
    updated = skipped = missing = 0
    for num, text_kk in sorted(hadiths.items()):
        ref = str(num)
        db_id = ref_map.get(ref)
        if db_id is None:
            missing += 1
            continue
        text_kk = clean_text_content(strip_arabic_tail(text_kk))
        if len(text_kk) < 40:
            skipped += 1
            continue
        if dry_run:
            updated += 1
            continue
        sets = ["text_kk = ?", "updated_at = datetime('now')"]
        bind: list = [text_kk]
        if "kk_source_site" in cols:
            sets.append("kk_source_site = ?")
            bind.append(SOURCE_SITE)
        if "translation_status" in cols:
            sets.append("translation_status = ?")
            bind.append("qmdb_pdf_2005")
        bind.append(db_id)
        conn.execute(f"UPDATE hadith SET {', '.join(sets)} WHERE id = ?", tuple(bind))
        updated += 1
    if not dry_run:
        conn.commit()
    return updated, skipped, missing


def write_preview(out: Path, hadiths: dict[int, str]) -> None:
    rows = [
        {"hadithNo": n, "textKk": t, "sourceLabel": SOURCE_LABEL}
        for n, t in sorted(hadiths.items())
    ]
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Import QMDB Bukhari KK PDF into SQLite hadith")
    ap.add_argument("--vol1", type=Path, required=True)
    ap.add_argument("--vol2", type=Path)
    ap.add_argument("--db", type=Path, default=ROOT / "global_clean.db")
    ap.add_argument("--ocr-vol2", action="store_true", help="OCR volume II (slow; caches pages)")
    ap.add_argument("--ocr-cache", type=Path, default=OCR_CACHE)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--preview", type=Path, default=ROOT / "data" / "bukhari_kk_pdf_import.json")
    args = ap.parse_args()

    print("Parsing volume I…", file=sys.stderr)
    v1 = parse_volume(args.vol1)
    print(f"Volume I: {len(v1)} hadiths ({min(v1)}–{max(v1)})", file=sys.stderr)

    v2: dict[int, str] = {}
    if args.vol2 and args.vol2.is_file():
        if args.ocr_vol2:
            print("OCR volume II…", file=sys.stderr)
            v2 = ocr_volume(args.vol2, cache=args.ocr_cache)
        else:
            print("Parsing volume II text layer (often garbled)…", file=sys.stderr)
            v2 = parse_volume(args.vol2)
            v2 = {n: t for n, t in v2.items() if looks_like_kazakh(t)}
        print(f"Volume II usable: {len(v2)} hadiths", file=sys.stderr)

    merged = merge_volumes(v1, v2)
    print(f"Merged: {len(merged)} hadiths", file=sys.stderr)
    write_preview(args.preview, merged)

    conn = sqlite3.connect(str(args.db))
    try:
        updated, skipped, missing = apply_to_db(conn, merged, dry_run=not args.apply or args.dry_run)
    finally:
        conn.close()

    mode = "DRY-RUN" if (args.dry_run or not args.apply) else "APPLIED"
    print(
        f"{mode}: updated={updated} skipped={skipped} missing_ref={missing} preview={args.preview}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
