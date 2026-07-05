#!/usr/bin/env python3
"""
Намаз хабарламасы: prayer_azan_user_01.mp3 — қолданба иесінің жеке азан клипі.

Файлды қолмен қойыңыз: mobile/assets/sounds/prayer_azan_user_01.mp3
(мысалы Downloads/azan_-_krasivyj_(SkySound.cc).mp3)

npm run fetch:azan — тек attribution жаңарту (жүктемейді).
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

MOBILE_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = MOBILE_ROOT / "assets" / "sounds"
ATTRIBUTION = OUT_DIR / "AZAN_ATTRIBUTION.md"

USER_AGENT = "RaqatApp/1.0 (prayer azan asset fetch; https://rahatomir.com)"

# (key, source url or Commons File:…, mp3 filename, attribution note, max_ms, start_offset_ms)
AZAN_SOURCE = (
    "adhan_haramain",
    "https://archive.org/download/MadinahFajrAzan/MadinahFajrAzanBySheikhFaisalNuman.wmv",
    "prayer_azan_user_01.mp3",
    "Madinah Fajr Azan (Sheikh Faisal Numan) — Internet Archive, CC0 1.0",
    48_000,
    12_000,
)

# Жұмсақ дыбыс: Mecca клиптен төменірек нормализация + жұмсартылған компрессия.
TARGET_DBFS = -18.0


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
    req = urllib.request.Request(
        f"https://commons.wikimedia.org/w/api.php?{q}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if infos and infos[0].get("url"):
            return infos[0]["url"]
    raise RuntimeError(f"No download URL for {file_title}")


def resolve_source_url(source: str) -> str:
    if source.startswith("http://") or source.startswith("https://"):
        return source
    title = source if source.startswith("File:") else f"File:{source}"
    return commons_download_url(title)


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=300) as resp, dest.open("wb") as f:
        f.write(resp.read())
    print(f"  downloaded {dest.name} ({dest.stat().st_size:,} bytes)")


def convert_to_mp3(src: Path, dest: Path, max_duration_ms: int, start_offset_ms: int) -> None:
    import imageio_ffmpeg
    import subprocess

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    max_s = max_duration_ms / 1000.0
    start_s = start_offset_ms / 1000.0
    af = (
        f"atrim=start={start_s}:duration={max_s},"
        f"asetpts=PTS-STARTPTS,"
        f"highpass=f=90,"
        f"lowpass=f=11000,"
        f"acompressor=threshold=-22dB:ratio=2.5:attack=25:release=300,"
        f"loudnorm=I={TARGET_DBFS}:TP=-2.0:LRA=8,"
        f"afade=t=in:st=0:d=2.8,"
        f"afade=t=out:st={max(0, max_s - 3.2):.3f}:d=3.2"
    )
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg,
        "-y",
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
        "-codec:a",
        "libmp3lame",
        "-q:a",
        "3",
        str(dest),
    ]
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
    text = "\n".join(
        [
            "# Азан дыбысы",
            "",
            "Жинақтағы `prayer_azan_user_01.mp3` — қолданба иесінің таңдаған жеке азан клипі.",
            "",
            "- **adhan_haramain** (`prayer_azan_user_01.mp3`): SkySound.cc — «Красивый азан» (пайдаланушы жіберген файл)",
            "",
            "Басқа azan MP3 жинақта жоқ — APK көлемі мен жадты үнемдеу үшін тек бір дыбыс.",
            "",
        ]
    )
    ATTRIBUTION.write_text(text, encoding="utf-8")


def main() -> int:
    mp3 = OUT_DIR / "prayer_azan_user_01.mp3"
    if not mp3.is_file():
        print(
            "Missing prayer_azan_user_01.mp3 — copy your azan MP3 to:\n"
            f"  {mp3}\n",
            file=sys.stderr,
        )
        return 1
    write_attribution()
    print(f"OK: {mp3.name} ({mp3.stat().st_size:,} bytes)")
    print(f"MD5: {md5(mp3)}")
    print(f"Attribution: {ATTRIBUTION}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
