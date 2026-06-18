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
    parser.add_argument(
        "--max-total-mb",
        type=float,
        default=None,
        help="Fail when total assets exceed this many MiB.",
    )
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
    if args.max_total_mb is not None:
        budget = int(args.max_total_mb * 1024 * 1024)
        if total > budget:
            print(f"ERROR: Mobile assets exceed budget {args.max_total_mb:.2f} MB.")
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

