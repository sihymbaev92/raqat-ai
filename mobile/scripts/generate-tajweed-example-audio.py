#!/usr/bin/env python3
"""Generate example MP3s — harakat клиптері (arabic-online.ru) буын-бuyn.

Әр әріп+харакат жеке клип; кластер жоқ болса edge-tts fallback.

Regenerate:
  python scripts/generate-tajweed-example-audio.py --force
  node scripts/generate-tajweed-example-asset-map.cjs
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import time
import unicodedata
from pathlib import Path

import edge_tts

from tajweed_harakat_translit_kk import format_reading_kk

MOBILE = Path(__file__).resolve().parents[1]
OUT = MOBILE / "assets" / "tajweed" / "examples"
HARAKAT = MOBILE / "assets" / "tajweed" / "harakat"
MANIFEST_OUT = MOBILE / "src" / "content" / "tajweedExampleAudioManifest.generated.ts"
READING_MANIFEST_OUT = MOBILE / "src" / "content" / "tajweedExampleReadingManifest.generated.ts"
VOICE = "ar-SA-HamedNeural"
FALLBACK_RATE = "-42%"
FALLBACK_PITCH = "-1Hz"
SYLLABLE_GAP_MS = 22

BARE_ALPHABET = set("ابتثجحخدذرزسشصضطظعغفقكلمنوهي")

AR_SLUG: dict[str, str] = {
    "ا": "alif",
    "أ": "alif",
    "إ": "alif",
    "آ": "alif",
    "ب": "ba",
    "ت": "ta",
    "ث": "tha",
    "ج": "jim",
    "ح": "ha",
    "خ": "kha",
    "د": "dal",
    "ذ": "dhal",
    "ر": "ra",
    "ز": "zay",
    "س": "sin",
    "ش": "shin",
    "ص": "sad",
    "ض": "dad",
    "ط": "ta_emph",
    "ظ": "za_emph",
    "ع": "ayn",
    "غ": "ghayn",
    "ف": "fa",
    "ق": "qaf",
    "ك": "kaf",
    "ل": "lam",
    "م": "mim",
    "ن": "nun",
    "ه": "ha_end",
    "و": "waw",
    "ي": "ya",
    "ة": "ta",
    "ى": "ya",
    "ء": "alif",
    "ؤ": "waw",
    "ئ": "ya",
}

COMBINING = {chr(c) for c in range(0x64B, 0x660)} | {"\u0640", "\u0670"}
COMBINING.update(chr(c) for c in range(0x6D6, 0x6EE))

READABLE: dict[str, str] = {
    "أَب": "ab.mp3",
    "بَب": "bab.mp3",
    "تَب": "tab.mp3",
    "ثَلَاث": "thalath.mp3",
    "جَمَل": "jamal.mp3",
    "حَجّ": "hajj.mp3",
    "خَبَر": "khabar.mp3",
    "دِين": "din.mp3",
    "ذَكَر": "dhikr.mp3",
    "رَبّ": "rabb.mp3",
    "زَكَاة": "zakat.mp3",
    "سَلَام": "salam.mp3",
    "شَيْء": "shay.mp3",
    "صَلَاة": "salat.mp3",
    "ضَرَب": "darab.mp3",
    "طَيِّب": "tayyib.mp3",
    "ظُلْم": "zulm.mp3",
    "عَلِمَ": "alima.mp3",
    "غَفَار": "ghaffar.mp3",
    "فَضْل": "fadl.mp3",
    "قُرْآن": "quran.mp3",
    "كَرِيم": "karim.mp3",
    "لَا": "la.mp3",
    "مُحَمَّد": "muhammad.mp3",
    "نُور": "nur.mp3",
    "وَقْت": "waqt.mp3",
    "هُدًى": "huda.mp3",
    "يَوْم": "yawm.mp3",
}


def norm_ar(text: str) -> str:
    return unicodedata.normalize("NFC", (text or "").strip())


def segment_clusters(text: str) -> list[str]:
    text = norm_ar(text)
    out: list[str] = []
    i = 0
    while i < len(text):
        ch = text[i]
        if ch.isspace() or ch in "،,.":
            i += 1
            continue
        cluster = ch
        i += 1
        while i < len(text) and text[i] in COMBINING:
            cluster += text[i]
            i += 1
        out.append(cluster)
    return out


def harakat_kind(cluster: str) -> str:
    if "\u0652" in cluster:
        return "saken"
    if "\u064E" in cluster or "\u064B" in cluster:
        return "fatha"
    if "\u0650" in cluster or "\u064D" in cluster:
        return "kesra"
    if "\u064F" in cluster or "\u064C" in cluster:
        return "damma"
    if "\u0651" in cluster:
        return "fatha"
    return "fatha"


def harakat_clip(cluster: str) -> Path | None:
    slug = AR_SLUG.get(cluster[0])
    if not slug:
        return None
    kind = harakat_kind(cluster)
    if kind == "saken":
        saken = HARAKAT / f"{slug}_saken.mp3"
        return saken if saken.exists() else None
    path = HARAKAT / f"{slug}_{kind}.mp3"
    if path.exists():
        return path
    if kind != "fatha":
        alt = HARAKAT / f"{slug}_fatha.mp3"
        if alt.exists():
            return alt
    return None


def ffmpeg_exe() -> str | None:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def concat_mp3(parts: list[Path], dest: Path, *, gap_ms: int) -> None:
    if len(parts) == 1:
        dest.write_bytes(parts[0].read_bytes())
        return

    ffmpeg = ffmpeg_exe()
    if not ffmpeg:
        dest.write_bytes(b"".join(p.read_bytes() for p in parts))
        return

    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)

        if gap_ms > 0:
            inputs: list[str] = []
            n_inputs = 0
            for i, part in enumerate(parts):
                inputs.extend(["-i", str(part)])
                n_inputs += 1
                if i >= len(parts) - 1:
                    continue
                silence = td_path / f"gap_{i}.mp3"
                subprocess.run(
                    [
                        ffmpeg,
                        "-y",
                        "-f",
                        "lavfi",
                        "-i",
                        "anullsrc=r=24000:cl=mono",
                        "-t",
                        str(gap_ms / 1000.0),
                        "-q:a",
                        "9",
                        str(silence),
                    ],
                    check=True,
                    capture_output=True,
                )
                inputs.extend(["-i", str(silence)])
                n_inputs += 1
            chains = "".join(f"[{i}:0]" for i in range(n_inputs))
            filt = f"{chains}concat=n={n_inputs}:v=0:a=1[out]"
            subprocess.run(
                [ffmpeg, "-y", *inputs, "-filter_complex", filt, "-map", "[out]", str(dest)],
                check=True,
                capture_output=True,
            )
            return

        # gap=0: concat demuxer — паузасыз, біртұтас сөз
        list_file = td_path / "concat.txt"
        list_file.write_text(
            "\n".join(f"file '{p.resolve().as_posix()}'" for p in parts),
            encoding="utf-8",
        )
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(list_file),
                "-c:a",
                "libmp3lame",
                "-q:a",
                "4",
                str(dest),
            ],
            check=True,
            capture_output=True,
        )


async def synth_fallback(text: str, dest: Path) -> None:
    await edge_tts.Communicate(text, VOICE, rate=FALLBACK_RATE, pitch=FALLBACK_PITCH).save(str(dest))


def extract_manual_readings() -> dict[str, str]:
    """Оқулық reading — транскрипция этalon."""
    out: dict[str, str] = {}
    for rel in ("src/content/tajweedManualBook.ts",):
        src = (MOBILE / rel).read_text(encoding="utf-8")
        for m in re.finditer(
            r'arabic:\s*"([^"]+)"(?:,\s*reading:\s*"((?:\\.|[^"\\])*)")?',
            src,
        ):
            ar = norm_ar(m.group(1))
            reading = m.group(2)
            if reading:
                out[ar] = reading
    return out


def reading_for_example(ar: str, manual: dict[str, str]) -> str:
    key = norm_ar(ar)
    if key in manual:
        return manual[key]
    return format_reading_kk(ar)


def skip_example_tts(text: str) -> bool:
    n = norm_ar(text)
    if n in BARE_ALPHABET:
        return True
    if len(n) == 1 and "\u0660" <= n <= "\u0669":
        return True
    return False


def extract_arabic_occurrences() -> list[str]:
    out: list[str] = []
    for rel in ("src/content/tajweedManualBook.ts", "src/content/tajweedAlphabet.ts"):
        src = (MOBILE / rel).read_text(encoding="utf-8")
        for m in re.finditer(r'(?:arabic|example):\s*"([^"]+)"', src):
            ar = (m.group(1) or "").strip()
            if ar and any("\u0600" <= c <= "\u06FF" for c in ar):
                out.append(ar)
    return out


def build_audio_mapping(occurrences: list[str]) -> dict[str, str]:
    by_norm: dict[str, str] = {}
    for ar in occurrences:
        if skip_example_tts(ar):
            continue
        n = norm_ar(ar)
        if n not in by_norm:
            by_norm[n] = filename_for(ar)
    mapping: dict[str, str] = {}
    for ar in occurrences:
        if skip_example_tts(ar):
            continue
        n = norm_ar(ar)
        file = by_norm.get(n)
        if file:
            mapping[ar] = file
    return mapping


def filename_for(ar: str) -> str:
    key = norm_ar(ar)
    for readable_ar, fname in READABLE.items():
        if norm_ar(readable_ar) == key:
            return fname
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:10]
    return f"ex_{digest}.mp3"


def write_manifest(mapping: dict[str, str]) -> None:
    lines = [
        "/** Auto-generated — do not edit. Regen: python scripts/generate-tajweed-example-audio.py */",
        "export const TAJWEED_EXAMPLE_AUDIO_MANIFEST: Record<string, string> = {",
    ]
    for ar, file in sorted(mapping.items(), key=lambda x: x[0]):
        esc = json.dumps(ar, ensure_ascii=False)
        lines.append(f"  {esc}: {json.dumps(file)},")
    lines.append("};")
    lines.append("")
    MANIFEST_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"manifest → {MANIFEST_OUT.relative_to(MOBILE)} ({len(mapping)} entries)")

    manual = extract_manual_readings()
    reading_lines = [
        "/** Auto-generated — do not edit. Regen: python scripts/generate-tajweed-example-audio.py */",
        "export const TAJWEED_EXAMPLE_READING_MANIFEST: Record<string, string> = {",
    ]
    for ar in sorted(mapping.keys()):
        reading = reading_for_example(ar, manual)
        if not reading:
            continue
        reading_lines.append(f"  {json.dumps(ar, ensure_ascii=False)}: {json.dumps(reading, ensure_ascii=False)},")
    reading_lines.append("};")
    reading_lines.append("")
    READING_MANIFEST_OUT.write_text("\n".join(reading_lines), encoding="utf-8")
    print(f"reading manifest → {READING_MANIFEST_OUT.relative_to(MOBILE)}")


TRIM_AF = "silenceremove=stop_periods=-1:stop_duration=0.04:stop_threshold=-44dB"


def trim_clip(src: Path, dest: Path) -> None:
    ffmpeg = ffmpeg_exe()
    if not ffmpeg:
        dest.write_bytes(src.read_bytes())
        return
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-i",
            str(src),
            "-af",
            TRIM_AF,
            "-c:a",
            "libmp3lame",
            "-q:a",
            "4",
            str(dest),
        ],
        check=True,
        capture_output=True,
    )


async def synth_cluster_clip(cluster: str, td: Path, idx: int) -> Path:
    clip = harakat_clip(cluster)
    part = td / f"{idx:03d}.mp3"
    if clip:
        part.write_bytes(clip.read_bytes())
        return part
    fb = td / f"{idx:03d}_fb.mp3"
    await synth_fallback(cluster, fb)
    trim_clip(fb, part)
    return part


async def synth_word(filename: str, text: str, *, force: bool) -> None:
    out = OUT / filename
    if not force and out.exists() and out.stat().st_size > 500:
        print(f"SKIP {filename} (exists)")
        return

    if not norm_ar(text):
        print(f"SKIP {filename} (empty)")
        return

    clusters = segment_clusters(text)
    if not clusters:
        print(f"SKIP {filename} (no clusters)")
        return

    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        parts: list[Path] = []
        clip_hits = 0
        for idx, cluster in enumerate(clusters):
            if harakat_clip(cluster):
                clip_hits += 1
            parts.append(await synth_cluster_clip(cluster, td_path, idx))

        tmp = out.with_suffix(".tmp.mp3")
        concat_mp3(parts, tmp, gap_ms=SYLLABLE_GAP_MS)
        trim_clip(tmp, out)
        if tmp.exists() and tmp != out:
            try:
                tmp.unlink()
            except OSError:
                pass

    mode = "harakat-clips" if clip_hits == len(clusters) else f"harakat+tts({clip_hits}/{len(clusters)})"
    print(f"OK {filename} ← {text} [{mode}] ({out.stat().st_size} B)")


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if not HARAKAT.exists() or not any(HARAKAT.glob("*.mp3")):
        print("WARN: harakat clips missing (letter audio only); example MP3s use edge-tts")

    OUT.mkdir(parents=True, exist_ok=True)
    occurrences = extract_arabic_occurrences()
    mapping = build_audio_mapping(occurrences)
    write_manifest(mapping)

    targets = sorted(
        {norm_ar(ar): ar for ar in occurrences if not skip_example_tts(ar)}.values(),
        key=lambda s: (s in READABLE, s),
    )
    for ar in targets:
        await synth_word(mapping[ar], ar, force=args.force)
        time.sleep(0.05)

    print(f"wrote {len(targets)} mp3 → {OUT} (harakat clips, gap={SYLLABLE_GAP_MS}ms)")

    dataset_script = MOBILE / "scripts" / "build-tajweed-guide-dataset.py"
    if dataset_script.exists():
        import subprocess as sp

        sp.run([sys.executable, str(dataset_script)], check=False)


if __name__ == "__main__":
    asyncio.run(main())
