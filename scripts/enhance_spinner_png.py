# -*- coding: utf-8 -*-
"""Жүктелу оюы: контраст + анықтық, 512px (кішкентай көрсетуде тұйыр)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "mobile" / "assets" / "ornaments" / "raqat-loading-spinner.png"
TARGET = 512


def main() -> None:
    im = Image.open(OUT).convert("RGBA")
    r, g, b, a = im.split()
    rgb = Image.merge("RGB", (r, g, b))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.22)
    rgb = ImageEnhance.Color(rgb).enhance(1.12)
    rgb = ImageEnhance.Brightness(rgb).enhance(1.04)
    rgb = rgb.filter(ImageFilter.SHARPEN)
    rgb = rgb.filter(ImageFilter.SHARPEN)
    im = Image.merge("RGBA", (*rgb.split(), a))
    im = im.resize((TARGET, TARGET), Image.Resampling.LANCZOS)
    im.save(OUT, optimize=True)
    print(f"enhanced {OUT} -> {TARGET}x{TARGET}")


if __name__ == "__main__":
    main()
