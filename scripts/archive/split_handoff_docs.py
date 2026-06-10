#!/usr/bin/env python3
"""Split docs/archive/PLATFORM_GPT_HANDOFF_2026-05.md into topic folders (phase 2–3)."""
from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "docs"
ARCHIVE = ROOT / "archive" / "PLATFORM_GPT_HANDOFF_2026-05.md"


def load_lines() -> list[str]:
    return ARCHIVE.read_text(encoding="utf-8").splitlines()


def extract(lines: list[str], start: str, end: str | None) -> str:
    start_i = next(i for i, line in enumerate(lines) if line.startswith(start))
    end_i = len(lines)
    if end:
        for i in range(start_i + 1, len(lines)):
            if lines[i].startswith(end):
                end_i = i
                break
    return "\n".join(lines[start_i:end_i]).strip()


def write(path: Path, title: str, body: str, back: str, phase: int) -> None:
    header = (
        f"# {title}\n\n"
        f"> Архивтен көшірілді (кезең {phase}). Толық снапшот: "
        f"[PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md) ({back}).\n\n"
        "---\n\n"
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(header + body + "\n", encoding="utf-8")


def phase2(lines: list[str]) -> None:
    mobile = [
        ("mobile/changelog/2026-04-20.md", "Mobile (2026-04-20)", "## 25.", "## 26.", "§25"),
        ("mobile/changelog/2026-05-09.md", "Mobile (2026-05-09)", "## 26.", "## 27.", "§26"),
        ("mobile/changelog/2026-05-11.md", "Mobile (2026-05-11)", None, None, "§30, §32"),
        ("mobile/changelog/2026-05-13-15.md", "Mobile / platform (2026-05-13 — 15)", "## 39.", "## 40.", "§39"),
    ]
    for rel, title, start, end, back in mobile:
        if rel.endswith("2026-05-11.md"):
            body = extract(lines, "## 30.", "## 32.") + "\n\n---\n\n" + extract(lines, "## 32.", "## 39.")
        else:
            body = extract(lines, start, end)
        write(ROOT / rel, title, body, back, 2)

    roadmap = [
        ("roadmap/tech-debt.md", "Техника қарызы және тәуекел", "## 27.", "## 28.", "## 40.", "## 41.", "§27, §40"),
        ("roadmap/mushaf-sprints.md", "Mushaf / Hatim — sprint жоспары", "## 28.", "## 30.", None, None, "§28–§29"),
        ("roadmap/feature-sliced-plan.md", "Mobile Feature-Sliced (жоспар)", "## 31.", "## 33.", None, None, "§31"),
        ("roadmap/phases-1-3.md", "Өнім фазалары 1–3", "## 33.", "## 36.", None, None, "§33–§35"),
        ("roadmap/technical-recommendations.md", "Техникалық ұсыныстар", "## 36.", "## 37.", None, None, "§36"),
        ("roadmap/mvp-2-weeks.md", "MVP — келесі 2 апта", "## 37.", "## 38.", None, None, "§37"),
        ("roadmap/vision-positioning.md", "RAQAT позициялау", "## 38.", "## 1.", None, None, "§38"),
    ]
    for item in roadmap:
        rel, title, s1, e1, s2, e2, back = item
        body = extract(lines, s1, e1)
        if s2:
            body += "\n\n---\n\n" + extract(lines, s2, e2)
        write(ROOT / rel, title, body, back, 2)

    write(ROOT / "operations/postgres-cutover.md", "PostgreSQL cutover тәуекелі", extract(lines, "## 27.", "## 28."), "§27", 2)

    body = extract(lines, "### 24.0 ", "### 24.0.1") + "\n\n---\n\n" + extract(lines, "### 24.0.1", "### 24.1")
    write(ROOT / "roadmap/phases-index.md", "Өнім жол картасы — индекс (фазалар)", body, "§24.0, §24.0.1", 2)

    write(ROOT / "product/vision.md", "Өнім ұстанымы және мақсат", extract(lines, "## 1.", "## 2."), "§1", 2)


def phase3(lines: list[str]) -> None:
    architecture = [
        ("architecture/overview.md", "Репозиторий құрылымы", "## 2.", "## 3.", "§2"),
        ("architecture/configuration.md", "Конфигурация (.env)", "## 4.", "## 5.", "§4"),
        ("architecture/web.md", "Веб (статикалық MVP)", "## 7.", "## 8.", "§7"),
        ("architecture/data-and-scripts.md", "Деректер мен скрипттер", "## 8.", "## 9.", "§8"),
        ("architecture/external-services.md", "Сыртқы сервистер", "## 9.", "## 10.", "§9"),
        ("architecture/security.md", "Қауіпсіздік", "## 10.", "## 11.", "§10"),
        ("architecture/app-layer.md", "platform_api/app қабаты", "## 16.", "## 17.", "§16"),
        ("architecture/scale-hardening.md", "Scale hardening", "## 17.", "## 18.", "§17"),
        ("architecture/data-and-auth.md", "SQLite, auth, миграциялар", "## 23.", "## 24.", "§23"),
    ]
    for rel, title, s, e, back in architecture:
        write(ROOT / rel, title, extract(lines, s, e), back, 3)

    platform = [
        ("platform_api/overview.md", "Platform API — endpoint карта", "## 5.", "## 6.", "§5"),
        ("platform_api/telegram-bot.md", "Telegram бот", "## 3.", "## 4.", "§3"),
        ("platform_api/integration.md", "Bot + Mobile = бір платформа", "## 19.", "## 20.", "§19"),
        ("platform_api/production-checklist.md", "Production checklist", "## 20.", "## 21.", "§20"),
        ("platform_api/ai-ecosystem.md", "Redis, Celery, AI cache, audit", "## 21.", "## 22.", "§21"),
        ("platform_api/hadith-translation-runbook.md", "Hadith KK translation runbook", "## 18.", "## 19.", "§18"),
    ]
    for rel, title, s, e, back in platform:
        write(ROOT / rel, title, extract(lines, s, e), back, 3)

    handoff = [
        ("handoff/gpt-tasks.md", "GPT тапсырма және FAQ", "## 12.", "## 14.", "§12–§13"),
        ("handoff/status-2026-04-14.md", "Статус-отчет (2026-04-14)", "## 14.", "## 15.", "§14"),
        ("handoff/execution-packages.md", "Орындау пакеті A/Ә/Б/В", "## 15.", "## 16.", "§15"),
        ("handoff/gpt-sre-summary.md", "GPT / SRE жинақтау нұсқауы", "## 22.", "## 23.", "§22"),
        ("handoff/topic-index.md", "Тақырып бойынша сілтеме картасы", "## 24.", "## 25.", "§24"),
    ]
    for rel, title, s, e, back in handoff:
        write(ROOT / rel, title, extract(lines, s, e), back, 3)

    write(ROOT / "operations/testing.md", "Тесттер", extract(lines, "## 11.", "## 12."), "§11", 3)
    write(
        ROOT / "mobile/handoff-api-client.md",
        "Мобильді — API клиент (тарихи §6)",
        extract(lines, "## 6.", "## 7."),
        "§6",
        3,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("phase", nargs="?", type=int, choices=(2, 3), help="Run phase 2 or 3 split only")
    args = parser.parse_args()
    lines = load_lines()

    if args.phase in (None, 2):
        phase2(lines)
        print("Phase 2: changelogs", len(list((ROOT / "mobile/changelog").glob("*.md"))))
    if args.phase in (None, 3):
        phase3(lines)
        print("Phase 3: architecture", len(list((ROOT / "architecture").glob("*.md"))))
        print("Phase 3: platform_api", len(list((ROOT / "platform_api").glob("*.md"))))
        print("Phase 3: handoff", len(list((ROOT / "handoff").glob("*.md"))))


if __name__ == "__main__":
    main()
