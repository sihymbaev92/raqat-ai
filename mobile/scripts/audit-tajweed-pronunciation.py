#!/usr/bin/env python3
"""Audit Tajweed example audio routing + spot-check edge-tts vs letter MP3."""
from __future__ import annotations

import asyncio
import re
import unicodedata
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3

MOBILE = Path(__file__).resolve().parents[1]
LETTERS = MOBILE / "assets" / "tajweed" / "letters"
EXAMPLES = MOBILE / "assets" / "tajweed" / "examples"
MANUAL = MOBILE / "src" / "content" / "tajweedManualBook.ts"
BARE = set("ابتثجحخدذرزسشصضطظعغفقكلمنوهي")

# Page 13 harakat lesson — user-reported problem area
SPOT = [
    ("أَدَبَ", "әдәбә"),
    ("وَزَعَ", "уәзә‘а"),
    ("أَنْ", "ән"),
    ("زَرَأَ", "зәрәә"),
    ("ا", "letter:алиф"),
    ("ب", "letter:бә"),
    ("أَبْ", "әб"),
]


def norm(s: str) -> str:
    return unicodedata.normalize("NFC", (s or "").strip())


def letter_file(ar: str) -> Path | None:
    from_map = {
        "ا": "alif.mp3",
        "ب": "ba.mp3",
        "ت": "ta.mp3",
    }
    f = from_map.get(norm(ar))
    if f:
        p = LETTERS / f
        return p if p.exists() else None
    return None


def example_file(ar: str) -> Path | None:
    manifest = (MOBILE / "src" / "content" / "tajweedExampleAudioManifest.generated.ts").read_text(
        encoding="utf-8"
    )
    esc = ar.replace("\\", "\\\\")
    m = re.search(rf'"{re.escape(ar)}": "([^"]+)"', manifest)
    if not m:
        return None
    p = EXAMPLES / m.group(1)
    return p if p.exists() else None


def mp3_info(p: Path) -> str:
    d = MP3(p).info.length
    return f"{d:.2f}s {p.stat().st_size}B"


async def synth_plain(text: str, dest: Path) -> None:
    await edge_tts.Communicate(text, "ar-SA-HamedNeural", rate="-42%", pitch="-1Hz").save(str(dest))


async def main() -> None:
    audit = MOBILE / "scripts" / "_audit_audio"
    audit.mkdir(exist_ok=True)
    print("=== Spot check routing ===")
    for ar, reading in SPOT:
        n = norm(ar)
        if n in BARE:
            lf = letter_file(n) or LETTERS / "alif.mp3"
            lp = LETTERS / {"ا": "alif.mp3", "ب": "ba.mp3"}.get(n, "")
            lp = LETTERS / {"ا": "alif.mp3", "ب": "ba.mp3", "ت": "ta.mp3"}.get(n, "MISSING")
            print(f"  {ar!r:8} → LETTER MP3  {lp.name if lp.exists() else 'MISSING'}  ({reading})")
            if lp.exists():
                print(f"           {mp3_info(lp)}")
        else:
            ef = example_file(ar)
            print(f"  {ar!r:8} → EXAMPLE MP3 {ef.name if ef else 'MISSING'}  (kk: {reading})")
            if ef:
                print(f"           {mp3_info(ef)}")

    print("\n=== Fresh synth compare (أَدَبَ, أَنْ) ===")
    for w in ("أَدَبَ", "أَنْ", "أَبْ"):
        dest = audit / f"fresh_{hash(w) & 0xFFFF:x}.mp3"
        await synth_plain(w, dest)
        print(f"  {w!r} → {mp3_info(dest)}")


asyncio.run(main())
