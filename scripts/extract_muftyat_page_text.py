#!/usr/bin/env python3
"""Extract per-page text + Arabic segments from muftyat tajweed PDF for TTS."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PDF_LOCAL = REPO / "data" / "muftyat-quran-oqip-uyreneyik.pdf"
QURAN_UTSMANI = REPO / "mobile" / "assets" / "bundled" / "quran-uthmani-full.json"
OUT_JSON = REPO / "mobile" / "src" / "content" / "tajweedMuftyatPageText.json"
OUT_TS = REPO / "mobile" / "src" / "content" / "tajweedMuftyatPageText.ts"

# (page -> list of (surah, ayah_start, ayah_end))
PAGE_QURAN_ARABIC: dict[int, list[tuple[int, int, int]]] = {
    78: [(1, 1, 7)],
    79: [(2, 1, 5)],
    80: [(103, 1, 3), (104, 1, 3)],
    81: [(104, 4, 9), (105, 1, 5)],
    82: [(106, 1, 4), (107, 1, 3)],
    83: [(107, 4, 7), (108, 1, 3), (109, 1, 3)],
    84: [(109, 4, 6), (110, 1, 3)],
    85: [(111, 1, 5), (112, 1, 2)],
    86: [(112, 3, 4), (113, 1, 5)],
    87: [(114, 1, 6)],
    88: [(2, 255, 255)],
    89: [(2, 285, 286)],
    90: [(48, 27, 29)],
    91: [(48, 29, 29), (59, 22, 24)],
    92: [(59, 24, 24), (88, 17, 20)],
    93: [(88, 21, 26)],
}

# Namaz / misc duas (pages 96–101) — Arabic from book content
PAGE_STATIC_ARABIC: dict[int, list[str]] = {
    96: [
        "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلٰهَ غَيْرُكَ",
        "التَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلٰى عِبَادِ اللّٰهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    ],
    97: [
        "اللَّهُمَّ صَلِّ عَلٰى مُحَمَّدٍ وَعَلٰى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلٰى إِبْرَاهِيمَ وَعَلٰى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
        "اللَّهُمَّ بَارِكْ عَلٰى مُحَمَّدٍ وَعَلٰى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلٰى إِبْرَاهِيمَ وَعَلٰى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
        "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْاٰخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    ],
    98: [
        "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ",
    ],
    99: [
        "بِسْمِ اللَّهِ",
        "الْحَمْدُ لِلَّهِ",
    ],
    100: [
        "أَسْتَغْفِرُ اللَّهَ",
    ],
}


def normalize_text(raw: str) -> str:
    t = raw.replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def clean_for_tts(text: str) -> str:
    t = text
    t = re.sub(r"^\d+\s*\n", "", t)
    t = re.sub(r"[\uF000-\uF8FF\u200B-\u200F\uFEFF\u061C]", "", t)
    t = re.sub(r"\.{4,}", " ", t)
    t = re.sub(r"\s*\n\s*", ". ", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def clean_for_display(text: str) -> str:
    """Readable page text for the app: keep PDF line breaks instead of TTS sentences."""
    t = text
    t = re.sub(r"[\uF000-\uF8FF\u200B-\u200F\uFEFF\u061C]", "", t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def load_quran_arabic() -> dict[int, dict[int, str]]:
    data = json.loads(QURAN_UTSMANI.read_text(encoding="utf-8"))
    out: dict[int, dict[int, str]] = {}
    for surah in data.get("data", {}).get("surahs", []):
        num = int(surah["number"])
        ayahs: dict[int, str] = {}
        for a in surah.get("ayahs", []):
            ayahs[int(a["numberInSurah"])] = (a.get("text") or "").strip()
        if ayahs:
            out[num] = ayahs
    return out


def arabic_for_page(page: int, quran: dict[int, dict[int, str]]) -> list[str]:
    segments: list[str] = []
    for surah, a0, a1 in PAGE_QURAN_ARABIC.get(page, []):
        sm = quran.get(surah, {})
        for ay in range(a0, a1 + 1):
            txt = sm.get(ay, "").strip()
            if txt:
                segments.append(txt)
    for block in PAGE_STATIC_ARABIC.get(page, []):
        b = block.strip()
        if b:
            segments.append(b)
    return segments


def main() -> None:
    import fitz  # pymupdf

    if not PDF_LOCAL.exists():
        sys.exit(f"PDF missing: {PDF_LOCAL}")

    quran = load_quran_arabic()
    doc = fitz.open(str(PDF_LOCAL))
    rows: list[dict] = []
    for i in range(doc.page_count):
        page = i + 1
        raw = normalize_text(doc[i].get_text())
        text = clean_for_tts(raw)
        display_text = clean_for_display(raw)
        arabic = arabic_for_page(page, quran)
        rows.append({"page": page, "text": text, "displayText": display_text, "arabic": arabic})
    doc.close()

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    ts_lines = [
        "/** Auto-generated — scripts/extract_muftyat_page_text.py */",
        "",
        "export type TajweedMuftyatPageText = {",
        "  page: number;",
        "  /** Kazakh body for kk TTS */",
        "  text: string;",
        "  /** Readable page text with PDF line breaks preserved */",
        "  displayText: string;",
        "  /** Arabic segments (ayahs, duas) for ar TTS after kk */",
        "  arabic: string[];",
        "};",
        "",
        "export const TAJWEED_MUFTYAT_PAGE_TEXT: TajweedMuftyatPageText[] = ",
        json.dumps(rows, ensure_ascii=False, indent=2),
        ";",
        "",
        "export function getMuftyatPageText(page: number): TajweedMuftyatPageText | undefined {",
        "  return TAJWEED_MUFTYAT_PAGE_TEXT.find((p) => p.page === page);",
        "}",
        "",
    ]
    OUT_TS.write_text("\n".join(ts_lines), encoding="utf-8")

    with_ar = sum(1 for r in rows if r["arabic"])
    sparse = sum(1 for r in rows if len(r["text"]) < 20)
    print(f"Wrote {OUT_TS.name}: pages={len(rows)} sparse={sparse} with_arabic={with_ar}")


if __name__ == "__main__":
    main()
