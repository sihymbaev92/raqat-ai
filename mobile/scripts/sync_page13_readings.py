#!/usr/bin/env python3
"""Sync page 13 OCR text → Muftyat оқулық транскрипциясы (PAGE_13 manual readings)."""
from __future__ import annotations

import json
from pathlib import Path

MOBILE = Path(__file__).resolve().parents[1]
TS = MOBILE / "src" / "content" / "tajweedMuftyatPageText.ts"
JSON = MOBILE / "src" / "content" / "tajweedMuftyatPageText.json"

# Оқулық (tajweedManualBook PAGE_13) — compact Muftyat «ә» convention
MUFTYAT_READINGS = [
    "уәзә‘а",
    "зәрәә",
    "дәрәжә",
    "әдәбә",
    "дәрибә",
    "уәрисә",
    "уәзи‘a",
    "әрибә",
    "рәзулә",
    "уди‘a",
    "рузиқа",
    "дурибә",
    "әрих",
    "уд‘у",
    "ән",
    "зид",
]

# Eski буын (·) нұсқалары — OCR/sync қателері
DOTTED = [
    "уа·за·‘а",
    "за·ра·а",
    "да·ра·жа",
    "а·да·ба",
    "да·ри·ба",
    "уа·ри·са",
    "уа·зи·‘а",
    "а·ри·ба",
    "ра·зу·ла",
    "у·ди·‘а",
    "ру·зи·қа",
    "ду·ри·ба",
    "а·ри·х",
    "у·д·‘у",
    "а·н",
    "зи·д",
]


def patch_text(text: str) -> str:
    for dotted, kk in zip(DOTTED, MUFTYAT_READINGS):
        text = text.replace(dotted, kk)
    return text


def patch_files() -> None:
    raw = TS.read_text(encoding="utf-8")
    TS.write_text(patch_text(raw), encoding="utf-8")

    data = json.loads(JSON.read_text(encoding="utf-8"))
    for row in data:
        if row.get("page") != 13:
            continue
        row["text"] = patch_text(row["text"])
        row["displayText"] = patch_text(row["displayText"])
    JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    patch_files()
    for kk in MUFTYAT_READINGS:
        print(kk)
