#!/usr/bin/env python3
"""Verify PAGE_13: book reading == manifest == MP3 exists."""
from __future__ import annotations

import re
from pathlib import Path

MOBILE = Path(__file__).resolve().parents[1]
book = (MOBILE / "src/content/tajweedManualBook.ts").read_text(encoding="utf-8")
manifest = (MOBILE / "src/content/tajweedExampleReadingManifest.generated.ts").read_text(
    encoding="utf-8"
)
audio_manifest = (
    MOBILE / "src/content/tajweedExampleAudioManifest.generated.ts"
).read_text(encoding="utf-8")
examples_dir = MOBILE / "assets/tajweed/examples"

block = book.split("const PAGE_13")[1].split("const PAGE_14")[0]
rows: list[tuple[str, str, str | None, bool, bool]] = []

for m in re.finditer(r'arabic:\s*"([^"]+)",\s*reading:\s*"([^"]+)"', block):
    ar, rd = m.group(1), m.group(2)
    mf = re.search(rf'"{re.escape(ar)}":\s*"([^"]+)"', manifest)
    af = re.search(rf'"{re.escape(ar)}":\s*"([^"]+)"', audio_manifest)
    mf_rd = mf.group(1) if mf else None
    mp3_ok = False
    if af:
        mp3 = examples_dir / af.group(1)
        mp3_ok = mp3.exists() and mp3.stat().st_size > 500
    rows.append((ar, rd, mf_rd, mp3_ok, mf_rd == rd))

print(f"PAGE_13 examples: {len(rows)}")
failed = 0
for ar, rd, mf_rd, mp3_ok, match in rows:
    ok = mp3_ok and match
    if not ok:
        failed += 1
    print(
        ("OK  " if ok else "FAIL"),
        ar,
        "| book:",
        rd,
        "| manifest:",
        mf_rd,
        "| mp3:",
        mp3_ok,
    )

raise SystemExit(1 if failed else 0)
