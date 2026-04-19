# -*- coding: utf-8 -*-
from __future__ import annotations

from datetime import datetime, timezone

from aiogram import types

from keyboards.menu import admin_menu, feedback_admin_actions
from services.ops_service import (
    APP_STARTED_AT,
    admin_ids_configured,
    build_analytics_summary,
    build_content_qa_summary,
    build_health_snapshot,
    is_admin_user,
    list_feedback,
    log_event,
    update_feedback_status,
)


def _is_allowed(user_id: int | None) -> bool:
    return is_admin_user(user_id)


def _admin_denied_text() -> str:
    if admin_ids_configured():
        return "🔒 Admin access only."
    return "🔒 Admin access only. `.env` ішінде `ADMIN_USER_IDS` параметрін толтырыңыз."


def _format_uptime() -> str:
    delta = datetime.now(timezone.utc) - APP_STARTED_AT
    total = int(delta.total_seconds())
    hours, remainder = divmod(total, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def _clip(text: str | None, limit: int = 180) -> str:
    value = " ".join((text or "").split())
    if len(value) <= limit:
        return value
    return value[: limit - 1] + "…"


async def _send_health(target: types.Message, user_id: int) -> None:
    data = build_health_snapshot()
    log_event(user_id, "admin_health")
    await target.answer(
        "❤️ <b>Health</b>\n\n"
        f"Uptime: <b>{_format_uptime()}</b>\n"
        f"App started: <code>{data['app_started_at']}</code>\n"
        f"DB: <b>{'OK' if data['db_ok'] else 'FAIL'}</b>\n"
        f"Quran table: <b>{'yes' if data['has_quran'] else 'no'}</b> ({data['quran_rows']})\n"
        f"Hadith table: <b>{'yes' if data['has_hadith'] else 'no'}</b> ({data['hadith_rows']})\n"
        f"Users with prefs: <b>{data['user_count']}</b>\n"
        f"New feedback: <b>{data['feedback_new']}</b>\n"
        f"Events last 15m: <b>{data['events_last_15m']}</b>\n"
        f"Last event: <code>{data['last_event_at'] or 'n/a'}</code>"
    )


async def _send_stats(target: types.Message, user_id: int) -> None:
    data = build_analytics_summary()
    top_lines = [
        f"• <b>{row['event_name']}</b> — {row['total']}"
        for row in data["top_events"]
    ] or ["• n/a"]
    gem_rows = data.get("gemini_proxy_rows") or []
    gem_lines = [
        f"• <b>{row['event_name']}</b> — {row['total']}"
        for row in gem_rows
    ] or ["• (әзірше жоқ)"]
    gem_total = int(data.get("gemini_proxy_total") or 0)
    feedback_lines = [
        f"• {category}: <b>{total}</b>"
        for category, total in data["feedback_by_category"].items()
    ] or ["• n/a"]
    log_event(user_id, "admin_stats")
    await target.answer(
        "📊 <b>Analytics (24h)</b>\n\n"
        f"Events: <b>{data['events']}</b>\n"
        f"Active users: <b>{data['active_users']}</b>\n"
        f"Open feedback: <b>{data['feedback_open']}</b>\n"
        f"Last event: <code>{data['last_event_at'] or 'n/a'}</code>\n\n"
        "<b>Top events</b>\n"
        + "\n".join(top_lines)
        + "\n\n🤖 <b>Gemini (болжамды)</b>\n"
        "<i>event_log бойынша AI жақын оқиғалар; Google шоты емес.</i>\n"
        f"Жиынтығы: <b>{gem_total}</b>\n"
        + "\n".join(gem_lines)
        + "\n\n<b>Feedback by category</b>\n"
        + "\n".join(feedback_lines)
    )


async def _send_feedbacks(target: types.Message, user_id: int) -> None:
    rows = list_feedback(limit=5)
    log_event(user_id, "admin_feedbacks")
    if not rows:
        await target.answer("💬 Feedback queue is empty.")
        return

    await target.answer(
        "💬 <b>Latest Feedback</b>\n\n"
        f"Showing <b>{len(rows)}</b> latest items."
    )
    for row in rows:
        await target.answer(
            f"#{row['id']} • <b>{row['category']}</b> • {row['status']}\n"
            f"uid={row['user_id']} • <code>{row['created_at']}</code>\n"
            f"{_clip(row['message_text'])}",
            reply_markup=feedback_admin_actions(int(row["id"])),
        )


async def _send_qa(target: types.Message, user_id: int) -> None:
    data = build_content_qa_summary()
    log_event(user_id, "admin_qa")
    weakest_lines = [
        f"• {row['table']}:{row['lang']} — <b>{row['percent']}%</b> ({row['count']}/{row['total']})"
        for row in data["weakest"]
    ] or ["• n/a"]
    report_lines = [
        f"• #{row['id']} uid={row['user_id']} {row['status']} — {_clip(row['message_text'], 120)}"
        for row in data["recent_content_reports"]
    ] or ["• No content reports"]
    await target.answer(
        "🧪 <b>Content QA</b>\n\n"
        "<b>Weakest translation coverage</b>\n"
        + "\n".join(weakest_lines)
        + "\n\n<b>Recent content reports</b>\n"
        + "\n".join(report_lines)
    )


async def admin_handler(message: types.Message):
    uid = getattr(message.from_user, "id", None)
    if not _is_allowed(uid):
        await message.answer(_admin_denied_text())
        return

    log_event(uid, "admin_open")
    await message.answer(
        "🛠 <b>Admin tools</b>\n\nChoose a report:",
        reply_markup=admin_menu(),
    )


async def health_handler(message: types.Message):
    uid = getattr(message.from_user, "id", None)
    if not _is_allowed(uid):
        await message.answer(_admin_denied_text())
        return
    await _send_health(message, uid)


async def stats_handler(message: types.Message):
    uid = getattr(message.from_user, "id", None)
    if not _is_allowed(uid):
        await message.answer(_admin_denied_text())
        return
    await _send_stats(message, uid)


async def feedbacks_handler(message: types.Message):
    uid = getattr(message.from_user, "id", None)
    if not _is_allowed(uid):
        await message.answer(_admin_denied_text())
        return
    await _send_feedbacks(message, uid)


async def qa_report_handler(message: types.Message):
    uid = getattr(message.from_user, "id", None)
    if not _is_allowed(uid):
        await message.answer(_admin_denied_text())
        return
    await _send_qa(message, uid)


async def admin_callback(callback: types.CallbackQuery):
    uid = getattr(callback.from_user, "id", None)
    if not _is_allowed(uid):
        await callback.answer(_admin_denied_text(), show_alert=True)
        return

    parts = (callback.data or "").split(":")
    if len(parts) < 2:
        await callback.answer()
        return

    action = parts[1]
    if action == "health":
        await _send_health(callback.message, uid)
        await callback.answer()
        return
    if action == "stats":
        await _send_stats(callback.message, uid)
        await callback.answer()
        return
    if action == "feedbacks":
        await _send_feedbacks(callback.message, uid)
        await callback.answer()
        return
    if action == "qa":
        await _send_qa(callback.message, uid)
        await callback.answer()
        return
    if action in {"feedback_done", "feedback_reviewed"} and len(parts) > 2:
        status = "done" if action == "feedback_done" else "reviewed"
        updated = update_feedback_status(int(parts[2]), status)
        if updated:
            await callback.message.edit_reply_markup(reply_markup=None)
            log_event(uid, "admin_feedback_status", detail=status)
        await callback.answer("Updated" if updated else "Not found", show_alert=False)
        return

    await callback.answer()
