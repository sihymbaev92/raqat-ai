#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

WIDTH = 1400
HEIGHT = 1800
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "prayer"

BG = "#F7F0E3"
INK = "#18392B"
MUTED = "#5D6C65"
CARD = "#FFF9EF"
ACCENT = "#B78A38"
TEAL = "#4F7E76"
ROSE = "#A25E49"
OLIVE = "#6B7A42"


def _escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", r"\'")


def _font_path() -> str:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return path
    raise SystemExit("Font file not found for prayer asset generation.")


FONT = _font_path()


def _write_text(tmpdir: Path, name: str, text: str) -> Path:
    path = tmpdir / f"{name}.txt"
    path.write_text(text, encoding="utf-8")
    return path


def _draw_box(filters: list[str], *, x: int, y: int, w: int, h: int, color: str) -> None:
    filters.append(f"drawbox=x={x}:y={y}:w={w}:h={h}:color={color}:t=fill")


def _draw_text(
    filters: list[str],
    tmpdir: Path,
    *,
    name: str,
    text: str,
    x: int,
    y: int,
    size: int,
    color: str,
    line_spacing: int = 10,
) -> None:
    text_path = _write_text(tmpdir, name, text)
    filters.append(
        "drawtext="
        f"fontfile='{_escape(FONT)}':"
        f"textfile='{_escape(str(text_path))}':"
        f"fontcolor={color}:fontsize={size}:"
        f"line_spacing={line_spacing}:x={x}:y={y}"
    )


def _header(
    filters: list[str],
    tmpdir: Path,
    *,
    slug: str,
    title: str,
    subtitle: str,
    accent: str,
) -> None:
    _draw_box(filters, x=72, y=72, w=1256, h=182, color=INK)
    _draw_box(filters, x=72, y=238, w=1256, h=10, color=accent)
    _draw_text(filters, tmpdir, name=f"{slug}_title", text=title, x=112, y=108, size=68, color=BG, line_spacing=8)
    _draw_text(filters, tmpdir, name=f"{slug}_subtitle", text=subtitle, x=114, y=186, size=26, color="#E8DCC3", line_spacing=8)


def _card(
    filters: list[str],
    tmpdir: Path,
    *,
    slug: str,
    idx: str,
    title: str,
    body: str,
    x: int,
    y: int,
    w: int,
    h: int,
    accent: str,
) -> None:
    _draw_box(filters, x=x, y=y, w=w, h=h, color=CARD)
    _draw_box(filters, x=x + 18, y=y + 18, w=18, h=h - 36, color=accent)
    _draw_text(filters, tmpdir, name=f"{slug}_{idx}_num", text=idx, x=x + 56, y=y + 18, size=58, color=accent, line_spacing=6)
    _draw_text(filters, tmpdir, name=f"{slug}_{idx}_title", text=title, x=x + 126, y=y + 26, size=40, color=INK, line_spacing=8)
    _draw_text(filters, tmpdir, name=f"{slug}_{idx}_body", text=body, x=x + 126, y=y + 88, size=24, color=MUTED, line_spacing=8)


def _footer(
    filters: list[str],
    tmpdir: Path,
    *,
    slug: str,
    text: str,
    accent: str,
) -> None:
    _draw_box(filters, x=72, y=1520, w=1256, h=190, color=INK)
    _draw_box(filters, x=72, y=1520, w=22, h=190, color=accent)
    _draw_text(filters, tmpdir, name=f"{slug}_footer", text=text, x=120, y=1572, size=28, color=BG, line_spacing=10)


def _build_wudu(filters: list[str], tmpdir: Path) -> None:
    _header(
        filters,
        tmpdir,
        slug="wudu",
        title="ДӘРЕТ ҚАДАМДАРЫ",
        subtitle="Жаттауға ыңғайлы қысқа рет. Әуелі ниет, соңында дұға.",
        accent=ACCENT,
    )
    cards = [
        ("1", "Ниет және бисмилла", "Жүрекпен ниет етіп,\n«Бисмиллә» деп бастаңыз.", 72, 340, ACCENT),
        ("2", "Қолды жуу", "Екі қолды білезікке дейін\nүш реттен жуыңыз.", 728, 340, TEAL),
        ("3", "Ауыз бен мұрын", "Ауызды шайып, мұрынға\nсу тартып, тазалаңыз.", 72, 546, ROSE),
        ("4", "Бетті жуу", "Бетті маңдайдан иекке,\nекі құлақ арасына дейін жуыңыз.", 728, 546, OLIVE),
        ("5", "Қолдар шынтаққа дейін", "Оң қолдан бастап,\nекі қолды шынтақпен қоса жуыңыз.", 72, 752, TEAL),
        ("6", "Басқа мәсіх", "Суланған қолмен бастың\nбір бөлігіне мәсіх жасаңыз.", 728, 752, ACCENT),
        ("7", "Аяқтарды жуу", "Екі аяқты тобықпен қоса,\nсаусақ араларын жеткізіп жуыңыз.", 72, 958, ROSE),
    ]
    for idx, title, body, x, y, accent in cards:
        _card(filters, tmpdir, slug="wudu", idx=idx, title=title, body=body, x=x, y=y, w=600, h=170, accent=accent)
    _draw_box(filters, x=728, y=958, w=600, h=170, color="#EFE4CE")
    _draw_text(
        filters,
        tmpdir,
        name="wudu_mem",
        text="Жеңіл есте сақтау:\nҚол → ауыз/мұрын → бет → қолдар →\nбасқа мәсіх → аяқтар",
        x=774,
        y=1000,
        size=28,
        color=INK,
        line_spacing=10,
    )
    _footer(
        filters,
        tmpdir,
        slug="wudu",
        text="Парыздары: бет, екі қол, басқа мәсіх, екі аяқ.\nСүннеттері: ниет, бисмилла, оң жақтан бастау, үш рет жуу.",
        accent=ACCENT,
    )


def _build_salah(filters: list[str], tmpdir: Path) -> None:
    _header(
        filters,
        tmpdir,
        slug="salah",
        title="НАМАЗ ҚАЛЫПТАРЫ",
        subtitle="Екі ракағат үлгісі бойынша негізгі қимыл реті.",
        accent=TEAL,
    )
    cards = [
        ("1", "Тәкбір", "Қолды көтеріп,\nнамазға кіріңіз.", 72, 360, ACCENT),
        ("2", "Қиям", "Тік тұрып, Фатиха\nжәне сүре оқылады.", 728, 360, ROSE),
        ("3", "Рукуғ", "Арқа түзу болып,\nиілу қалпы жасалады.", 72, 670, TEAL),
        ("4", "Сәжде", "Маңдай, мұрын, екі қол,\nекі тізе, аяқ саусақтары жерге тиеді.", 728, 670, OLIVE),
        ("5", "Отырыc", "Екі сәжденің арасында\nқысқа отырыс болады.", 72, 980, ROSE),
        ("6", "Сәлем", "Соңғы отырыстан кейін\nоңға және солға сәлем беріледі.", 728, 980, ACCENT),
    ]
    for idx, title, body, x, y, accent in cards:
        _card(filters, tmpdir, slug="salah", idx=idx, title=title, body=body, x=x, y=y, w=600, h=250, accent=accent)
    _footer(
        filters,
        tmpdir,
        slug="salah",
        text="Рет: ниет → тәкбір → қиям → рукуғ → сәжде →\nекінші ракағат → соңғы отырыс → сәлем.",
        accent=TEAL,
    )


def _build_men(filters: list[str], tmpdir: Path) -> None:
    _header(
        filters,
        tmpdir,
        slug="men_prayer",
        title="ЕР КІСІ НАМАЗЫ",
        subtitle="Парыз негізі ортақ. Практикада назар аударатын тұстар.",
        accent=ROSE,
    )
    cards = [
        ("1", "Ауратты жабу", "Кіндік пен тізе арасы\nміндетті түрде жабылады.", 72, 360, ROSE),
        ("2", "Жамағат әдебі", "Сапты түзу ұстау,\nимамға ілесу маңызды.", 728, 360, TEAL),
        ("3", "Қырағатты бекіту", "Фатиха, қысқа сүре,\nрукуғ-сәжде дұғаларын жаттау.", 72, 626, ACCENT),
        ("4", "Уақыт пен ниет", "Әр намазды өз уақытында,\nниетпен оқу керек.", 728, 626, OLIVE),
        ("5", "Қате болса", "Артық-кемдік болса,\nсәһу сәжде үкімін біліңіз.", 72, 892, TEAL),
        ("6", "Жұма және мешіт", "Жұма намазы мен\nмешіт жамағаты жайын үйреніңіз.", 728, 892, ROSE),
    ]
    for idx, title, body, x, y, accent in cards:
        _card(filters, tmpdir, slug="men_prayer", idx=idx, title=title, body=body, x=x, y=y, w=600, h=210, accent=accent)
    _footer(
        filters,
        tmpdir,
        slug="men_prayer",
        text="Кеңес: алдымен қимыл ретін, сосын оқылатын дұғаларды,\nодан кейін жамағат әдебін бекітіңіз.",
        accent=ROSE,
    )


def _build_women(filters: list[str], tmpdir: Path) -> None:
    _header(
        filters,
        tmpdir,
        slug="women_prayer",
        title="ӘЙЕЛ КІСІ НАМАЗЫ",
        subtitle="Парыз негізі бірдей. Киім, жабын және тазалыққа мән беріледі.",
        accent=OLIVE,
    )
    cards = [
        ("1", "Киім мен жабын", "Денені толық жабатын,\nтаза әрі ыңғайлы киім таңдаңыз.", 72, 360, OLIVE),
        ("2", "Жинақы оқу", "Қимылдарды байсалды,\nжинақы түрде орындаңыз.", 728, 360, ROSE),
        ("3", "Тазалық үкімдері", "Хайыз, нифас, ғұсыл,\nдәрет мәселесін айқын біліңіз.", 72, 626, ACCENT),
        ("4", "Үйде үйрену", "Алдымен тыныш жерде,\nмәтін мен қимылды бірге пысықтаңыз.", 728, 626, TEAL),
        ("5", "Қысқа сүрелер", "Фатиха мен қысқа сүрелерден\nбастап жаттау жеңіл болады.", 72, 892, ROSE),
        ("6", "Мәзһабпен растау", "Ұсақ айырмашылықтарды\nсенімді ұстазбен нақтылаңыз.", 728, 892, OLIVE),
    ]
    for idx, title, body, x, y, accent in cards:
        _card(filters, tmpdir, slug="women_prayer", idx=idx, title=title, body=body, x=x, y=y, w=600, h=210, accent=accent)
    _footer(
        filters,
        tmpdir,
        slug="women_prayer",
        text="Кеңес: қимыл реті, оқылатын сүрелер, киім әдебі және тазалық\nүкімдері бірге берілсе үйрену жеңілдейді.",
        accent=OLIVE,
    )


def _render_png(filename: str, builder) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="prayer_assets_") as tmp:
        tmpdir = Path(tmp)
        filters: list[str] = []
        builder(filters, tmpdir)
        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c={BG}:s={WIDTH}x{HEIGHT}",
            "-frames:v",
            "1",
            "-vf",
            ",".join(filters),
            str(OUT_DIR / filename),
        ]
        subprocess.run(cmd, check=True)


def main() -> None:
    if shutil.which("ffmpeg") is None:
        raise SystemExit("ffmpeg is required to generate prayer assets.")

    _render_png("wudu.png", _build_wudu)
    _render_png("salah.png", _build_salah)
    _render_png("men_prayer.png", _build_men)
    _render_png("women_prayer.png", _build_women)
    print(f"Generated prayer assets in {OUT_DIR}")


if __name__ == "__main__":
    main()
