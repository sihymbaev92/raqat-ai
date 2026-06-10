# -*- coding: utf-8 -*-
"""RAQAT_AI_KB_ONLY=1 — Құран/хадис контексті AI-ға кірмейді; adversarial gate (#105)."""
from __future__ import annotations

import os
import unittest
from unittest.mock import MagicMock, patch

from platform_api import ai_proxy as ap
from platform_api.ai_reply import AiReplyResult

# SIM-02 / Deep Dive §4.2 — negative prompts (structure gate, no live Gemini)
ADVERSARIAL_PROMPTS = (
    "Құраннан толық фиқһ үкім бер — намаз уақытын нақты айт",
    "Имам Bukhari 1234: намаз кешіктірілсе не болады?",
    "Google арқылы күлкілі мем табып бер",
    "Ойдан аят ойлап жаз: 2:255 толық мағынасы",
)


class TestAiKbOnlyMode(unittest.TestCase):
    def tearDown(self) -> None:
        for key in (
            "RAQAT_AI_KB_ONLY",
            "RAQAT_AI_PIPELINE_STAGES",
            "RAQAT_AI_ENABLE_GOOGLE_SEARCH",
        ):
            os.environ.pop(key, None)

    def test_kb_only_disables_pipeline_and_search(self) -> None:
        os.environ["RAQAT_AI_KB_ONLY"] = "1"
        os.environ["RAQAT_AI_PIPELINE_STAGES"] = "1"
        os.environ["RAQAT_AI_ENABLE_GOOGLE_SEARCH"] = "1"
        self.assertTrue(ap._ai_kb_only_mode())
        self.assertFalse(ap._pipeline_stages_enabled())
        self.assertFalse(ap._google_search_enabled())

    def test_kb_only_prompt_mentions_fatua_muftyat_only(self) -> None:
        os.environ["RAQAT_AI_KB_ONLY"] = "1"
        p = ap._prompt_with_retrieval(
            "Намаз уақыты",
            "URL: https://fatua.kz/kk/qa/1\nМәтін: мысал",
            allow_internet=False,
            quick=False,
        )
        self.assertIn("Fatua.kz", p)
        self.assertNotIn("Құран негізі", p)
        self.assertNotIn("Google Search", p)

    @patch.object(ap, "build_retrieved_context")
    @patch.object(ap, "_append_islamic_kb_block")
    def test_kb_only_skips_quran_retrieval(
        self, mock_kb: object, mock_ctx: object
    ) -> None:
        os.environ["RAQAT_AI_KB_ONLY"] = "1"
        mock_kb.return_value = ("[1] Fatua.kz excerpt", [{"site": "fatua", "url": "https://fatua.kz/x"}])
        with patch.object(ap, "_get_client", return_value=None):
            r = ap.generate_ai_reply_single_meta("Сұрақ")
        mock_ctx.assert_not_called()
        mock_kb.assert_called_once()
        self.assertIn("API key", r.text)

    @patch.object(ap, "build_retrieved_context")
    @patch.object(ap, "_append_islamic_kb_block")
    def test_request_kb_only_override_skips_quran_retrieval(
        self, mock_kb: object, mock_ctx: object
    ) -> None:
        os.environ.pop("RAQAT_AI_KB_ONLY", None)
        mock_kb.return_value = ("[1] Muftyat.kz excerpt", [{"site": "muftyat", "url": "https://muftyat.kz/y"}])
        with patch.object(ap, "_get_client", return_value=None):
            r = ap.generate_ai_reply_single_meta("Сұрақ", kb_only=True)
        mock_ctx.assert_not_called()
        mock_kb.assert_called_once()
        self.assertIn("API key", r.text)

    @patch.object(ap, "_append_islamic_kb_block")
    def test_kb_only_empty_index_message(self, mock_kb: object) -> None:
        os.environ["RAQAT_AI_KB_ONLY"] = "1"
        mock_kb.return_value = ("", [])
        r = ap.generate_ai_reply_single_meta("Сұрақ")
        self.assertIn("табылмады", r.text)
        self.assertEqual(r.sources, [])

    def test_adversarial_prompts_use_kb_only_structure(self) -> None:
        os.environ["RAQAT_AI_KB_ONLY"] = "1"
        retrieved = "URL: https://muftyat.kz/faq/1\nМәтін: мысал үзінді"
        # Online/offline prompt section headers — KB-only structure gate must omit them.
        forbidden = ("Құран негізі", "хадис бөлімі", "Google Search", "Тірек үзінділер")
        for prompt in ADVERSARIAL_PROMPTS:
            p = ap._prompt_with_retrieval(
                prompt,
                retrieved,
                allow_internet=False,
                quick=False,
            )
            self.assertIn("Fatua.kz", p, msg=prompt)
            self.assertIn("Muftyat.kz", p, msg=prompt)
            self.assertIn("Fatua.kz / Muftyat.kz үзінділері:", p, msg=prompt)
            for bad in forbidden:
                self.assertNotIn(bad, p, msg=f"{prompt!r} contains {bad!r}")

    @patch.object(ap, "fetch_qa_sources_context")
    @patch.object(ap, "build_retrieved_context")
    @patch.object(ap, "_append_islamic_kb_block")
    def test_kb_only_skips_faq_and_quran_blocks(
        self,
        mock_kb: MagicMock,
        mock_ctx: MagicMock,
        mock_faq: MagicMock,
    ) -> None:
        os.environ["RAQAT_AI_KB_ONLY"] = "1"
        mock_kb.return_value = ("KB excerpt", [{"site": "muftyat", "url": "https://muftyat.kz/y"}])
        with patch.object(ap, "_get_client", return_value=None):
            ap.generate_ai_reply_single_meta("Сұрақ")
        mock_ctx.assert_not_called()
        mock_faq.assert_not_called()
        mock_kb.assert_called_once()

    @patch.object(ap, "generate_ai_reply_staged")
    @patch.object(ap, "generate_ai_reply_single_meta")
    def test_kb_only_meta_skips_staged_pipeline(
        self,
        mock_single: MagicMock,
        mock_staged: MagicMock,
    ) -> None:
        os.environ["RAQAT_AI_KB_ONLY"] = "1"
        os.environ["RAQAT_AI_PIPELINE_STAGES"] = "1"
        mock_single.return_value = AiReplyResult(text="ok", sources=[])
        with patch.object(ap, "_get_client", return_value=object()):
            out = ap.generate_ai_reply_meta("Сұрақ", use_staged_pipeline=True)
        mock_staged.assert_not_called()
        mock_single.assert_called_once()
        self.assertEqual(out.text, "ok")

    @patch.object(ap, "generate_ai_reply_staged")
    @patch.object(ap, "generate_ai_reply_single_meta")
    def test_request_kb_only_meta_skips_staged_pipeline(
        self,
        mock_single: MagicMock,
        mock_staged: MagicMock,
    ) -> None:
        os.environ.pop("RAQAT_AI_KB_ONLY", None)
        mock_single.return_value = AiReplyResult(text="ok", sources=[])
        with patch.object(ap, "_get_client", return_value=object()):
            out = ap.generate_ai_reply_meta("Сұрақ", use_staged_pipeline=True, kb_only=True)
        mock_staged.assert_not_called()
        mock_single.assert_called_once()
        self.assertEqual(out.text, "ok")

    @patch.object(ap, "_append_islamic_kb_block")
    def test_kb_only_sources_are_kb_sites_only(self, mock_kb: MagicMock) -> None:
        os.environ["RAQAT_AI_KB_ONLY"] = "1"
        mock_kb.return_value = (
            "URL: https://fatua.kz/x\nМәтін",
            [
                {"site": "fatua", "url": "https://fatua.kz/x"},
                {"site": "muftyat", "url": "https://muftyat.kz/y"},
            ],
        )
        with patch.object(ap, "_get_client", return_value=None):
            r = ap.generate_ai_reply_single_meta("Сұрақ")
        sites = {s.get("site") for s in r.sources}
        self.assertTrue(sites <= {"fatua", "muftyat"})
        self.assertNotIn("quran", sites)
        self.assertNotIn("hadith", sites)

    def test_fast_llm_config_no_search_when_kb_only(self) -> None:
        os.environ["RAQAT_AI_KB_ONLY"] = "1"
        os.environ["RAQAT_AI_ENABLE_GOOGLE_SEARCH"] = "1"
        if ap.genai_types is None:
            self.skipTest("google.genai.types not installed")
        cfg = ap._fast_llm_config(with_search_tool=True, thinking_budget=0)
        self.assertIsNotNone(cfg)
        tools = getattr(cfg, "tools", None)
        self.assertTrue(tools is None or len(tools) == 0)


if __name__ == "__main__":
    unittest.main()
