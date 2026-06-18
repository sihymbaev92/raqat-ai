# -*- coding: utf-8 -*-
from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from main import app  # noqa: E402

client = TestClient(app)


def test_weather_current_proxy_returns_normalized_payload():
    mock_resp = MagicMock()
    mock_resp.is_success = True
    mock_resp.json.return_value = {
        "current": {
            "time": "2026-06-11T18:30",
            "temperature_2m": 28.8,
            "weather_code": 0,
            "is_day": 1,
        }
    }
    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.return_value = mock_resp

    with patch("weather_routes.httpx.Client", return_value=mock_client):
        r = client.get("/api/v1/weather/current", params={"latitude": 42.34167, "longitude": 69.59028})

    assert r.status_code == 200, r.text
    assert r.json() == {
        "tempC": 28.8,
        "wmoCode": 0,
        "isDay": True,
        "observedAt": "2026-06-11T18:30",
        "source": "open-meteo",
    }
    assert "max-age=300" in r.headers.get("cache-control", "")


def test_weather_current_rejects_invalid_coords():
    r = client.get("/api/v1/weather/current", params={"latitude": 142, "longitude": 69.59028})
    assert r.status_code == 422
