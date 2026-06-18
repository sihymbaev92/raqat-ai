# -*- coding: utf-8 -*-
from __future__ import annotations

from io import BytesIO
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from image_proxy_routes import (  # noqa: E402
    clear_image_proxy_cache,
    fetch_resized_image,
    normalize_proxy_width,
    validate_image_proxy_url,
)


def test_validate_image_proxy_url_allowlist():
    url = "https://halaldamu.kz/wp-content/uploads/2026/06/product.png"
    assert validate_image_proxy_url(url) == url
    with pytest.raises(ValueError, match="https_required"):
        validate_image_proxy_url("http://halaldamu.kz/wp-content/uploads/x.png")
    with pytest.raises(ValueError, match="host_not_allowed"):
        validate_image_proxy_url("https://example.com/wp-content/uploads/x.png")
    with pytest.raises(ValueError, match="path_not_allowed"):
        validate_image_proxy_url("https://halaldamu.kz/not-uploads/x.png")


def test_normalize_proxy_width_clamps_bounds():
    assert normalize_proxy_width(1) == 64
    assert normalize_proxy_width(300) == 300
    assert normalize_proxy_width(2000) == 640


def test_fetch_resized_image_caches_successful_response():
    Image = pytest.importorskip("PIL.Image")
    clear_image_proxy_cache()

    src = Image.new("RGB", (800, 400), "blue")
    raw = BytesIO()
    src.save(raw, format="JPEG")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.headers = {"content-type": "image/jpeg"}
    mock_resp.content = raw.getvalue()

    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.return_value = mock_resp

    url = "https://halaldamu.kz/wp-content/uploads/2026/06/product.jpg"
    with patch("image_proxy_routes.httpx.Client", return_value=mock_client):
        body1, media1, cache1 = fetch_resized_image(url, 300)
        body2, media2, cache2 = fetch_resized_image(url, 300)

    assert media1 == "image/jpeg"
    assert media2 == "image/jpeg"
    assert cache1 == "miss"
    assert cache2 == "hit"
    assert body1 == body2
    assert len(body1) < len(raw.getvalue())
    assert mock_client.get.call_count == 1
