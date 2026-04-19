# -*- coding: utf-8 -*-
from handlers.ai_chat import _extract_ai_prompt


def test_extract_prompt_strips_trigger_prefix_only():
    assert _extract_ai_prompt("Raqat, темекі харам ба?", state_trigger=False) == "темекі харам ба?"
    assert _extract_ai_prompt("рақат: дәрет қалай алынады?", state_trigger=False) == "дәрет қалай алынады?"


def test_extract_prompt_keeps_full_text_in_ai_state():
    assert _extract_ai_prompt("Темекі және оның үкімі", state_trigger=True) == "Темекі және оның үкімі"


def test_extract_prompt_returns_empty_for_blank_message():
    assert _extract_ai_prompt("   ", state_trigger=True) == ""
