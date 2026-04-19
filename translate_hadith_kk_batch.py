# -*- coding: utf-8 -*-
"""
Арабша хадис мәтінін қазақшаға толтыру (Gemini). Құран батчына ұқсас: қайта іске қосуға болады.

Қолдану:
  python translate_hadith_kk_batch.py --stats-only
  python translate_hadith_kk_batch.py --bukhari-muslim --limit 300 --sleep 4
  bash scripts/run_sahih_hadith_kk.sh --limit 500
  # толық сахих (мыңдаған сұрау, фонда):
  # nohup bash scripts/run_sahih_hadith_kk.sh >> hadith_kk.log 2>&1 &

  # Параллель (Gemini бірнеше процесс; DB жазу — негізгі процесте):
  # python translate_hadith_kk_batch.py --bukhari-muslim --workers 4 --limit 400 --sleep 1

Аудармадан кейін hadith_fts қолданылса, мазмұнды жаңарту үшін create_hadith_fts.py қайта орындаңыз.

Алдын ала толтырылған қазақшаны тексеру + түзету (Gemini JSON, шекті саны):
  python translate_hadith_kk_batch.py --bukhari-muslim --review-limit 300 --sleep 4
  (алдымен осы өтім, содан кейін бос text_kk аудармасы жалғасады.)

  Сапаға басымдық (бірінші аудармадан кейін JSON тексеру+түзету, API 2×):
  python translate_hadith_kk_batch.py --bukhari-muslim --limit 50 --sleep 4 --verify-each
  (--verify-each тек --workers 1 кезінде; глоссарий data/hadith_kk_glossary.md автоматты қосылады)

  Мета-мәтін / ағылшынша «ойлау» сіңген жолдарды қайта аудару (audit тізімі):
  python scripts/audit_hadith_kk_quality.py --db global_clean.db --write-ids data/hadith_kk_repair_ids.txt
  python translate_hadith_kk_batch.py --db global_clean.db --bukhari-muslim --force \\
    --ids-file data/hadith_kk_repair_ids.txt --sleep 6

Ескерту: `.env`-те `DATABASE_URL` (PostgreSQL) орнатылған болса, аударма **PostgreSQL hadith**
кестесіне жазылады; SQLite `--db` елемейді. API-пен бір дерек көзі сақталады.
"""
from __future__ import annotations

import argparse
import json
import logging
import multiprocessing as mp
import re
import shutil
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config.settings import AI_MODEL_CANDIDATES, DB_PATH, GEMINI_API_KEY
from db.dialect_sql import execute as sql_exec
from db.get_db import get_db_writer, is_postgresql_configured
from services.text_cleanup import clean_text_content

try:
    from google import genai
except ImportError:
    genai = None

ROOT_DIR = Path(__file__).resolve().parent

# genai_service / .env AI_MODEL_CANDIDATES-пен үйлесімді (eski gemini-1.5-flash API-да 404 береді)
MODEL_CANDIDATES = tuple(
    m.strip()
    for m in (
        AI_MODEL_CANDIDATES
        if AI_MODEL_CANDIDATES
        else ("gemini-2.5-flash", "gemini-2.5-flash-lite")
    )
    if m.strip()
)
TRANSIENT_MARKERS = (
    "503",
    "unavailable",
    "overloaded",
    "timeout",
    "temporarily",
    "rate limit",
    "resource exhausted",
    "name resolution",
    "temporary failure",
    "connection reset",
    "connection refused",
    "eof occurred",
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("hadith_translate")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Translate missing hadith rows from Arabic to Kazakh (text_kk), resume-friendly."
    )
    parser.add_argument("--db", default=DB_PATH, help="SQLite database path")
    parser.add_argument("--limit", type=int, default=0, help="Max rows to process (0 = no limit)")
    parser.add_argument("--from-id", type=int, default=0, help="Start from hadith.id")
    parser.add_argument("--to-id", type=int, default=0, help="End at hadith.id (inclusive, 0 = no upper bound)")
    parser.add_argument("--source", type=str, help="Only rows with this exact source value")
    parser.add_argument(
        "--sahih-only",
        action="store_true",
        help=(
            "Сахихқа жататын жолдар: grade немесе source ішінде 'sahih' "
            "(мысалы Sahih al-Bukhari, Sahih Muslim — grade бос болса да)"
        ),
    )
    parser.add_argument(
        "--bukhari-muslim",
        action="store_true",
        help="Тек 'Sahih al-Bukhari' және 'Sahih Muslim' жинақтары (кезек: алдымен Бұхари)",
    )
    parser.add_argument("--sleep", type=float, default=6.0, help="Delay after each successful request")
    parser.add_argument("--retry-delay", type=float, default=10.0, help="Base retry delay (seconds)")
    parser.add_argument("--max-retries", type=int, default=6, help="Retries per model")
    parser.add_argument("--max-errors", type=int, default=30, help="Stop after this many row errors")
    parser.add_argument("--backup", action="store_true", help="Create DB backup before writing")
    parser.add_argument("--force", action="store_true", help="Rewrite existing text_kk too")
    parser.add_argument("--dry-run", action="store_true", help="Do not write changes")
    parser.add_argument("--stats-only", action="store_true", help="Print stats and exit")
    parser.add_argument(
        "--review-limit",
        type=int,
        default=0,
        help=(
            "Осы сессияда: text_kk бар жолдарды арабпен салыстырып тексеру және "
            "қажет болса түзету (0 = өткізілмейді). updated_at бойынша жаңалары алдымен."
        ),
    )
    parser.add_argument(
        "--review-only",
        action="store_true",
        help="Тек тексеру+түзету өтімі (бос text_kk аудармасын іске қоспайды).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        metavar="N",
        help=(
            "Gemini шақыруларын N параллель spawn-процесте орындау (2–32). "
            "SQLite/PostgreSQL жазбасы негізгі процесте бір-бірден; бірнеше "
            "translate скриптін бір DB-ға қоспа. --max-errors параллель режимде "
            "тек соңында ескерту (ерте тоқтатпайды)."
        ),
    )
    parser.add_argument(
        "--ids-file",
        type=str,
        default="",
        help=(
            "Файл: бір жолда бір hadith.id (# тақырыптан кейін түсініктеме). "
            "Тек осы жолдар аударады; --force қажет (бар text_kk қайта жазылады). "
            "--from-id/--to-id/--limit осы режимде еленбейді."
        ),
    )
    parser.add_argument(
        "--verify-each",
        action="store_true",
        help=(
            "Әр жаңа аудармадан кейін арабпен салыстырып JSON тексеру өткізу (verify_and_fix_one). "
            "API шақыруы екі еселенеді. Тек --workers 1."
        ),
    )
    parser.add_argument(
        "--no-glossary",
        action="store_true",
        help="data/hadith_kk_glossary.md кестесін промптқа қоспау.",
    )
    return parser.parse_args()


def ensure_client():
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY табылмады")
    if genai is None:
        raise RuntimeError("google-genai орнатылмаған")
    return genai.Client(api_key=GEMINI_API_KEY)


def create_backup(path: str) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup = f"{path}.bak.{ts}"
    shutil.copy2(path, backup)
    return backup


def open_conn(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def stats(conn: Any) -> dict[str, int]:
    row = sql_exec(
        conn,
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN TRIM(COALESCE(text_ar, '')) <> '' THEN 1 ELSE 0 END) AS with_ar,
            SUM(
                CASE
                    WHEN TRIM(COALESCE(text_ar, '')) <> ''
                     AND TRIM(COALESCE(text_kk, '')) <> ''
                    THEN 1 ELSE 0 END
            ) AS filled_kk
        FROM hadith
        """,
        (),
    ).fetchone()
    total = int(row["total"] or 0)
    with_ar = int(row["with_ar"] or 0)
    filled = int(row["filled_kk"] or 0)
    missing = with_ar - filled
    return {"total": total, "with_ar": with_ar, "filled_kk": filled, "missing_kk": missing}


def _norm_for_compare(text: str) -> str:
    return " ".join((text or "").split())


_GLOSSARY_PROMPT_EXTRA: str | None = None


def _load_glossary_from_md() -> str:
    """data/hadith_kk_glossary.md кестесінен қысқа жолдар (промптқа)."""
    path = ROOT_DIR / "data" / "hadith_kk_glossary.md"
    if not path.is_file():
        return ""
    bullets: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line.startswith("|") or line.startswith("|---"):
            continue
        cells = [c.strip() for c in line.split("|")]
        cells = [c for c in cells if c]
        if len(cells) < 2:
            continue
        term, kk = cells[0], cells[1]
        low = term.lower()
        if low in ("термин / сөз тіркесі", "термин", "қазақша тұрақты жазылымы"):
            continue
        if term.startswith("---"):
            continue
        if kk.startswith("---"):
            continue
        note = cells[2] if len(cells) > 2 else ""
        extra = f" ({note})" if note and not note.startswith("---") else ""
        bullets.append(f"- {term} → {kk}{extra}")
        if len(bullets) >= 48:
            break
    if not bullets:
        return ""
    return (
        "PROJECT KAZAKH TERMINOLOGY (prefer these forms when the Arabic sense matches):\n"
        + "\n".join(bullets)
        + "\n\n"
    )


def get_glossary_prompt_extra(no_glossary: bool) -> str:
    """Глоссарийді бір рет оқып кэштейді."""
    global _GLOSSARY_PROMPT_EXTRA
    if no_glossary:
        return ""
    if _GLOSSARY_PROMPT_EXTRA is None:
        _GLOSSARY_PROMPT_EXTRA = _load_glossary_from_md()
    return _GLOSSARY_PROMPT_EXTRA or ""


def _read_ids_file(path_str: str) -> list[int]:
    path = Path(path_str)
    if not path.is_file():
        raise FileNotFoundError(f"ids-file табылмады: {path}")
    out: list[int] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        out.append(int(line))
    return out


def fetch_rows_for_review(conn: Any, args: argparse.Namespace) -> list[Any]:
    """Аудармасы бар жолдар: жақында жаңартылғандар алдымен (қайта тексеруді бөлу)."""
    where = [
        "text_ar IS NOT NULL",
        "TRIM(text_ar) <> ''",
        "text_kk IS NOT NULL",
        "TRIM(text_kk) <> ''",
    ]
    params: list = []
    if args.from_id:
        where.append("id >= ?")
        params.append(args.from_id)
    if args.to_id:
        where.append("id <= ?")
        params.append(args.to_id)
    if args.source:
        where.append("source = ?")
        params.append(args.source)
    if args.bukhari_muslim:
        where.append("source IN ('Sahih al-Bukhari', 'Sahih Muslim')")
    elif args.sahih_only:
        where.append(
            "("
            "lower(COALESCE(grade, '')) LIKE '%sahih%' "
            "OR lower(COALESCE(source, '')) LIKE '%sahih%'"
            ")"
        )

    order_by = "updated_at DESC NULLS LAST, id DESC"
    limit_clause = " LIMIT ?"
    params.append(int(args.review_limit))

    query = f"""
        SELECT id, source, grade, text_ar, text_kk
        FROM hadith
        WHERE {' AND '.join(where)}
        ORDER BY {order_by}
        {limit_clause}
    """
    return sql_exec(conn, query, tuple(params)).fetchall()


def extract_review_json(raw: str) -> dict[str, Any] | None:
    """Модель жауабынан JSON объектісін шығару (kazakh_fixed ішіндегі } қателеспеу үшін raw_decode)."""
    text = (raw or "").strip()
    if not text:
        return None
    fence = re.search(r"```(?:json)?\s*(\{)", text, re.IGNORECASE)
    if fence:
        text = text[fence.start(1) :]
    else:
        i = text.find("{")
        if i == -1:
            return None
        text = text[i:]
    dec = json.JSONDecoder()
    try:
        obj, _end = dec.raw_decode(text)
    except json.JSONDecodeError:
        return None
    return obj if isinstance(obj, dict) else None


def build_review_prompt(source: str | None, grade: str | None, text_ar: str, text_kk: str) -> str:
    ar = " ".join((text_ar or "").replace("\ufeff", "").split())
    kk = (text_kk or "").strip()
    meta = []
    if source:
        meta.append(f"Жинақ: {source}")
    if grade:
        meta.append(f"Дәреже: {grade}")
    meta_block = ("\n".join(meta) + "\n") if meta else ""
    return (
        "Сен ислам хадисінің сарапшысысың. Төменде араб түпнұсқасы мен қазақша аударма берілген.\n"
        "Міндет: қазақша мағына арабпен сәйкес пе, түсінікті ме, толық па (үзілмеген бе) — бағала.\n"
        "Егер дұрыс болса satisfactory=true; қате/түсініксіз/үзік болса satisfactory=false "
        "және kazakh_fixed ішінде ТОЛЫҚ түзетілген қазақша бер (арабты қайталама).\n"
        "Егер satisfactory=true болса, kazakh_fixed ретінде ағымдағы қазақшаны дәл қайталап бер "
        "(өзгерту жоқ дегенді білдіреді).\n\n"
        "Жауапты ТЕК бір JSON объектісі түрінде бер — басқа сөз, түсініктеме, markdown қоспа:\n"
        '{"satisfactory": true|false, "brief_reason": "қысқа қазақша", "kazakh_fixed": "..."}\n\n'
        "Ескерту: kazakh_fixed ішінде тек қазақ кириллицасы; ағылшынша, латын немесе «ойлау» мәтіні болмауы керек.\n\n"
        f"{meta_block}"
        f"Арабша:\n{ar}\n\nҚазақша аударма:\n{kk}"
    )


def verify_and_fix_one(client, row: Any, args: argparse.Namespace) -> tuple[str, str | None, str]:
    """
    Қайтару: (status, new_kk_немесе_None, brief)
    status — 'ok' (тек timestamp), 'fixed' (жаңа мәтін), 'fail' (жазба жоқ).
    """
    prompt = build_review_prompt(row["source"], row["grade"], row["text_ar"], row["text_kk"])
    last_error: Exception | str | None = None
    max_out = min(
        8192,
        max(
            4096,
            len(row["text_ar"] or "") + len(row["text_kk"] or "") * 2 + 1200,
        ),
    )

    for model_name in MODEL_CANDIDATES:
        for attempt in range(args.max_retries + 1):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        "temperature": 0.0,
                        "max_output_tokens": max_out,
                    },
                )
                raw = getattr(response, "text", "") or ""
                data = extract_review_json(raw)
                if not data:
                    last_error = "json_parse"
                    if attempt < args.max_retries:
                        time.sleep(args.retry_delay * (attempt + 1))
                    continue
                brief = str(data.get("brief_reason") or "")[:300]
                ok = bool(data.get("satisfactory"))
                fixed = clean_translation((data.get("kazakh_fixed") or "").strip())
                current = clean_translation(row["text_kk"] or "")
                if not fixed:
                    last_error = "empty_kazakh_fixed"
                    if attempt < args.max_retries:
                        time.sleep(args.retry_delay * (attempt + 1))
                    continue
                if ok and _norm_for_compare(fixed) == _norm_for_compare(current):
                    return "ok", None, brief
                if ok:
                    return "fixed", fixed, brief
                return "fixed", fixed, brief
            except Exception as exc:
                last_error = exc
                if is_daily_quota_exhausted(exc):
                    raise RuntimeError(f"Gemini күнделікті квотасы таусылды: {exc}") from exc
                logger.warning(
                    "Review failed id=%s model=%s attempt=%s error=%s",
                    row["id"],
                    model_name,
                    attempt + 1,
                    exc,
                )
                if not is_transient_error(exc):
                    break
                if attempt < args.max_retries:
                    time.sleep(args.retry_delay * (attempt + 1))

    return "fail", None, str(last_error or "review_failed")[:200]


def _apply_verify_if_needed(
    client: Any,
    row: Any,
    translated: str,
    args: argparse.Namespace,
) -> str:
    """--verify-each: жаңа аударманы арабпен салыстырып JSON арқылы түзету."""
    if not getattr(args, "verify_each", False):
        return translated
    rd = _row_as_dict(row)
    rd["text_kk"] = translated
    status, new_text, brief = verify_and_fix_one(client, rd, args)
    if status == "fail":
        logger.warning("Verify failed id=%s brief=%s (жоба аудармасы сақталды)", row["id"], brief)
        return translated
    if status == "fixed" and new_text:
        logger.info("Verify fixed id=%s %s", row["id"], (brief or "")[:120])
        return new_text
    return translated


def bump_row_timestamp(conn: Any, row_id: int) -> None:
    sql_exec(
        conn,
        "UPDATE hadith SET updated_at = datetime('now') WHERE id = ?",
        (row_id,),
    )
    conn.commit()


def _run_review_pass(conn: Any, client: Any, args: argparse.Namespace) -> None:
    if not args.review_limit or args.review_limit <= 0:
        return
    rows = fetch_rows_for_review(conn, args)
    logger.info("Review pass: rows=%s limit=%s", len(rows), args.review_limit)
    fixed_n = 0
    ok_n = 0
    fail_n = 0
    for row in rows:
        logger.info(
            "Review id=%s source=%s",
            row["id"],
            (row["source"] or "")[:60],
        )
        try:
            status, new_text, brief = verify_and_fix_one(client, row, args)
            if status == "fail":
                fail_n += 1
                logger.warning("Review skip id=%s reason=%s", row["id"], brief)
                if args.sleep:
                    time.sleep(args.sleep)
                continue
            if status == "ok":
                if not args.dry_run:
                    bump_row_timestamp(conn, row["id"])
                ok_n += 1
                logger.info("Review OK id=%s %s", row["id"], brief[:120])
            elif status == "fixed" and new_text:
                if not args.dry_run:
                    save_translation(conn, row["id"], new_text)
                fixed_n += 1
                logger.info("Review FIXED id=%s %s", row["id"], brief[:120])
            if args.sleep:
                time.sleep(args.sleep)
        except Exception as exc:
            logger.error("Review row error id=%s: %s", row["id"], exc)
            fail_n += 1
            if args.sleep:
                time.sleep(args.sleep)
    logger.info(
        "Review pass done: ok=%s fixed=%s fail=%s dry_run=%s",
        ok_n,
        fixed_n,
        fail_n,
        args.dry_run,
    )


def fetch_rows(conn: Any, args) -> list[Any]:
    where = ["text_ar IS NOT NULL", "TRIM(text_ar) <> ''"]
    params: list = []

    ids_file = (getattr(args, "ids_file", "") or "").strip()
    if ids_file:
        id_list = _read_ids_file(ids_file)
        if not id_list:
            return []
        ph = ",".join("?" * len(id_list))
        where.append(f"id IN ({ph})")
        params.extend(id_list)
    else:
        if not args.force:
            where.append("(text_kk IS NULL OR TRIM(text_kk) = '')")
        if args.from_id:
            where.append("id >= ?")
            params.append(args.from_id)
        if args.to_id:
            where.append("id <= ?")
            params.append(args.to_id)
        if args.source:
            where.append("source = ?")
            params.append(args.source)
        if args.bukhari_muslim:
            where.append("source IN ('Sahih al-Bukhari', 'Sahih Muslim')")
        elif args.sahih_only:
            where.append(
                "("
                "lower(COALESCE(grade, '')) LIKE '%sahih%' "
                "OR lower(COALESCE(source, '')) LIKE '%sahih%'"
                ")"
            )

    order_by = "id"
    if args.bukhari_muslim:
        order_by = (
            "CASE source WHEN 'Sahih al-Bukhari' THEN 0 "
            "WHEN 'Sahih Muslim' THEN 1 ELSE 2 END, id"
        )

    limit_clause = ""
    if args.limit and not ids_file:
        limit_clause = " LIMIT ?"
        params.append(args.limit)

    query = f"""
        SELECT id, source, grade, text_ar, text_kk
        FROM hadith
        WHERE {' AND '.join(where)}
        ORDER BY {order_by}
        {limit_clause}
    """
    return sql_exec(conn, query, tuple(params)).fetchall()


def is_transient_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return any(marker in text for marker in TRANSIENT_MARKERS)


def is_daily_quota_exhausted(exc: Exception) -> bool:
    """Күнделікті generate_requests_per_day шегіне жеткенде қайта сұраудың мәні жоқ."""
    text = str(exc).lower()
    return "generate_requests_per_day" in text or (
        "quota exceeded" in text and "per day" in text
    )


def build_prompt(
    source: str | None, grade: str | None, text_ar: str, *, no_glossary: bool = False
) -> str:
    """Негізгі аударма промпты — мағынаны сақтауға басымдық."""
    compact = " ".join((text_ar or "").replace("\ufeff", "").split())
    meta_lines: list[str] = []
    if source:
        meta_lines.append(f"Source collection: {source}")
    if grade:
        meta_lines.append(f"Hadith grade: {grade}")
    meta_block = ("\n".join(meta_lines) + "\n\n") if meta_lines else ""
    glossary_block = get_glossary_prompt_extra(no_glossary)

    # Негізгі prompt — модельге ағылшынша нұсқа (шығыс тек қазақша)
    return (
        "You are a professional Islamic translator specializing in hadith.\n\n"
        "TASK:\n"
        "Translate the Arabic hadith below into Kazakh (Cyrillic) only.\n\n"
        "STRICT RULES (faithfulness over fluency if they conflict):\n"
        "- Preserve the exact meaning of the Arabic. Do NOT change, add, or remove doctrinal content.\n"
        "- Translate every clause; do not omit names, numbers, negations, or conditional phrases.\n"
        "- Do NOT add tafsir, fiqh rulings, or background not present in the Arabic.\n"
        "- Do NOT remove important words for brevity.\n"
        "- Keep Islamic terminology correct and consistent with the glossary blocks below.\n"
        "- Use natural, clear Kazakh, but never paraphrase in a way that loses precision.\n"
        "- Keep narrative order, questions/answers, and cause-effect relations.\n"
        "- Give one complete translation (no truncation).\n"
        "- Output MUST use only Kazakh Cyrillic script (and Arabic numerals if needed). No Latin letters.\n"
        "- Do NOT output English, Turkish, transliteration, or meta-commentary.\n"
        "- Do NOT describe your process, rules, or reasoning — output ONLY the translation text.\n\n"
        "ISLAMIC TERMINOLOGY (must follow exactly in Kazakh when the Arabic uses these senses):\n"
        "sabr = сабыр\n"
        "rizq = ризық\n"
        "taqwa = тақуалық\n"
        "dua = дұға\n"
        "salah = намаз\n"
        "zakat = зекет\n"
        "hajj = қажылық\n"
        "tawbah = тәубе\n"
        "iman = иман\n\n"
        f"{glossary_block}"
        "OUTPUT:\n"
        "- Only the final Kazakh translation\n"
        "- No labels like 'Translation:'\n"
        "- No preamble or postscript\n\n"
        f"{meta_block}"
        "TEXT (Arabic hadith):\n"
        f"{compact}"
    )


def clean_translation(text: str) -> str:
    cleaned = (text or "").replace("\ufeff", "").strip()
    cleaned = cleaned.strip("*").strip()
    prefixes = (
        "қазақша аудармасы:",
        "аудармасы:",
        "мағынасы:",
        "translation:",
    )
    lower = cleaned.lower()
    for prefix in prefixes:
        if lower.startswith(prefix):
            cleaned = cleaned[len(prefix) :].strip()
            lower = cleaned.lower()
    cleaned = re.sub(r"^\s*\d+\s*[:.)-]\s*", "", cleaned)
    # жолдарды бір-беткей бостыққа сығу орнына сөйлем аралық сақтау (түсініктілік)
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
    if len(lines) > 1:
        cleaned = "\n".join(lines)
    else:
        cleaned = lines[0] if lines else ""
    cleaned = clean_text_content(cleaned)
    return cleaned


def _max_output_tokens_for_arabic(text_ar: str) -> int:
    """Араб мәтіні ұзын болса шығыс шегін ұлғайту — ортасынан үзілген аударманы азайту."""
    n = len((text_ar or "").strip())
    return int(min(8192, max(2048, n * 3 + 800)))


def translate_one(client, row, args) -> tuple[str, str]:
    prompt = build_prompt(
        row["source"],
        row["grade"],
        row["text_ar"],
        no_glossary=bool(getattr(args, "no_glossary", False)),
    )
    last_error = None

    for model_name in MODEL_CANDIDATES:
        for attempt in range(args.max_retries + 1):
            try:
                max_out = _max_output_tokens_for_arabic(row["text_ar"] or "")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        "temperature": 0.0,
                        "max_output_tokens": max_out,
                    },
                )
                text = clean_translation(getattr(response, "text", "") or "")
                if text:
                    return model_name, text
                last_error = RuntimeError("Бос жауап алынды")
            except Exception as exc:
                last_error = exc
                if is_daily_quota_exhausted(exc):
                    raise RuntimeError(f"Gemini күнделікті квотасы таусылды: {exc}") from exc
                logger.warning(
                    "Translate failed id=%s model=%s attempt=%s error=%s",
                    row["id"],
                    model_name,
                    attempt + 1,
                    exc,
                )
                if not is_transient_error(exc):
                    break

            if attempt < args.max_retries:
                time.sleep(args.retry_delay * (attempt + 1))

    raise RuntimeError(f"Translation failed for id={row['id']}: {last_error}")


def _row_as_dict(row: Any) -> dict[str, Any]:
    if isinstance(row, dict):
        return dict(row)
    return {str(k): row[k] for k in row.keys()}


def _worker_args_dict(args: argparse.Namespace) -> dict[str, Any]:
    """Spawn-процесте argparse.Namespace қайта құру үшін (pickle)."""
    return {
        "sleep": float(args.sleep),
        "retry_delay": float(args.retry_delay),
        "max_retries": int(args.max_retries),
        "no_glossary": bool(getattr(args, "no_glossary", False)),
    }


def split_into_n_chunks(items: list[Any], n: int) -> list[list[Any]]:
    """items тізімін шамамен тең n бөлікке бөледі."""
    if not items:
        return []
    n = max(1, min(int(n), len(items)))
    q, r = divmod(len(items), n)
    chunks: list[list[Any]] = []
    start = 0
    for i in range(n):
        sz = q + (1 if i < r else 0)
        end = start + sz
        piece = items[start:end]
        if piece:
            chunks.append(piece)
        start = end
    return chunks


def _mp_translate_chunk(
    rows_chunk: list[dict[str, Any]],
    wa: dict[str, Any],
) -> list[tuple[int, str | None, str]]:
    """Spawn-процесс: тек Gemini (дерекқор жоқ). Қайтару: (id, text_kk|None, error)."""
    worker_args = argparse.Namespace(**wa)
    client = ensure_client()
    out: list[tuple[int, str | None, str]] = []
    for rd in rows_chunk:
        try:
            _, text = translate_one(client, rd, worker_args)
            out.append((int(rd["id"]), text, ""))
        except Exception as exc:
            out.append((int(rd["id"]), None, str(exc)[:500]))
        if worker_args.sleep:
            time.sleep(float(worker_args.sleep))
    return out


def save_translation(conn: Any, row_id: int, text_kk: str) -> None:
    sql_exec(
        conn,
        "UPDATE hadith SET text_kk = ?, updated_at = datetime('now') WHERE id = ?",
        (text_kk, row_id),
    )
    conn.commit()


def _run_batch(conn: Any, args: argparse.Namespace) -> None:
    before = stats(conn)
    logger.info(
        "Hadith KK stats: total=%s with_ar=%s filled_kk=%s missing_kk=%s",
        before["total"],
        before["with_ar"],
        before["filled_kk"],
        before["missing_kk"],
    )
    if args.stats_only:
        return

    if (getattr(args, "ids_file", "") or "").strip() and not args.force:
        logger.error("--ids-file үшін --force міндетті (бар text_kk қайта жазылады).")
        return

    client = ensure_client()
    _run_review_pass(conn, client, args)
    if args.review_only:
        logger.info("review-only: аударма циклі өткізілмейді")
        return

    if args.backup and not args.dry_run and not is_postgresql_configured():
        backup = create_backup(args.db)
        logger.info("DB backup created: %s", backup)
    elif args.backup and not args.dry_run:
        logger.warning("--backup тек SQLite үшін; PostgreSQL режимінде елемейміз.")

    rows = fetch_rows(conn, args)
    logger.info(
        "Selected rows to process: %s (force=%s)",
        len(rows),
        args.force,
    )

    errors = 0
    done = 0

    workers = max(1, int(getattr(args, "workers", 1) or 1))
    if workers > 1 and len(rows) > 1:
        n_proc = max(2, min(workers, len(rows), 32))
        row_dicts = [_row_as_dict(r) for r in rows]
        chunks = split_into_n_chunks(row_dicts, n_proc)
        wa = _worker_args_dict(args)
        payloads = [(c, wa) for c in chunks]
        logger.info(
            "Parallel translate: spawn processes=%s chunks=%s (Gemini only; DB writes in main)",
            len(chunks),
            len(chunks),
        )
        ctx = mp.get_context("spawn")
        with ctx.Pool(processes=len(chunks)) as pool:
            nested = pool.starmap(_mp_translate_chunk, payloads)
        for triples in nested:
            for row_id, text, err in triples:
                if text:
                    try:
                        if not args.dry_run:
                            save_translation(conn, row_id, text)
                        done += 1
                        logger.info(
                            "Translated id=%s -> %s",
                            row_id,
                            (text or "")[:100],
                        )
                    except Exception as exc:
                        errors += 1
                        logger.error("Save failed id=%s: %s", row_id, exc)
                elif err:
                    errors += 1
                    logger.error("Row failed id=%s err=%s", row_id, err[:200])
        if errors >= args.max_errors:
            logger.error(
                "Parallel session: total_errors=%s (>= max_errors=%s). "
                "Sleep арттырыңыз немесе workers азайтыңыз.",
                errors,
                args.max_errors,
            )
    else:
        if workers > 1 and len(rows) <= 1:
            logger.info("--workers>1 бірақ жол аз: бір процесті режим")
        for row in rows:
            logger.info(
                "Processing id=%s source=%s",
                row["id"],
                (row["source"] or "")[:60],
            )
            try:
                model_name, translated = translate_one(client, row, args)
                final_kk = _apply_verify_if_needed(client, row, translated, args)
                logger.info(
                    "Translated id=%s with %s -> %s",
                    row["id"],
                    model_name,
                    final_kk[:100],
                )
                if not args.dry_run:
                    save_translation(conn, row["id"], final_kk)
                done += 1
                if args.sleep:
                    time.sleep(args.sleep)
            except Exception as exc:
                if is_daily_quota_exhausted(exc) or "күнделікті квотасы таусылды" in str(exc):
                    logger.error(
                        "Күнделікті API квотасы таусылды; ертең қайта іске қосыңыз немесе "
                        "Google AI жоспарын тексеріңіз: %s",
                        exc,
                    )
                    break
                errors += 1
                logger.error("Row failed id=%s error=%s", row["id"], exc)
                if errors >= args.max_errors:
                    logger.error("Stopping after max_errors=%s", args.max_errors)
                    break

    after = stats(conn)
    logger.info(
        "Finished: translated_now=%s errors=%s filled_kk=%s missing_kk=%s",
        done,
        errors,
        after["filled_kk"],
        after["missing_kk"],
    )
    if done and not args.dry_run:
        logger.info("Егер hadith_fts қолданылса, индексті жаңарту: python create_hadith_fts.py")


def main():
    args = parse_args()
    if args.verify_each and max(1, int(args.workers or 1)) > 1:
        raise SystemExit("--verify-each тек --workers 1 үшін (әр жолға қосымша API шақыру)")
    if args.review_only and (not args.review_limit or args.review_limit <= 0):
        raise SystemExit("--review-only үшін --review-limit мәні 1 немесе одан үлкен болуы керек")
    if is_postgresql_configured():
        logger.info("Hadith translation writes to PostgreSQL (DATABASE_URL).")
        with get_db_writer() as conn:
            _run_batch(conn, args)
        return

    conn = open_conn(args.db)
    try:
        _run_batch(conn, args)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
