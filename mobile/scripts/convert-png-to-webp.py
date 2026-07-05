#!/usr/bin/env python3
"""Convert selected PNG assets to WebP for smaller APK footprint."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

MOBILE = Path(__file__).resolve().parents[1]
QUALITY = 82


def convert_png(png: Path) -> tuple[Path, int, int]:
    webp = png.with_suffix(".webp")
    with Image.open(png) as img:
        rgb = img.convert("RGBA") if img.mode in ("RGBA", "LA", "P") else img.convert("RGB")
        rgb.save(webp, "WEBP", quality=QUALITY, method=6)
    return webp, png.stat().st_size, webp.stat().st_size


def main() -> int:
    rel_paths = [
        *sorted((MOBILE / "assets/dashboard/home-tiles").glob("*.png")),
        MOBILE / "assets/hajj/tile-hajj.png",
        MOBILE / "assets/hajj/kurban-ait-promo.png",
        MOBILE / "assets/hajj/kurban-ait-dashboard-hero.png",
        MOBILE / "assets/hajj/kurban-ait-guide-infographic.png",
    ]
    saved = 0
    for png in rel_paths:
        if not png.is_file():
            print(f"skip missing: {png.relative_to(MOBILE)}")
            continue
        webp, before, after = convert_png(png)
        png.unlink()
        delta = before - after
        saved += delta
        rel = png.relative_to(MOBILE)
        print(f"{rel} -> {webp.name}: {before/1024:.0f} KB -> {after/1024:.0f} KB")
    orphan = MOBILE / "assets/hajj/talbiyah-hero-bg.png"
    if orphan.is_file():
        sz = orphan.stat().st_size
        orphan.unlink()
        saved += sz
        print(f"deleted orphan {orphan.relative_to(MOBILE)}: {sz/1024:.0f} KB")
    print(f"total saved: {saved/1024/1024:.2f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
