import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from bukhari_pdf_parse import looks_like_kazakh, parse_volume, parse_text, HADITH_START_RELAXED  # noqa: E402
P1 = Path(r"c:\Users\Жасулан\Downloads\Sakhikh__1241_l-b_1201_khari_I_Khadis_ilimi.pdf")


def test_vol1_parses_hadith_one_with_niyyah():
    if not P1.is_file():
        return
    h = parse_volume(P1)
    assert 1 in h
    assert looks_like_kazakh(h[1])
    assert "ниет" in h[1].lower() or "ниетке" in h[1].lower()


def test_vol1_covers_up_to_832():
    if not P1.is_file():
        return
    h = parse_volume(P1)
    assert max(h) >= 800
    assert len(h) >= 500


def test_hadith_start_allows_midline_ocr_markers():
    text = 'garbage 241- Айша анамыз (р.а.) риуаят етті: «Пайғамбарымыз (с.ғ.с.) түнде намаз оқитын еді.»'
    m = HADITH_START_RELAXED.search(text)
    assert m is not None
    assert m.group(1) == "241"