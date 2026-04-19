# -*- coding: utf-8 -*-
import logging
from typing import Any

from aiogram import types
from aiogram.exceptions import TelegramBadRequest

from config.settings import DB_PATH
from db.connection import db_conn
from db.dhikr_repo import first_dhikr_id, get_dhikr
from keyboards.menu import tasbih_keyboard
from services.ops_service import log_event
from state.memory import TASBIH_COUNT, TASBIH_DHIKR_ID, TASBIH_TARGET

logger = logging.getLogger("raqat_ai.tasbih")


def _row_dict(row: Any) -> dict[str, Any]:
    if row is None:
        return {}
    return dict(row)


def _current_target(uid: int) -> int:
    TASBIH_TARGET.setdefault(uid, 33)
    return int(TASBIH_TARGET[uid])


def _ensure_dhikr_id(uid: int) -> int | None:
    with db_conn(DB_PATH) as conn:
        fid = first_dhikr_id(conn)
    if fid is None:
        return None
    cur = TASBIH_DHIKR_ID.get(uid)
    if cur is None:
        TASBIH_DHIKR_ID[uid] = fid
        with db_conn(DB_PATH) as conn:
            row = _row_dict(get_dhikr(conn, fid))
        if row.get("default_target"):
            TASBIH_TARGET[uid] = int(row["default_target"])
        return fid
    return int(cur)


def _current_dhikr(uid: int) -> dict[str, Any]:
    did = _ensure_dhikr_id(uid)
    if did is None:
        return {}
    with db_conn(DB_PATH) as conn:
        return _row_dict(get_dhikr(conn, did))


def _progress_bar(count: int, target: int) -> str:
    ratio = min(count, target) / max(target, 1)
    filled = round(ratio * 12)
    return "🟩" * filled + "⬜" * (12 - filled)


def _remaining(count: int, target: int) -> int:
    if target <= 0:
        return 0
    return max(target - (count % target), 0) if count and count % target else max(target - count, 0)


def _cycle_position(count: int, target: int) -> int:
    if target <= 0:
        return 0
    if count == 0:
        return 0
    value = count % target
    return target if value == 0 else value


def _dhikr_phase_text(count: int, target: int, row: dict[str, Any]) -> str:
    if row.get("phase_rule") == "triple_salah" and target == 99:
        progress = _cycle_position(count, target)
        if progress < 33:
            return "СубханАллаһ"
        if progress < 66:
            return "Әлхамдулиллаһ"
        return "Аллаһу Әкбар"
    ar = (row.get("text_ar") or "").strip()
    kk = (row.get("text_kk") or "").strip()
    return kk or ar or "—"


def _dhikr_tip(row: dict[str, Any], target: int) -> str:
    if row.get("phase_rule") == "triple_salah" and target == 99:
        return "99 режимі: 33 СубханАллаһ, 33 Әлхамдулиллаһ, 33 Аллаһу Әкбар."
    slug = (row.get("slug") or "").strip()
    if slug:
        return f"Зікір: {slug} · мақсат {target} қайталам."
    return f"Мақсат: {target} қайталам."


def _tasbih_text(uid: int) -> str:
    count = TASBIH_COUNT.setdefault(uid, 0)
    target = _current_target(uid)
    row = _current_dhikr(uid)
    completed = count // target if target else 0
    remaining = _remaining(count, target)
    current_cycle = _cycle_position(count, target)
    progress_count = current_cycle if count else 0
    percent = int((progress_count / target) * 100) if target else 0
    phase_text = _dhikr_phase_text(count, target, row)

    title_kk = (row.get("text_kk") or "").strip() or "Тәсбих / зікір"
    ar_line = (row.get("text_ar") or "").strip()
    slug = (row.get("slug") or "").strip() or "zikr"

    text = (
        "📿 <b>Тәсбих (зікір санағыш)</b>\n\n"
        f"<b>Зікір:</b> {title_kk}\n"
        f"<b>Код:</b> {slug}\n"
        f"<b>Арабша:</b> {ar_line or '—'}\n\n"
        f"<b>Нысана:</b> {target}\n"
        f"<b>Жалпы санау:</b> {count}\n"
        f"<b>Ағымдағы айналым:</b> {current_cycle}/{target}\n"
        f"<b>Қалды:</b> {remaining}\n"
        f"<b>Қазір оқылатыны:</b> {phase_text}\n"
        f"<b>Прогресс:</b> {percent}%\n"
        f"{_progress_bar(progress_count, target)}"
    )

    if completed:
        text += f"\n\nТолық аяқталған айналым: <b>{completed}</b>"

    text += f"\n\n{_dhikr_tip(row, target)}"
    text += "\n\nБасқару: <b>+1</b> санын арттырады, <b>33/99</b> нысананы ауыстырады, <b>Нөлдеу</b> санауды қайтарады."

    return text


def apply_tasbih_action(uid: int, action: str) -> str:
    log_event(uid, "tasbih_action", detail=action)
    TASBIH_COUNT.setdefault(uid, 0)
    target = _current_target(uid)
    answer_text = ""

    if action == "tasbih_plus":
        TASBIH_COUNT[uid] += 1
    elif action == "tasbih_goal_33":
        TASBIH_TARGET[uid] = 33
        target = 33
        answer_text = "33 режимі қосылды"
    elif action == "tasbih_goal_99":
        TASBIH_TARGET[uid] = 99
        target = 99
        answer_text = "99 режимі қосылды"
    elif action == "tasbih_reset":
        TASBIH_COUNT[uid] = 0
        answer_text = "Санағыш нөлденді"
    elif action.startswith("tasbih_z_"):
        try:
            new_id = int(action.split("_", 2)[2])
        except (IndexError, ValueError):
            new_id = 0
        if new_id > 0:
            with db_conn(DB_PATH) as conn:
                r = _row_dict(get_dhikr(conn, new_id))
            if r.get("id"):
                TASBIH_DHIKR_ID[uid] = new_id
                TASBIH_COUNT[uid] = 0
                dt = int(r.get("default_target") or 33)
                TASBIH_TARGET[uid] = dt
                answer_text = "Зікір таңдалды"
                target = dt

    if target and TASBIH_COUNT[uid] > 0 and TASBIH_COUNT[uid] % target == 0:
        answer_text = "Мақсат санына жеттіңіз"

    return answer_text


async def send_tasbih_message(message: types.Message):
    uid = message.from_user.id
    log_event(uid, "open_tasbih")
    TASBIH_COUNT.setdefault(uid, 0)
    _ensure_dhikr_id(uid)
    await message.answer(
        _tasbih_text(uid),
        reply_markup=tasbih_keyboard(uid),
    )


async def tasbih_handler(message: types.Message):
    logger.info("TASBIH handler uid=%s text=%s", getattr(message.from_user, "id", None), message.text)
    await send_tasbih_message(message)


async def tasbih_callback(callback: types.CallbackQuery):
    logger.info("TASBIH callback uid=%s data=%s", getattr(callback.from_user, "id", None), callback.data)
    uid = callback.from_user.id
    action = callback.data or ""
    if action == "tasbih_plus10":
        answer_text = "Бұл батырма алынды. Енді +1 қолданылады."
    else:
        answer_text = apply_tasbih_action(uid, action)

    try:
        await callback.message.edit_text(
            _tasbih_text(uid),
            reply_markup=tasbih_keyboard(uid),
        )
    except TelegramBadRequest:
        await callback.message.answer(
            _tasbih_text(uid),
            reply_markup=tasbih_keyboard(uid),
        )

    await callback.answer(answer_text)
