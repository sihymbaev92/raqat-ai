#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RAHAT OMIR логотипінен Expo icon.png және Android mipmap жасау."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "brand" / "rahat-omir-logo-master.png"
FAB_SRC = ROOT / "assets" / "brand" / "rahat-omir-fab-master.png"
ICON_OUT = ROOT / "assets" / "icon.png"
ADAPTIVE_OUT = ROOT / "assets" / "adaptive-icon.png"
FAVICON_OUT = ROOT / "assets" / "favicon.png"
SPLASH_OUT = ROOT / "assets" / "splash-icon.png"
BRAND_LOGO_OUT = ROOT / "assets" / "rahat-omir-logo.png"
FAB_LOGO_OUT = ROOT / "assets" / "rahat-omir-fab-logo.png"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"

TRANSPARENT = (0, 0, 0, 0)
ICON_BG = (247, 255, 254, 255)

DENSITIES: dict[str, tuple[int, int]] = {
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}

SPLASH_DRAWABLES: dict[str, int] = {
    "drawable-mdpi": 288,
    "drawable-hdpi": 432,
    "drawable-xhdpi": 576,
    "drawable-xxhdpi": 864,
    "drawable-xxxhdpi": 1152,
}


def remove_outer_background(src: Image.Image, *, tolerance: int = 44) -> Image.Image:
    """Сыртқы фонды (қара, қағаз, беж) edge flood-fill арқылы alpha=0 қылу."""
    from collections import deque

    im = src.copy().convert("RGBA")
    w, h = im.size
    corners = (
        im.getpixel((0, 0)),
        im.getpixel((w - 1, 0)),
        im.getpixel((0, h - 1)),
        im.getpixel((w - 1, h - 1)),
    )

    def matches_bg(r: int, g: int, b: int, a: int) -> bool:
        if a < 8:
            return True
        for cr, cg, cb, _ in corners:
            if abs(r - cr) <= tolerance and abs(g - cg) <= tolerance and abs(b - cb) <= tolerance:
                return True
        # Жеңіл қағаз/су белгісі
        if r > 198 and g > 188 and b > 168 and r - b < 48 and max(r, g, b) - min(r, g, b) < 36:
            return True
        return False

    px = im.load()
    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def try_push(x: int, y: int) -> None:
        idx = y * w + x
        if seen[idx]:
            return
        r, g, b, a = px[x, y]
        if not matches_bg(r, g, b, a):
            return
        seen[idx] = 1
        q.append((x, y))

    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        x, y = q.popleft()
        px[x, y] = TRANSPARENT
        if x > 0:
            try_push(x - 1, y)
        if x + 1 < w:
            try_push(x + 1, y)
        if y > 0:
            try_push(x, y - 1)
        if y + 1 < h:
            try_push(x, y + 1)

    return im


def remove_paper_background(src: Image.Image, *, tolerance: int = 44) -> Image.Image:
    """Кері үйлесімділік — remove_outer_background."""
    return remove_outer_background(src, tolerance=tolerance)


def fit_emblem(
    src: Image.Image,
    size: int,
    *,
    pad_ratio: float = 0.06,
    background: tuple[int, int, int, int] = TRANSPARENT,
) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), background)
    margin = int(size * pad_ratio)
    inner = size - 2 * margin
    im = crop_visible(src.copy())
    im.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    x = (size - im.width) // 2
    y = (size - im.height) // 2
    canvas.paste(im, (x, y), im)
    return canvas


def crop_visible(src: Image.Image) -> Image.Image:
    im = src.convert("RGBA")
    alpha = im.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return im
    return im.crop(bbox)


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"source not found: {SRC}")
    full = remove_outer_background(Image.open(SRC).convert("RGBA"))

    fit_emblem(full, 1024, pad_ratio=0.16, background=ICON_BG).save(ICON_OUT, "PNG", optimize=True)
    fit_emblem(full, 1024, pad_ratio=0.16, background=TRANSPARENT).save(SPLASH_OUT, "PNG", optimize=True)
    fit_emblem(full, 1024, pad_ratio=0.16, background=TRANSPARENT).save(BRAND_LOGO_OUT, "PNG", optimize=True)
    # Adaptive foreground is masked by launchers; keep the artwork inside the safe zone.
    fit_emblem(full, 1024, pad_ratio=0.26, background=TRANSPARENT).save(ADAPTIVE_OUT, "PNG", optimize=True)
    fit_emblem(full, 192, pad_ratio=0.16, background=ICON_BG).save(FAVICON_OUT, "PNG", optimize=True)
    print(f"wrote {ICON_OUT}")
    print(f"wrote {ADAPTIVE_OUT}")
    print(f"wrote {FAVICON_OUT}")
    print(f"wrote {SPLASH_OUT}")
    print(f"wrote {BRAND_LOGO_OUT}")

    if FAB_SRC.is_file():
        fab_full = remove_outer_background(Image.open(FAB_SRC).convert("RGBA"))
        fit_emblem(fab_full, 512, pad_ratio=0.14, background=TRANSPARENT).save(
            FAB_LOGO_OUT, "PNG", optimize=True
        )
        print(f"wrote {FAB_LOGO_OUT}")

    for folder, px in SPLASH_DRAWABLES.items():
        out_dir = ANDROID_RES / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        path = out_dir / "splashscreen_logo.png"
        fit_emblem(full, px, pad_ratio=0.16, background=TRANSPARENT).save(path, "PNG", optimize=True)
        print(f"  {folder}/splashscreen_logo.png: {px}px")

    for folder, (legacy_px, fg_px) in DENSITIES.items():
        out_dir = ANDROID_RES / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        legacy = fit_emblem(full, legacy_px, pad_ratio=0.14, background=ICON_BG)
        fg = fit_emblem(full, fg_px, pad_ratio=0.28, background=TRANSPARENT)
        for name, img in (
            ("ic_launcher.webp", legacy),
            ("ic_launcher_round.webp", legacy),
            ("ic_launcher_foreground.webp", fg),
        ):
            path = out_dir / name
            img.save(path, "WEBP", quality=92, method=6)
        print(f"  {folder}: {legacy_px}px / fg {fg_px}px")


if __name__ == "__main__":
    main()
