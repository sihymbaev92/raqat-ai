# -*- coding: utf-8 -*-
import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from config.settings import (
    BOT_TOKEN,
    DB_PATH,
    RAQAT_BOT_API_ONLY,
    RAQAT_CONTENT_READ_SECRET,
    RAQAT_PLATFORM_API_BASE,
)
from db.connection import db_conn
from db.migrations import run_schema_migrations

from handlers.routes import register_all_handlers
from services.bot_commands import register_default_bot_commands
from services.genai_service import init_genai
from services.language_service import ensure_user_preferences_table
from services.ops_service import ensure_ops_tables

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("raqat_ai")


def check_required_tables() -> bool:
    try:
        with db_conn(DB_PATH) as conn:
            cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = {row["name"] for row in cur.fetchall()}
            return "hadith" in tables and "quran" in tables
    except Exception as e:
        logger.error(f"DB check error: {e}")
        return False

async def main():
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN табылмады!")
        sys.exit(1)

    if not check_required_tables():
        logger.error("DB ішінде hadith немесе quran кестесі табылмады!")
        sys.exit(1)

    if RAQAT_BOT_API_ONLY:
        if not RAQAT_PLATFORM_API_BASE:
            logger.error("RAQAT_BOT_API_ONLY=1 кезінде RAQAT_PLATFORM_API_BASE міндетті.")
            sys.exit(1)
        if not RAQAT_CONTENT_READ_SECRET:
            logger.warning(
                "RAQAT_BOT_API_ONLY=1: RAQAT_CONTENT_READ_SECRET бос. "
                "API контент endpoint-тері қорғалса, бот оқуы қателеседі."
            )

    init_genai()
    ensure_user_preferences_table()
    ensure_ops_tables()
    run_schema_migrations(DB_PATH)

    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher()
    register_all_handlers(dp)

    await register_default_bot_commands(bot)

    logger.info("RAQAT AI PRO Started...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
