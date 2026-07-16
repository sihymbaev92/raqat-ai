#!/usr/bin/env python3
"""Generate clear male Arabic letter-name MP3s for Tajweed alphabet (edge-tts).

Each clip: classical name + short fatha sound (makhraj cue), slow and loud.
Regenerate: python scripts/generate-tajweed-letter-audio.py
"""
from __future__ import annotations

import asyncio
from pathlib import Path

import edge_tts

# Saudi male neural — MSA letter names for tajweed teaching.
VOICE = "ar-SA-HamedNeural"
RATE = "-22%"
VOLUME = "+18%"
PITCH = "-4Hz"

# (slug, glyph, spoken). Spoken = name + pause cue + short fatha sound.
LETTERS: list[tuple[str, str, str]] = [
    ("alif", "ا", "أَلِفْ. أَا"),
    ("ba", "ب", "بَاء. بَا"),
    ("ta", "ت", "تَاء. تَا"),
    ("tha", "ث", "ثَاء. ثَا"),
    ("jim", "ج", "جِيم. جَا"),
    ("ha", "ح", "حَاء. حَا"),
    ("kha", "خ", "خَاء. خَا"),
    ("dal", "د", "دَال. دَا"),
    ("dhal", "ذ", "ذَال. ذَا"),
    ("ra", "ر", "رَاء. رَا"),
    ("zay", "ز", "زَاي. زَا"),
    ("sin", "س", "سِين. سَا"),
    ("shin", "ش", "شِين. شَا"),
    ("sad", "ص", "صَاد. صَا"),
    ("dad", "ض", "ضَاد. ضَا"),
    ("ta_emph", "ط", "طَاء. طَا"),
    ("za_emph", "ظ", "ظَاء. ظَا"),
    ("ayn", "ع", "عَيْن. عَا"),
    ("ghayn", "غ", "غَيْن. غَا"),
    ("fa", "ف", "فَاء. فَا"),
    ("qaf", "ق", "قَاف. قَا"),
    ("kaf", "ك", "كَاف. كَا"),
    ("lam", "ل", "لَام. لَا"),
    ("mim", "م", "مِيم. مَا"),
    ("nun", "ن", "نُون. نَا"),
    ("waw", "و", "وَاو. وَا"),
    ("ha_end", "ه", "هَاء. هَا"),
    ("ya", "ي", "يَاء. يَا"),
]

OUT = Path(__file__).resolve().parents[1] / "assets" / "tajweed" / "letters"


async def gen_one(slug: str, spoken: str) -> None:
    out = OUT / f"{slug}.mp3"
    communicate = edge_tts.Communicate(
        spoken,
        VOICE,
        rate=RATE,
        volume=VOLUME,
        pitch=PITCH,
    )
    await communicate.save(str(out))
    print(f"OK {slug} ({out.stat().st_size} B)")


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    # Sequential: more reliable than parallel for edge-tts rate limits.
    for slug, _ar, spoken in LETTERS:
        await gen_one(slug, spoken)
        await asyncio.sleep(0.35)
    print(f"wrote {len(LETTERS)} files → {OUT}")


if __name__ == "__main__":
    asyncio.run(main())
