# -*- coding: utf-8 -*-
from config.settings import QURAN_AUDIO_BASE


def build_quran_audio_url(surah: int, ayah: int) -> str:
    return f"{QURAN_AUDIO_BASE}/{surah:03d}{ayah:03d}.mp3"


def quran_audio_caption(surah_title: str, surah: int, ayah: int) -> str:
    return (
        f"🎧 <b>{surah_title}</b>\n"
        f"Насир әл-Қатами · {surah}:{ayah}\n\n"
        "Аят-аятпен тыңдап, артынан қайталаңыз."
    )
