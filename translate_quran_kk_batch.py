# -*- coding: utf-8 -*-
"""
Назар: бұл скрипт Gemini арқылы мағына жасайды — діни мәтін үшін күман тудыруы мүмкін.
Негізгі қолдану: тек техникалық тест немесе бос орындарды толтыру. Тексерілген баспа аудармасын
(мысалы Ерлан Алимулы нұсқасы) `scripts/import_quran_kk_verified.py` арқылы импорттаңыз.

114 сүрені бір стильге «туралау» үшін алдымен баспа/тексерілген JSON ұсынылады; Gemini арқылы
қайта жазу тек үлгі (1-сүре) бойынша стильді жақындату үшін пайдаланылса, соңында адам
қарауы міндетті.
"""
import argparse
import logging
import re
import shutil
import sqlite3
import time
from datetime import datetime, timezone

from config.settings import AI_MODEL_CANDIDATES, DB_PATH, GEMINI_API_KEY

try:
    from google import genai
except ImportError:
    genai = None

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
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("quran_translate")


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Translate Quran ayahs to Kazakh (clear, full-sentence style). "
            "Missing rows by default; use --force to refresh existing text_kk with the current prompt."
        )
    )
    parser.add_argument("--db", default=DB_PATH, help="SQLite database path")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of ayahs to process")
    parser.add_argument("--from-id", type=int, default=0, help="Start from this quran.id")
    parser.add_argument("--surah", type=int, help="Only process one surah")
    parser.add_argument("--sleep", type=float, default=8.0, help="Delay between successful requests")
    parser.add_argument("--retry-delay", type=float, default=10.0, help="Base retry delay in seconds")
    parser.add_argument("--max-retries", type=int, default=6, help="Retries per model")
    parser.add_argument("--max-errors", type=int, default=20, help="Stop after this many row errors")
    parser.add_argument("--backup", action="store_true", help="Create a DB backup before writing")
    parser.add_argument("--force", action="store_true", help="Rewrite existing text_kk too")
    parser.add_argument("--dry-run", action="store_true", help="Do not write changes")
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


def stats(conn: sqlite3.Connection) -> dict[str, int]:
    row = conn.execute(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN TRIM(COALESCE(text_kk, '')) <> '' THEN 1 ELSE 0 END) AS filled
        FROM quran
        """
    ).fetchone()
    total = row["total"] or 0
    filled = row["filled"] or 0
    return {"total": total, "filled": filled, "missing": total - filled}


def fetch_rows(conn: sqlite3.Connection, args) -> list[sqlite3.Row]:
    where = ["text_ar IS NOT NULL", "TRIM(text_ar) <> ''"]
    params = []

    if not args.force:
        where.append("(text_kk IS NULL OR TRIM(text_kk) = '')")
    if args.from_id:
        where.append("id >= ?")
        params.append(args.from_id)
    if args.surah:
        where.append("surah = ?")
        params.append(args.surah)

    limit_clause = ""
    if args.limit:
        limit_clause = " LIMIT ?"
        params.append(args.limit)

    query = f"""
        SELECT id, surah, ayah, text_ar, text_kk
        FROM quran
        WHERE {' AND '.join(where)}
        ORDER BY id
        {limit_clause}
    """
    return conn.execute(query, params).fetchall()


def is_transient_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return any(marker in text for marker in TRANSIENT_MARKERS)


def is_daily_quota_exhausted(exc: Exception) -> bool:
    text = str(exc).lower()
    return "generate_requests_per_day" in text or (
        "quota exceeded" in text and "per day" in text
    )


# 1-сүре — дерекқордағы қазақша стильдің эталоны (барлық сүрелерді осыған жақындату).
FATIHA_KK_STYLE_EXAMPLES = (
    "1. Аса қамқор, ерекше мейірімді Алланың атымен бастаймын,\n"
    "2. Барлық мақтау бүкіл әлемнің раббысы Аллаға тән\n"
    "3. Аса қамқор, ерекше мейірімді,\n"
    "4. Қиямет күннің иесі!\n"
    "5. Саған ғана құлшылық қыламыз, әрі Сенен ғана жәрдем тілейміз:\n"
    "6. Бізді тура жолға сала көр,\n"
    "7. Нығыметке бөленгендердің жолына! Қаһарыңа ұшырағандардың жолына емес"
)


def build_prompt(surah: int, ayah: int, text_ar: str) -> str:
    compact = " ".join((text_ar or "").replace("\ufeff", "").split())
    return (
        "Сен Құран аятын араб тілінен қазақ тіліне аударасың.\n\n"
        "СТИЛЬ ЭТАЛОНЫ (1-сүре, тексерілген нұсқа — сөйлем ұзындығы, тыныс, «Саған/Сенен», "
        "«бізді», «жолға» сияқты даралық, атауларды дәл осы үлгіге жақын ұста; жауапқа нөмір қоспа):\n"
        f"{FATIHA_KK_STYLE_EXAMPLES}\n\n"
        "МАҒЫНАНЫ САҚТАУ (бірінші орында):\n"
        "- Аяттың діни мағынасын, шарттар мен уәделерді бұрмаламай, қысқартпай, жеңілдетіп жібермей сақта.\n"
        "- Өз ойыңды, тәпсірді, қосымша түсіндірмені қоспа — бірақ арабтың берген мағынасын толық жеткіз.\n"
        "- Қарапайым сөздерді тек оқырманға жол табу үшін қолдан; мағынаға нұқсан келтіретін жеңілдетуге болмайды.\n\n"
        "ТҮСІНІКТІЛІК (екінші орында):\n"
        "Оқырманға ҚАРАПАЙЫМ, түсінікті қазақша арқылы жеткіз. "
        "Күрделі кітаби сөздерден, шұбалаң сөйлемдерден аулақ бол. "
        "Телеграф емес, толық сөйлем; әр сөйлем қысқа және анық болсын.\n\n"
        "Қарапайымдық:\n"
        "- Күнделікті қазақ тілінде жиі кездесетін сөздерді таңда; сирек синонимдерді қолданба.\n"
        "- Бір сөйлемде тым көп ойды үйме: қажет болса екі-үш қысқа сөйлемге бөліп жаз.\n"
        "- Арабта жазық тұрған «кім істейді», «кімге» сияқты нәрселерді қазақта қысқаша анықтап бер "
        "(мысалы: «олар» деген кім екенін контекст бойынша түсінікті ет).\n"
        "- Бір сөздің бірнеше мағынасы болса, осы аятқа сәйкес келетін ең түсініктісін таңда.\n\n"
        "Талаптар:\n"
        "1. Тек аяттың қазақша мағынасын бер — тәпсір, тақырып, аят нөмірі, "
        "«мағынасы:» сияқты қосымша жоқ.\n"
        "2. Арабша мәтінді жауапқа көшірме.\n"
        "3. Діни тұрақты атаулар: жоғарыдағы Фатиха үлгісіндегідей (мысалы «Алла», «Алланың», «Аллаға»); "
        "Пайғамбар, Құран, Жәннат, Тозақ — қазақша әдеттегі түрде.\n"
        "4. Себеп-салдарды «себебі, сондықтан, бірақ, ал, егер» сөздерімен байланыстыр — "
        "сөйлем құрылымы оқырманға түсінікті болсын.\n"
        "5. Араб сөйлемін сөзбе-сөз көшірме; қазақтың табиғи сөйлеу ретімен қайта құрастыр.\n"
        "6. Берілген мәтін бір аятқа сәйкес; тек сол аяттың мағынасын бер.\n\n"
        f"Сүре: {surah}\n"
        f"Аят: {ayah}\n"
        f"Арабша мәтін: {compact}"
    )


def clean_translation(text: str) -> str:
    cleaned = (text or "").replace("\ufeff", "").strip()
    prefixes = (
        "қазақша аудармасы:",
        "аудармасы:",
        "мағынасы:",
        "translation:",
    )
    lower = cleaned.lower()
    for prefix in prefixes:
        if lower.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
            lower = cleaned.lower()

    cleaned = re.sub(r"^\s*\d+\s*[:.)-]\s*", "", cleaned)
    cleaned = re.sub(r"^\s*аят\s*\d+\s*[:.)-]?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip("\"'` ")
    if "\n" in cleaned:
        cleaned = " ".join(line.strip() for line in cleaned.splitlines() if line.strip())
    cleaned = " ".join(cleaned.split())
    return cleaned


def translate_one(client, row, args) -> tuple[str, str]:
    prompt = build_prompt(row["surah"], row["ayah"], row["text_ar"])
    last_error = None

    for model_name in MODEL_CANDIDATES:
        for attempt in range(args.max_retries + 1):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        "temperature": 0.0,
                        # Ұзын аят + қарапайым бөлшектеу үшін
                        "max_output_tokens": 640,
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


def save_translation(conn: sqlite3.Connection, row_id: int, text_kk: str):
    conn.execute(
        "UPDATE quran SET text_kk = ?, updated_at = datetime('now') WHERE id = ?",
        (text_kk, row_id),
    )
    conn.commit()


def main():
    args = parse_args()
    client = ensure_client()

    if args.backup and not args.dry_run:
        backup = create_backup(args.db)
        logger.info("DB backup created: %s", backup)

    conn = open_conn(args.db)
    try:
        before = stats(conn)
        rows = fetch_rows(conn, args)
        logger.info(
            "Start Quran translation: total=%s filled=%s missing=%s selected=%s",
            before["total"],
            before["filled"],
            before["missing"],
            len(rows),
        )

        errors = 0
        done = 0

        for row in rows:
            logger.info(
                "Processing id=%s surah=%s ayah=%s",
                row["id"],
                row["surah"],
                row["ayah"],
            )
            try:
                model_name, translated = translate_one(client, row, args)
                logger.info(
                    "Translated id=%s with %s -> %s",
                    row["id"],
                    model_name,
                    translated[:80],
                )
                if not args.dry_run:
                    save_translation(conn, row["id"], translated)
                done += 1
                if args.sleep:
                    time.sleep(args.sleep)
            except Exception as exc:
                if is_daily_quota_exhausted(exc) or "күнделікті квотасы таусылды" in str(exc):
                    logger.error(
                        "Күнделікті API квотасы таусылды; ертең қайта іске қосыңыз: %s",
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
            "Finished: translated_now=%s errors=%s total_filled=%s missing=%s",
            done,
            errors,
            after["filled"],
            after["missing"],
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
