# -*- coding: utf-8 -*-
"""raqat-loading-spinner.png — шахматка/сұр фонды мөлдір alpha-ға айналдыру."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "mobile" / "assets" / "ornaments" / "raqat-loading-spinner.png"
SRC = OUT


def _is_bg_pixel(r: int, g: int, b: int) -> bool:
    if max(abs(r - g), abs(r - b), abs(g - b)) >= 30:
        return False
    # Алтын ою: сары-қоңыр, R басым
    if r > 125 and g > 88 and b < 118 and (r - b) > 32:
        return False
    return True


def _flood_background_mask(rgb: Image.Image) -> list[bool]:
    w, h = rgb.size
    px = rgb.load()
    bg = [[False] * w for _ in range(h)]

    def seed(x: int, y: int) -> None:
        if bg[y][x]:
            return
        r, g, b = px[x, y]
        if not _is_bg_pixel(r, g, b):
            return
        q: deque[tuple[int, int]] = deque([(x, y)])
        bg[y][x] = True
        while q:
            cx, cy = q.popleft()
            for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                if nx < 0 or ny < 0 or nx >= w or ny >= h or bg[ny][nx]:
                    continue
                pr, pg, pb = px[nx, ny]
                if _is_bg_pixel(pr, pg, pb):
                    bg[ny][nx] = True
                    q.append((nx, ny))

    for sx, sy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        seed(sx, sy)
    return [bg[y][x] for y in range(h) for x in range(w)]


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    mask = _flood_background_mask(src)
    rgba = Image.new("RGBA", src.size)
    spx = rgba.load()
    ipx = src.load()
    w, h = src.size
    for y in range(h):
        for x in range(w):
            i = y * w + x
            r, g, b = ipx[x, y]
            if mask[i] or _is_bg_pixel(r, g, b):
                spx[x, y] = (0, 0, 0, 0)
            else:
                spx[x, y] = (r, g, b, 255)
    rgba.save(OUT, optimize=True)
    trans = sum(mask)
    print(f"saved {OUT} transparent={trans}/{w*h} ({100*trans/(w*h):.1f}%)")


if __name__ == "__main__":
    main()
