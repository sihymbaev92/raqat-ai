# -*- coding: utf-8 -*-
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

BOT_TOKEN = (os.getenv("BOT_TOKEN") or "").strip()
GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()

_DB_PATH_ENV = (os.getenv("DB_PATH") or "").strip()
DB_PATH = _DB_PATH_ENV if _DB_PATH_ENV else os.path.join(BASE_DIR, "global_clean.db")

# Келешекте PostgreSQL: DSN толтырылғанда SQLAlchemy/asyncpg қабатына көшу (қазір SQLite DB_PATH).
DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()

CITY_NAME = os.getenv("CITY_NAME", "Shymkent")
COUNTRY_NAME = os.getenv("COUNTRY_NAME", "Kazakhstan")

QURAN_AUDIO_BASE = os.getenv(
    "QURAN_AUDIO_BASE",
    "https://everyayah.com/data/Maher_AlMuaiqly_64kbps",
)

ALLOWED_TEXT_COLS = {"text_kk", "text_kz", "text_ru", "text_en", "text_ar"}

# Құран транскрипциясы: default — дерекқор + әдепкі алгоритм; pedagogical — 1-сүре эталоны,
# қалғанына алгоритм + тыныс жақындату (толық 6224 үлгі үшін JSON импорт).
_QURAN_TR_ST = (os.getenv("QURAN_TRANSLIT_STYLE") or "default").strip().lower()
QURAN_TRANSLIT_STYLE = _QURAN_TR_ST if _QURAN_TR_ST in ("default", "pedagogical") else "default"

# In-memory user state: sliding TTL (seconds) and max keys per store
USER_STATE_TTL_SECONDS = int(os.getenv("USER_STATE_TTL_SECONDS", str(6 * 3600)))
USER_LANG_TTL_SECONDS = int(os.getenv("USER_LANG_TTL_SECONDS", str(30 * 24 * 3600)))
TASBIH_TTL_SECONDS = int(os.getenv("TASBIH_TTL_SECONDS", str(72 * 3600)))
STATE_MAX_ENTRIES = int(os.getenv("STATE_MAX_ENTRIES", "100000"))

# Aladhan prayer times
PRAYER_TIMES_METHOD = int(os.getenv("PRAYER_TIMES_METHOD", "3"))
PRAYER_TIMES_TIMEOUT_SECONDS = float(os.getenv("PRAYER_TIMES_TIMEOUT_SECONDS", "12"))
PRAYER_TIMES_CACHE_SECONDS = int(os.getenv("PRAYER_TIMES_CACHE_SECONDS", "900"))

# Gemini / AI: minimum seconds between calls per user (abuse & cost)
AI_RATE_LIMIT_SECONDS = float(os.getenv("AI_RATE_LIMIT_SECONDS", "8"))
AI_MODEL_CANDIDATES = tuple(
    item.strip()
    for item in os.getenv(
        "AI_MODEL_CANDIDATES",
        "gemini-2.5-flash,gemini-2.5-flash-lite",
    ).split(",")
    if item.strip()
)

# Орталық AI: бот осы API арқылы Gemini-ға жібереді (Bot → API → AI).
RAQAT_PLATFORM_API_BASE = (os.getenv("RAQAT_PLATFORM_API_BASE") or "").strip().rstrip("/")
RAQAT_AI_PROXY_SECRET = (os.getenv("RAQAT_AI_PROXY_SECRET") or "").strip()
# Бот → platform_api /ai/chat httpx оқу күтуі (сек). Ұзақ күтпеу үшін әдепкі қысқа.
try:
    RAQAT_PLATFORM_AI_HTTP_TIMEOUT = float(os.getenv("RAQAT_PLATFORM_AI_HTTP_TIMEOUT", "24"))
except ValueError:
    RAQAT_PLATFORM_AI_HTTP_TIMEOUT = 24.0
RAQAT_PLATFORM_AI_HTTP_TIMEOUT = max(10.0, min(RAQAT_PLATFORM_AI_HTTP_TIMEOUT, 90.0))
# Telegram handler asyncio.wait_for (барлық ask_genai, соның ішінде тікелей Gemini).
try:
    RAQAT_BOT_AI_WAIT_TOTAL = float(os.getenv("RAQAT_BOT_AI_WAIT_TOTAL", "35"))
except ValueError:
    RAQAT_BOT_AI_WAIT_TOTAL = 35.0
RAQAT_BOT_AI_WAIT_TOTAL = max(15.0, min(RAQAT_BOT_AI_WAIT_TOTAL, 90.0))
# POST /api/v1/auth/link/telegram — X-Raqat-Bot-Link-Secret (API мен ботта бірдей)
RAQAT_BOT_LINK_SECRET = (os.getenv("RAQAT_BOT_LINK_SECRET") or "").strip()
# mobile: GET /api/v1/quran|hadith|metadata — API серверінде RAQAT_CONTENT_READ_SECRET (опционал)
RAQAT_CONTENT_READ_SECRET = (os.getenv("RAQAT_CONTENT_READ_SECRET") or "").strip()
# Bot контенті үшін API-only режим (боттағы сыртқы/локаль fallback-тарды кезеңдеп өшіру).
RAQAT_BOT_API_ONLY = (os.getenv("RAQAT_BOT_API_ONLY") or "1").strip().lower() in {"1", "true", "yes", "on"}
# Бір орталық режим: боттағы AI тек platform_api арқылы (тікелей Gemini fallback жоқ).
RAQAT_SINGLE_SOURCE_MODE = (os.getenv("RAQAT_SINGLE_SOURCE_MODE") or "1").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

ADMIN_USER_IDS = tuple(
    sorted(
        {
            int(item.strip())
            for item in os.getenv("ADMIN_USER_IDS", "").replace(";", ",").split(",")
            if item.strip().isdigit()
        }
    )
)
