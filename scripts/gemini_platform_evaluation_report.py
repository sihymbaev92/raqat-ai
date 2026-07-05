#!/usr/bin/env python3
"""Gemini-ге платформа бағалау пакетін жіберіп, есеп файлын жазу."""
from __future__ import annotations

import argparse
import os
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
DEFAULT_BASE = DOCS / "GEMINI_PLATFORM_EVALUATION_FULL.md"
DEFAULT_DELTA = DOCS / "GEMINI_DELTA_2026-06-18.md"


def load_env() -> None:
    env = ROOT / ".env"
    if not env.is_file():
        return
    try:
        from dotenv import load_dotenv

        load_dotenv(env)
    except ImportError:
        for line in env.read_text(encoding="utf-8", errors="ignore").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def read(path: Path) -> str:
    if not path.is_file():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def build_prompt(base_doc: str, delta_doc: str) -> str:
    return f"""Сен RAQAT / RAHAT OMIR исламдық платформасын бағалайтын сарапшысың.

## Негізгі контекст (толық бағалау пакеті)
{base_doc}

---

## Соңғы delta (2026-06-18 — міндетті түрде ескер)
{delta_doc}

---

## Тапсырма
Жоғарыдағы delta-ны негізгі пакетпен салыстырып, **жаңартылған** бағалау бер.

Ережелер:
- §1.1 «Minус емес» және P2 scope тармақтарын Weaknesses-ке қоспа.
- 12 dashboard тайл санын азайту ұсынысын Weakness ретінде есептеме.
- Нақты release blocker-лер мен тәуекелдерге назар аудар.
- Жауап **қазақша**.

Формат (markdown):
# RAQAT Gemini бағалау есебі — {{күн}}
## Executive summary (5–10 bullet)
## Strengths
## Weaknesses (нақты минустар ғана)
## Risks
## Prioritized recommendations (P0 / P1 / P2 кесте)
## Release verdict (Go / No-Go / Go with conditions) + неге
## Келесі 5 қадам (иесі, estimate S/M/L)
"""


def call_gemini(prompt: str, model: str) -> str:
    key = (os.getenv("GEMINI_API_KEY") or os.getenv("RAQAT_GEMINI_API_KEY") or "").strip()
    if not key:
        raise RuntimeError("GEMINI_API_KEY жоқ (.env тексеріңіз)")

    from google import genai

    client = genai.Client(api_key=key)
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config={"max_output_tokens": 8192, "temperature": 0.3},
    )
    text = (getattr(response, "text", None) or "").strip()
    if not text:
        raise RuntimeError("Gemini бос жауап қайтарды")
    return text


def main() -> int:
    parser = argparse.ArgumentParser(description="Gemini platform evaluation report")
    parser.add_argument("--base", type=Path, default=DEFAULT_BASE)
    parser.add_argument("--delta", type=Path, default=DEFAULT_DELTA)
    parser.add_argument("--model", default="gemini-2.5-flash")
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    load_env()
    today = date.today().isoformat()
    out = args.out or (DOCS / f"GEMINI_EVALUATION_REPORT_{today}.md")

    base_doc = read(args.base)
    delta_doc = read(args.delta)
    prompt = build_prompt(base_doc, delta_doc)

    print(f"Gemini model: {args.model}")
    print(f"Base: {args.base} ({len(base_doc)} chars)")
    print(f"Delta: {args.delta} ({len(delta_doc)} chars)")
    print("Calling Gemini...")

    report_body = call_gemini(prompt, args.model)
    header = (
        f"# RAQAT Gemini бағалау есебі\n\n"
        f"**Күні:** {today}  \n"
        f"**Модель:** {args.model}  \n"
        f"**Кіріс:** `{args.base.name}` + `{args.delta.name}`  \n"
        f"**Генерация:** `scripts/gemini_platform_evaluation_report.py`\n\n"
        f"---\n\n"
    )
    out.write_text(header + report_body + "\n", encoding="utf-8")
    print(f"OK: {out}")
    print(f"Size: {out.stat().st_size} bytes")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
