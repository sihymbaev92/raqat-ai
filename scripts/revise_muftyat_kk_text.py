#!/usr/bin/env python3
"""Batch-revise bundled muftyat Kazakh OCR text in JSON (+ regenerate tajweed .ts)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))

from muftyat_kk_normalize import normalize_muftyat_kk_page_text, normalize_muftyat_kk_text

TAJWEED_JSON = REPO / "mobile" / "src" / "content" / "tajweedMuftyatPageText.json"
TAJWEED_TS = REPO / "mobile" / "src" / "content" / "tajweedMuftyatPageText.ts"
HAJJ_JSON = REPO / "mobile" / "src" / "content" / "hajjMuftyatPageText.json"


def count_hyphen_breaks(text: str) -> int:
    import re

    return len(re.findall(r"[а-яёәіңғүұқөһ]-\n[а-яёәіңғүұқөһ]", text, re.I))


def revise_tajweed() -> None:
    rows = json.loads(TAJWEED_JSON.read_text(encoding="utf-8"))
    before_h = sum(count_hyphen_breaks(r.get("displayText", "")) for r in rows)
    before_t = sum(count_hyphen_breaks(r.get("text", "")) for r in rows)
    for row in rows:
        row["displayText"] = normalize_muftyat_kk_page_text(row.get("displayText", ""))
        row["text"] = normalize_muftyat_kk_text(row.get("text", ""))
    after_h = sum(count_hyphen_breaks(r.get("displayText", "")) for r in rows)
    after_t = sum(count_hyphen_breaks(r.get("text", "")) for r in rows)
    TAJWEED_JSON.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    ts_lines = [
        "/** Auto-generated — scripts/revise_muftyat_kk_text.py */",
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
    TAJWEED_TS.write_text("\n".join(ts_lines), encoding="utf-8")
    print(
        f"tajweed: pages={len(rows)} hyphen_breaks display {before_h}->{after_h} text {before_t}->{after_t}"
    )


def revise_hajj() -> None:
    rows = json.loads(HAJJ_JSON.read_text(encoding="utf-8"))
    before = sum(count_hyphen_breaks(r.get("text", "")) for r in rows)
    for row in rows:
        row["text"] = normalize_muftyat_kk_page_text(row.get("text", ""))
    after = sum(count_hyphen_breaks(r.get("text", "")) for r in rows)
    HAJJ_JSON.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"hajj: pages={len(rows)} hyphen_breaks {before}->{after}")


def main() -> None:
    revise_tajweed()
    revise_hajj()
    print("Done.")


if __name__ == "__main__":
    main()
