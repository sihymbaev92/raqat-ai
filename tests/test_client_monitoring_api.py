import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from main import app  # noqa: E402


client = TestClient(app)


def test_client_error_report_accepts_privacy_safe_payload():
    r = client.post(
        "/api/v1/client/errors",
        json={
            "kind": "render",
            "platform": "android",
            "appVersion": "1.0.9",
            "buildNumber": "9",
            "errorName": "TypeError",
            "message": "Cannot read property x of undefined",
            "stack": "TypeError: Cannot read property x",
            "componentStack": "App > Screen",
            "route": "QuranSurah",
            "deviceModel": "Pixel 7",
        },
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_client_error_report_trims_large_payload():
    r = client.post(
        "/api/v1/client/errors",
        json={
            "platform": "web",
            "message": "x" * 5000,
            "stack": "s" * 5000,
        },
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True

