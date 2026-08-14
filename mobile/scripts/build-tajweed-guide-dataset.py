#!/usr/bin/env python3
"""Build bundled tajweed-guide-dataset.json from manual book + audio manifests + Quran word lookup.

Regenerate:
  python scripts/build-tajweed-guide-dataset.py
"""
from __future__ import annotations

import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

MOBILE = Path(__file__).resolve().parents[1]
MANUAL = MOBILE / "src/content/tajweedManualBook.ts"
ALPHABET = MOBILE / "src/content/tajweedAlphabet.ts"
AUDIO_MANIFEST = MOBILE / "src/content/tajweedExampleAudioManifest.generated.ts"
READING_MANIFEST = MOBILE / "src/content/tajweedExampleReadingManifest.generated.ts"
QURAN = MOBILE / "assets/bundled/quran-uthmani-full.json"
OUT = MOBILE / "assets/bundled/tajweed-guide-dataset.json"
DEFAULT_RECITER = "ar.husary"


def norm_ar(text: str) -> str:
    return unicodedata.normalize("NFC", (text or "").strip())


def parse_ts_manifest(path: Path) -> dict[str, str]:
    src = path.read_text(encoding="utf-8")
    out: dict[str, str] = {}
    for m in re.finditer(r'"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"', src):
        key = json.loads(f'"{m.group(1)}"')
        val = json.loads(f'"{m.group(2)}"')
        out[norm_ar(key)] = val
    return out


def extract_manual_readings() -> dict[str, str]:
    out: dict[str, str] = {}
    src = MANUAL.read_text(encoding="utf-8")
    for m in re.finditer(
        r'arabic:\s*"([^"]+)"(?:,\s*reading:\s*"((?:\\.|[^"\\])*)")?',
        src,
    ):
        ar = norm_ar(m.group(1))
        reading = m.group(2)
        if reading:
            out[ar] = json.loads(f'"{reading}"')
    return out


def extract_arabic_occurrences() -> list[str]:
    out: list[str] = []
    for rel in (MANUAL, ALPHABET):
        src = rel.read_text(encoding="utf-8")
        for m in re.finditer(r'(?:arabic|example):\s*"([^"]+)"', src):
            ar = (m.group(1) or "").strip()
            if ar and any("\u0600" <= c <= "\u06FF" for c in ar):
                out.append(ar)
    seen: set[str] = set()
    uniq: list[str] = []
    for ar in out:
        n = norm_ar(ar)
        if n not in seen:
            seen.add(n)
            uniq.append(ar)
    return uniq


def load_quran_index() -> dict[str, list[tuple[int, int, int]]]:
    """arabic token -> [(surah, ayah, wordIndex), ...]"""
    data = json.loads(QURAN.read_text(encoding="utf-8"))
    index: dict[str, list[tuple[int, int, int]]] = {}
    for surah in data["data"]["surahs"]:
        sn = int(surah["number"])
        for ayah in surah["ayahs"]:
            an = int(ayah["numberInSurah"])
            tokens = (ayah.get("text") or "").split()
            for wi, tok in enumerate(tokens):
                key = norm_ar(tok)
                index.setdefault(key, []).append((sn, an, wi))
    return index


def pick_ayah_ref(ar: str, qindex: dict[str, list[tuple[int, int, int]]]) -> tuple[int, int, int] | None:
    hits = qindex.get(norm_ar(ar))
    if not hits:
        return None
    return hits[0]


def main() -> None:
    audio_map = parse_ts_manifest(AUDIO_MANIFEST)
    reading_map = parse_ts_manifest(READING_MANIFEST)
    manual_readings = extract_manual_readings()
    qindex = load_quran_index()

    examples: dict[str, dict] = {}
    for ar in extract_arabic_occurrences():
        key = norm_ar(ar)
        if not key or len(key) == 1 and "\u0660" <= key <= "\u0669":
            continue

        reading = manual_readings.get(key) or reading_map.get(key) or ""
        audio_file = audio_map.get(key)
        ayah_ref = pick_ayah_ref(ar, qindex)

        # Оқулық мысалы — harakat клип (13-бет жаттығулары EveryAyah емес).
        if key in manual_readings and audio_file:
            audio = {"source": "harakat-clips", "file": audio_file}
        elif ayah_ref and len(key) >= 3 and not audio_file:
            surah, ayah, word_index = ayah_ref
            audio = {
                "source": "everyayah-word",
                "surah": surah,
                "ayah": ayah,
                "wordIndex": word_index,
                "reciterEdition": DEFAULT_RECITER,
            }
        elif audio_file:
            audio = {"source": "harakat-clips", "file": audio_file}
        else:
            continue

        examples[key] = {
            "arabic": ar,
            "readingKk": reading,
            "audio": audio,
            "textSource": "Muftyat manual" if key in manual_readings else "alphabet/grid",
        }

    dataset = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sources": {
            "textbook": "Muftyat — Құран оқып-үйренейік! (pages 13–77 manual)",
            "alphabetReference": "https://github.com/BBjamaat/learning-arabic-letters",
            "tajweedRules": "https://github.com/quran/quran-tajweed",
            "audioHarakatClips": "https://arabic-online.ru (harakat syllable clips)",
            "audioQuran": "EveryAyah / Quran.com API (ar.husary word segments)",
        },
        "examples": examples,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding="utf-8")
    everyayah = sum(1 for e in examples.values() if e["audio"]["source"] == "everyayah-word")
    harakat = sum(1 for e in examples.values() if e["audio"]["source"] == "harakat-clips")
    print(f"wrote {OUT.relative_to(MOBILE)} — {len(examples)} examples ({everyayah} everyayah, {harakat} harakat-clips)")


if __name__ == "__main__":
    main()
