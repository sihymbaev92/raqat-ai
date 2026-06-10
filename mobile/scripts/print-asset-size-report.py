#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Print the largest bundled mobile assets for release size review."""
from __future__ import annotations

import argparse
from pathlib import Path


def fmt(size: int) -> str:
    return f"{size / 1024 / 1024:.2f} MB"


def main() -> int:
    parser = argparse.ArgumentParser(description="Mobile asset size report")
    parser.add_argument("--limit", type=int, default=25)
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    asset_root = root / "assets"
    files: list[tuple[int, Path]] = []
    for path in asset_root.rglob("*"):
        if path.is_file():
            files.append((path.stat().st_size, path))

    total = sum(size for size, _ in files)
    print(f"Mobile assets total: {fmt(total)} ({len(files)} files)")
    print(f"Top {args.limit} assets:")
    for size, path in sorted(files, reverse=True)[: args.limit]:
        print(f"- {fmt(size)}  {path.relative_to(root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

