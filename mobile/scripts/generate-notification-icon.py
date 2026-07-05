#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RAHAT OMIR notification icon — status bar silhouette + large color emblem."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "brand" / "rahat-omir-notification-master.png"
NOTIF_OUT = ROOT / "assets" / "notification-icon.png"
NOTIF_SOURCE_OUT = ROOT / "assets" / "notification-icon-source.png"
ANDROID_DRAWABLE = ROOT / "android" / "app" / "src" / "main" / "res" / "drawable"
TRANSPARENT = (0, 0, 0, 0)


def remove_outer_background(src: Image.Image, *, tolerance: int = 44) -> Image.Image:
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


def crop_visible(src: Image.Image) -> Image.Image:
    im = src.convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        return im
    return im.crop(bbox)


def fit_emblem(src: Image.Image, size: int, *, pad_ratio: float = 0.08) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), TRANSPARENT)
    margin = int(size * pad_ratio)
    inner = size - 2 * margin
    im = crop_visible(src.copy())
    im.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    x = (size - im.width) // 2
    y = (size - im.height) // 2
    canvas.paste(im, (x, y), im)
    return canvas


def to_status_bar_silhouette(src: Image.Image) -> Image.Image:
    """Android status bar: ақ silhouette, alpha = emblem."""
    im = src.convert("RGBA")
    px = im.load()
    w, h = im.size
    out = Image.new("RGBA", (w, h), TRANSPARENT)
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            lum = r * 0.299 + g * 0.587 + b * 0.114
            if lum < 28 and a < 120:
                continue
            alpha = min(255, int(a * (0.35 + 0.65 * lum / 255.0)))
            opx[x, y] = (255, 255, 255, alpha)
    return out


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"source not found: {SRC}")
    emblem = remove_outer_background(Image.open(SRC).convert("RGBA"))
    emblem.save(NOTIF_SOURCE_OUT, "PNG", optimize=True)

    color_large = fit_emblem(emblem, 256, pad_ratio=0.06)
    silhouette = to_status_bar_silhouette(fit_emblem(emblem, 192, pad_ratio=0.1))
    expo_icon = fit_emblem(silhouette, 96, pad_ratio=0.06)
    android_small = fit_emblem(silhouette, 96, pad_ratio=0.06)

    ANDROID_DRAWABLE.mkdir(parents=True, exist_ok=True)
    expo_icon.save(NOTIF_OUT, "PNG", optimize=True)
    android_small.save(ANDROID_DRAWABLE / "notification_icon.png", "PNG", optimize=True)
    color_large.save(ANDROID_DRAWABLE / "notification_icon_large.png", "PNG", optimize=True)

    print(f"wrote {NOTIF_OUT}")
    print(f"wrote {NOTIF_SOURCE_OUT}")
    print(f"wrote {ANDROID_DRAWABLE / 'notification_icon.png'}")
    print(f"wrote {ANDROID_DRAWABLE / 'notification_icon_large.png'}")


if __name__ == "__main__":
    main()
