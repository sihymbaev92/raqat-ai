# -*- coding: utf-8 -*-
import os
from pathlib import Path

from services.prayer_visuals import PRAYER_ASSETS_DIR, get_prayer_visual, iter_visual_payloads


def test_visual_uses_remote_url_when_local_asset_missing(monkeypatch):
    monkeypatch.setattr("services.prayer_visuals.os.path.exists", lambda path: False)
    visual = get_prayer_visual("visual_wudu")
    assert visual is not None
    assert visual["kind"] == "url"
    assert visual["photo"].startswith("https://")
    assert visual["path"] is None


def test_visual_prefers_local_asset(monkeypatch):
    fake_path = os.path.join(PRAYER_ASSETS_DIR, "wudu.png")
    monkeypatch.setattr(
        "services.prayer_visuals.os.path.exists",
        lambda path, target=fake_path: os.path.normcase(os.path.normpath(path))
        == os.path.normcase(os.path.normpath(target)),
    )

    visual = get_prayer_visual("visual_wudu")

    assert visual is not None
    assert visual["kind"] == "local"
    assert visual["path"] == fake_path
    assert visual["photo"] == fake_path


def test_wudu_men_visual_uses_local_asset_when_present(monkeypatch):
    fake_path = os.path.join(PRAYER_ASSETS_DIR, "wudu_men.png")
    monkeypatch.setattr(
        "services.prayer_visuals.os.path.exists",
        lambda path, target=fake_path: os.path.normcase(os.path.normpath(path))
        == os.path.normcase(os.path.normpath(target)),
    )

    visual = get_prayer_visual("wudu_men")

    assert visual is not None
    assert visual["kind"] == "local"
    assert visual["photo"] == fake_path


def test_iter_visual_payloads_multi_wudu(tmp_path, monkeypatch):
    """Ер/әйел дәреті екі жеке файл ретінде қайтылуы."""
    monkeypatch.setattr("services.prayer_visuals.BASE_DIR", str(tmp_path))
    monkeypatch.setattr("services.prayer_visuals.PRAYER_ASSETS_DIR", str(tmp_path / "assets" / "prayer"))
    assets = Path(tmp_path) / "assets" / "prayer"
    assets.mkdir(parents=True)
    (assets / "wudu_men.png").write_bytes(b"x")
    (assets / "wudu_women.png").write_bytes(b"y")

    items = iter_visual_payloads("purification")
    assert len(items) == 2
    assert all(i["kind"] == "local" for i in items)
    assert items[0]["path"].endswith("wudu_men.png")
    assert items[1]["path"].endswith("wudu_women.png")
