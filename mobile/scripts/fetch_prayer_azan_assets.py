#!/usr/bin/env python3
"""
Намаз хабарламалары: prayer_azan_*.wav — Wikimedia Commons сапalı азан жазбалары.

iOS custom notification ≤30s — әр клип ~29s, loudnorm + fade.
Жаңарту: npm run fetch:azan (mobile/)
"""
from __future__ import annotations

import hashlib
import json
import sys
import time
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

MOBILE_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = MOBILE_ROOT / "assets" / "sounds"
ATTRIBUTION = OUT_DIR / "AZAN_ATTRIBUTION.md"

USER_AGENT = "RaqatApp/1.0 (prayer azan asset fetch; https://rahatomir.com)"

# id → (Wikimedia title, wav name, attribution, duration ms, start offset ms)
AZAN_SOURCES: dict[str, tuple[str, str, str, int, int]] = {
    "adhan_haramain": (
        "File:Call to prayer by Sabah Fakhry.mp3",
        "prayer_azan_classic.wav",
        "Call to prayer by Sabah Fakhry (Egypt) — Wikimedia Commons, CC BY-SA 4.0",
        29_000,
        0,
    ),
    "adhan_madina_clear": (
        "File:Azan.ogg",
        "prayer_azan_madina.wav",
        "Azan.ogg (Andrewler, 2022) — Wikimedia Commons, CC BY-SA 4.0",
        29_000,
        0,
    ),
    "adhan_makkah_live": (
        "File:Adhan, Great Mosque of Mecca - Jan 21, 2013.webm",
        "prayer_azan_makkah.wav",
        "Adhan, Great Mosque of Mecca (21 Jan 2013) — Wikimedia Commons, CC BY-SA 4.0",
        29_000,
        2_000,
    ),
    "adhan_soft_cc0": (
        "File:Beautiful adhan.ogg",
        "prayer_azan_soft.wav",
        "Beautiful adhan.ogg — Wikimedia Commons, CC0 Public Domain",
        29_000,
        0,
    ),
    "adhan_takbir_high": (
        "File:The Adhan - Muslim Call to Prayer - Aaqib Azeez.mp3",
        "prayer_azan_takbir.wav",
        "The Adhan by Aaqib Azeez — Atcovi, Wikimedia Commons, CC BY-SA 4.0",
        29_000,
        0,
    ),
}

TARGET_DBFS = -14.0


def commons_download_url(file_title: str) -> str:
    q = urllib.parse.urlencode(
        {
            "action": "query",
            "titles": file_title,
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json",
        }
    )
    api = f"https://commons.wikimedia.org/w/api.php?{q}"
    req = urllib.request.Request(api, headers={"User-Agent": USER_AGENT})
    data = _json_get(req, timeout=90)
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        info = page.get("imageinfo")
        if info and info[0].get("url"):
            raw = info[0]["url"]
            return raw.split("?")[0]
    raise RuntimeError(f"No URL for {file_title}")


def _json_get(req: urllib.request.Request, *, timeout: float) -> dict:
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.load(r)
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < 4:
                time.sleep(2.0 * (attempt + 1))
                continue
            raise
    raise RuntimeError("commons API: max retries")


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = r.read()
            break
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < 4:
                time.sleep(2.0 * (attempt + 1))
                continue
            raise
    else:
        raise RuntimeError("download: max retries")
    dest.write_bytes(data)
    print(f"  downloaded {len(data):,} bytes")


def convert_to_wav(
    src: Path,
    dest: Path,
    *,
    max_duration_ms: int,
    start_offset_ms: int = 0,
) -> None:
    import imageio_ffmpeg
    import subprocess

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    max_s = max_duration_ms / 1000.0
    start_s = start_offset_ms / 1000.0
    fade_out_start = max(0.0, max_s - 0.35)
    af = (
        f"highpass=f=70,lowpass=f=15000,"
        f"loudnorm=I={TARGET_DBFS}:TP=-1.0:LRA=8,"
        f"afade=t=in:st=0:d=0.12,afade=t=out:st={fade_out_start:.2f}:d=0.35"
    )
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [ffmpeg, "-y"]
    if start_s > 0:
        cmd.extend(["-ss", f"{start_s:.3f}"])
    cmd.extend(
        [
            "-i",
            str(src),
            "-vn",
            "-map",
            "0:a:0?",
            "-t",
            str(max_s),
            "-ac",
            "1",
            "-ar",
            "44100",
            "-af",
            af,
            str(dest),
        ]
    )
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        raise RuntimeError(f"ffmpeg failed for {dest.name}")
    if dest.stat().st_size < 8_000:
        raise RuntimeError(f"Output too small: {dest.name}")
    print(f"  exported {dest.name} ({dest.stat().st_size:,} bytes, {max_s:.0f}s)")


def md5(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def write_attribution() -> None:
    lines = [
        "# Азан дыбыстары — дереккөздер",
        "",
        "Жинақтағы `prayer_azan_*.wav` — Wikimedia Commons (~29s клип, iOS/Android фондық хабарлама). Баптауларда тек 5 curated азан preset көрсетіледі.",
        "",
    ]
    for key, (_, wav, note, dur, start) in AZAN_SOURCES.items():
        extra = f", start {start // 1000}s" if start else ""
        lines.append(f"- **{key}** (`{wav}`, {dur // 1000}s{extra}): {note}")
    lines.append("")
    lines.append("Жаңарту: `npm run fetch:azan` (mobile/)")
    ATTRIBUTION.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    tmp = OUT_DIR / "_azan_fetch_tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    hashes: dict[str, str] = {}

    print("Fetching beautiful adhan recordings from Wikimedia Commons…")
    for key, (title, wav_name, _, max_ms, start_ms) in AZAN_SOURCES.items():
        print(f"\n[{key}] {title}")
        url = commons_download_url(title)
        ext = Path(url).suffix or ".bin"
        raw = tmp / f"{key}{ext}"
        download(url, raw)
        out = OUT_DIR / wav_name
        convert_to_wav(raw, out, max_duration_ms=max_ms, start_offset_ms=start_ms)
        hashes[key] = md5(out)
        time.sleep(1.5)

    uniq = set(hashes.values())
    print(f"\nMD5 unique: {len(uniq)} / {len(hashes)}")
    if len(uniq) != len(hashes):
        print("ERROR: duplicate files detected", file=sys.stderr)
        for k, h in hashes.items():
            print(f"  {k}: {h}", file=sys.stderr)
        return 1

    write_attribution()
    import shutil

    shutil.rmtree(tmp, ignore_errors=True)
    print(f"\nDone. Attribution: {ATTRIBUTION}")
    print("Rebuild APK / redeploy web after updating sounds.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
