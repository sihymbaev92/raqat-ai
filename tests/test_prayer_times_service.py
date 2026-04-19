# -*- coding: utf-8 -*-
from unittest.mock import MagicMock, patch

from services.prayer_times_service import (
    _normalize_time,
    clear_prayer_times_cache,
    fetch_prayer_times_by_city,
)


def test_normalize_time_strips_suffix():
    assert _normalize_time("05:23 (PKT)") == "05:23"
    assert _normalize_time("12:00") == "12:00"


def test_fetch_returns_none_on_http_error():
    import requests

    clear_prayer_times_cache()
    with patch("services.prayer_times_service.requests.get") as g:
        g.side_effect = requests.ConnectionError("network")
        assert fetch_prayer_times_by_city("X", "Y") is None


def test_fetch_parses_aladhan_json():
    clear_prayer_times_cache()
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "data": {
            "timings": {
                "Fajr": "05:10 (PKT)",
                "Sunrise": "06:40",
                "Dhuhr": "12:15",
                "Asr": "15:30",
                "Maghrib": "18:00",
                "Isha": "19:30",
            },
            "date": {"readable": "11 Apr 2026"},
        }
    }
    with patch("services.prayer_times_service.requests.get", return_value=mock_resp):
        out = fetch_prayer_times_by_city("TestCity", "TestLand", method=3)

    assert out is not None
    assert out["city"] == "TestCity"
    assert out["country"] == "TestLand"
    assert out["Фаджр"] == "05:10"
    assert out["Бесін"] == "12:15"
    assert out["source"] == "Aladhan API"
    assert out["cache_status"] == "live"


def test_fetch_empty_city_returns_none():
    assert fetch_prayer_times_by_city("", "Kazakhstan") is None
    assert fetch_prayer_times_by_city("Almaty", "") is None


def test_fetch_uses_cache_within_ttl(monkeypatch):
    clear_prayer_times_cache()
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "data": {
            "timings": {
                "Fajr": "05:10",
                "Sunrise": "06:40",
                "Dhuhr": "12:15",
                "Asr": "15:30",
                "Maghrib": "18:00",
                "Isha": "19:30",
            },
            "date": {"readable": "11 Apr 2026"},
        }
    }

    clock = {"now": 1000.0}
    monkeypatch.setattr("services.prayer_times_service.time.time", lambda: clock["now"])

    with patch("services.prayer_times_service.requests.get", return_value=mock_resp) as get_mock:
        live = fetch_prayer_times_by_city("Shymkent", "Kazakhstan")
        cached = fetch_prayer_times_by_city("Shymkent", "Kazakhstan")

    assert live is not None
    assert cached is not None
    assert live["cache_status"] == "live"
    assert cached["cache_status"] == "cache"
    assert get_mock.call_count == 1


def test_fetch_returns_stale_cache_when_api_fails(monkeypatch):
    import requests

    clear_prayer_times_cache()
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "data": {
            "timings": {
                "Fajr": "05:10",
                "Sunrise": "06:40",
                "Dhuhr": "12:15",
                "Asr": "15:30",
                "Maghrib": "18:00",
                "Isha": "19:30",
            },
            "date": {"readable": "11 Apr 2026"},
        }
    }

    clock = {"now": 1000.0}
    monkeypatch.setattr("services.prayer_times_service.time.time", lambda: clock["now"])

    with patch("services.prayer_times_service.requests.get", return_value=mock_resp):
        live = fetch_prayer_times_by_city("Taraz", "Kazakhstan")

    clock["now"] += 3600

    with patch("services.prayer_times_service.requests.get") as get_mock:
        get_mock.side_effect = requests.ConnectionError("network")
        stale = fetch_prayer_times_by_city("Taraz", "Kazakhstan")

    assert live is not None
    assert stale is not None
    assert stale["cache_status"] == "stale"
    assert stale["Фаджр"] == live["Фаджр"]
