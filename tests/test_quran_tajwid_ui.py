# -*- coding: utf-8 -*-
import unittest

from handlers.quran import (
    _khatm_text,
    _quran_page_text,
    _quran_page_markup,
    _surah_chunk_markup,
    _tajwid_markup,
    _tajwid_text,
)
from state.memory import USER_LANG


def _button_texts(markup) -> list[str]:
    return [button.text for row in markup.inline_keyboard for button in row]


class QuranTajwidUiTests(unittest.TestCase):
    def test_quran_menu_markup_no_longer_embeds_tajwid_or_khatm(self):
        texts = _button_texts(_quran_page_markup(0, None))
        self.assertIn("🔎 Аят іздеу", texts)
        self.assertNotIn("🎓 Тәжуид", texts)
        self.assertNotIn("📍 Хатым", texts)

    def test_surah_markup_stays_focused_on_reading_flow(self):
        texts = _button_texts(_surah_chunk_markup(1, 0, 1, 0, None))
        self.assertIn("🎧 Толық сүре аудио", texts)
        self.assertIn("🔎 Аят іздеу", texts)
        self.assertNotIn("🎓 Тәжуид", texts)
        self.assertNotIn("📍 Хатым", texts)
        self.assertNotIn("🎨 Тәжуид картасы", texts)

    def test_tajwid_menu_prioritizes_arabic_letter_learning(self):
        text = _tajwid_text("menu")
        texts = _button_texts(_tajwid_markup("menu"))

        self.assertIn("әріп", text.lower())
        self.assertIn("харакат", text.lower())
        self.assertIn("🔤 Әріптер", texts)
        self.assertIn("◌َ Харакат", texts)
        self.assertIn("📘 Ережелер", texts)
        self.assertNotIn("📍 Хатым", texts)

    def test_first_letters_lesson_contains_foundational_examples(self):
        text = _tajwid_text("letters1")
        self.assertIn("ا", text)
        self.assertIn("ب", text)
        self.assertIn("با = ба", text)

    def test_quran_page_text_localizes_to_russian_without_kazakh_header(self):
        USER_LANG[501] = "ru"
        text = _quran_page_text(0, 501)
        self.assertIn("Коран", text)
        self.assertIn("Перевод", text)
        self.assertNotIn("Құран — 114 сүре", text)

    def test_khatm_text_localizes_to_russian(self):
        USER_LANG[777] = "ru"
        text = _khatm_text(777)
        self.assertIn("Хатм", text)
        self.assertIn("Как использовать", text)


if __name__ == "__main__":
    unittest.main()
