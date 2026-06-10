#!/usr/bin/env python3
"""Normalize archive banners in split docs (phase 5 polish)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "docs"
SKIP = {
    ROOT / "archive",
    ROOT / "handoff" / "topic-index.md",
}
BANNER = (
    "> Ағымдағы құжат. Архив снапшоты: "
    "[archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). "
    "§ картасы: [section-map.md](../handoff/section-map.md).\n\n"
)
# handoff/*.md and roadmap at docs/roadmap need different relative paths
BANNER_HANDOFF = BANNER.replace("../handoff/", "")
BANNER_ROADMAP = BANNER.replace("../handoff/", "../handoff/")
BANNER_OPS = BANNER.replace("../handoff/", "../handoff/")
BANNER_MOBILE = BANNER.replace("../handoff/", "../handoff/")

OLD = re.compile(
    r"> Архивтен көшірілді \(кезең \d+\)\. Толық снапшот: "
    r"\[PLATFORM_GPT_HANDOFF_2026-05\.md\]\([^)]+\) \(§[^)]+\)\.\n\n",
    re.MULTILINE,
)


def banner_for(path: Path) -> str:
    rel = path.relative_to(ROOT)
    if rel.parts[0] == "handoff":
        return (
            "> Ағымдағы құжат. Архив: "
            "[archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). "
            "§ картасы: [section-map.md](section-map.md).\n\n"
        )
    depth = len(rel.parts) - 1
    prefix = "../" * depth
    return (
        "> Ағымдағы құжат. Архив снапшоты: "
        f"[archive/PLATFORM_GPT_HANDOFF_2026-05.md]({prefix}archive/PLATFORM_GPT_HANDOFF_2026-05.md). "
        f"§ картасы: [section-map.md]({prefix}handoff/section-map.md).\n\n"
    )


def main() -> None:
    n = 0
    for path in sorted(ROOT.rglob("*.md")):
        if any(str(path).startswith(str(s)) for s in SKIP):
            continue
        if "archive" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        if not OLD.search(text):
            continue
        new_text = OLD.sub(banner_for(path), text, count=1)
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            n += 1
            print("updated", path.relative_to(ROOT))
    print(f"done: {n} files")


if __name__ == "__main__":
    main()
