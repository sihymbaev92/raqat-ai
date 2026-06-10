# -*- coding: utf-8 -*-
from services.halal_service import analyze_halal_text


def test_empty_input():
    r = analyze_halal_text("   ")
    assert r["status"] == "empty"


def test_pork_detected_haram():
    r = analyze_halal_text("Contains bacon and salt")
    assert r["status"] == "haram"
    assert "bacon" in r["message"].lower() or "шошқа" in r["message"].lower()


def test_gelatin_doubtful():
    r = analyze_halal_text("Sugar, gelatin, water")
    assert r["status"] == "doubtful"


def test_plain_water_halal_possible():
    r = analyze_halal_text("water, salt")
    assert r["status"] == "halal_possible"


def test_russian_pork_adjective_haram():
    r = analyze_halal_text("свиной жир, соль")
    assert r["status"] == "haram"
    assert "свиной" in r["message"].lower()


def test_wine_vinegar_doubtful():
    r = analyze_halal_text("уксус винный, вода")
    assert r["status"] == "doubtful"
