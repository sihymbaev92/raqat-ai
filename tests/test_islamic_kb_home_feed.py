# -*- coding: utf-8 -*-
from __future__ import annotations

import unittest
from pathlib import Path

from islamic_kb.home_feed import (
    interleave_home_feeds,
    parse_fatua_home_html,
    parse_muftyat_home_html,
)

REPO = Path(__file__).resolve().parents[1]
FATUA_SAMPLE = (REPO / "tests" / "fixtures" / "fatua-home-sample.html").read_text(encoding="utf-8")
MUFTYAT_SAMPLE = (REPO / "tests" / "fixtures" / "muftyat-home-sample.html").read_text(encoding="utf-8")


class TestHomeFeed(unittest.TestCase):
    def test_parse_fatua_home(self):
        items = parse_fatua_home_html(FATUA_SAMPLE, limit=4)
        self.assertGreaterEqual(len(items), 3)
        self.assertEqual(items[0].site, "fatua")
        self.assertIn("/media/", items[0].image_url)
        self.assertIn("/kk/qa/read/", items[0].url)

    def test_parse_muftyat_home(self):
        items = parse_muftyat_home_html(MUFTYAT_SAMPLE, limit=4)
        self.assertGreaterEqual(len(items), 3)
        self.assertEqual(items[0].site, "muftyat")
        self.assertIn("imgs.muftyat.kz", items[0].image_url)
        self.assertIn("/kk/news/", items[0].url)

    def test_interleave(self):
        fatua = parse_fatua_home_html(FATUA_SAMPLE, limit=2)
        muftyat = parse_muftyat_home_html(MUFTYAT_SAMPLE, limit=2)
        merged = interleave_home_feeds(fatua, muftyat)
        self.assertEqual([x.site for x in merged], ["fatua", "muftyat", "fatua", "muftyat"])


if __name__ == "__main__":
    unittest.main()
