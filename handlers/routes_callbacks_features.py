# -*- coding: utf-8 -*-
from aiogram import Dispatcher, F

from handlers.quran import (
    quran_audio_callback,
    quran_khatm_callback,
    quran_page_callback,
    quran_search_callback,
    quran_tajwid_map_callback,
    tajwid_callback,
    quran_tajwid_callback,
    surah_callback,
    surah_page_callback,
)
from handlers.tasbih import tasbih_callback
from handlers.prayer import prayer_callback
from handlers.hajj import hajj_callback


def register_feature_callback_handlers(dp: Dispatcher) -> None:
    dp.callback_query.register(quran_search_callback, F.data == "quran_search")
    dp.callback_query.register(tajwid_callback, F.data.startswith("tajwid:"))
    dp.callback_query.register(quran_tajwid_callback, F.data.startswith("quran_tajwid_"))
    dp.callback_query.register(quran_tajwid_map_callback, F.data.startswith("qurantajmap:"))
    dp.callback_query.register(quran_khatm_callback, F.data.startswith("qurankhatm:"))
    dp.callback_query.register(quran_audio_callback, F.data.startswith("quranaudio:"))
    dp.callback_query.register(quran_page_callback, F.data.startswith("quran_page_"))
    dp.callback_query.register(surah_page_callback, F.data.startswith("surahpage_"))
    dp.callback_query.register(surah_callback, F.data.startswith("surah_"))
    dp.callback_query.register(tasbih_callback, F.data.startswith("tasbih_"))
    dp.callback_query.register(prayer_callback, F.data.startswith("prayer:"))
    dp.callback_query.register(hajj_callback, F.data.startswith("hajj:"))
