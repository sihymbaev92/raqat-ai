# -*- coding: utf-8 -*-
import unittest

from services.text_cleanup import clean_text_content


class TextCleanupTests(unittest.TestCase):
    def test_removes_bom_nbsp_and_zero_width_chars(self):
        raw = "\ufeffСәлем\xa0әлем\u200b"
        self.assertEqual(clean_text_content(raw), "Сәлем әлем")

    def test_collapses_extra_spaces_and_blank_lines(self):
        raw = "A   B \n \n \n C"
        self.assertEqual(clean_text_content(raw), "A B\n\nC")


if __name__ == "__main__":
    unittest.main()
