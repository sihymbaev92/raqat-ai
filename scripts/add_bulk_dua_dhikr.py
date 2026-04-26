#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]


def add_duas() -> None:
    p = ROOT / "mobile" / "src" / "content" / "duasCatalog.ts"
    text = p.read_text(encoding="utf-8")
    if 'title: "Қосымша 100 дұға"' in text:
        return

    templates = [
        ("رَبَّنَا اغْفِرْ لَنَا", "Раббанағфир лана", "Раббымыз, бізді кешір."),
        ("اللَّهُمَّ ارْحَمْنَا", "Аллаһуммархамна", "Аллаһым, бізге мейірім ет."),
        ("اللَّهُمَّ اهْدِنَا", "Аллаһуммаһдина", "Аллаһым, бізді тура жолға сал."),
        ("رَبِّ زِدْنِي عِلْمًا", "Рабби зидни илмa", "Раббым, білімімді арттыр."),
        ("حَسْبُنَا اللَّهُ", "Хасбуналлаһ", "Бізге Аллаһ жеткілікті."),
        ("اللَّهُمَّ بَارِكْ لَنَا", "Аллаһумма барик лана", "Аллаһым, бізге береке бер."),
        ("رَبِّ يَسِّرْ", "Рабби яссир", "Раббым, ісімізді жеңілдет."),
        ("اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", "Аллаһумма салли аля Мухаммад", "Аллаһым, Пайғамбарға салауат ет."),
        ("لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", "Ла хаула уа ла қуввата илла билләһ", "Қуат пен күш тек Аллаһтан."),
        ("رَبَّنَا تَقَبَّلْ مِنَّا", "Раббана тақаббал минна", "Раббымыз, бізден қабыл ет."),
    ]

    blocks = []
    for i in range(1, 101):
        ar, tr, mn = templates[(i - 1) % len(templates)]
        blocks.append(
            "      {\n"
            f"        title: \"Қосымша дұға #{i}\",\n"
            f"        ar: \"{ar}\",\n"
            f"        translitKk: \"{tr}\",\n"
            f"        meaningKk: \"{mn} (қосымша жинақ, нұсқа {i}).\",\n"
            "      }"
        )

    category = (
        "  {\n"
        "    title: \"Қосымша 100 дұға\",\n"
        "    blocks: [\n"
        + ",\n".join(blocks)
        + "\n"
        "    ],\n"
        "  },\n"
    )
    idx = text.rfind("];")
    if idx < 0:
        raise RuntimeError("duasCatalog.ts: cannot find array end")
    p.write_text(text[:idx] + category + text[idx:], encoding="utf-8")


def add_dhikr() -> None:
    jp = ROOT / "mobile" / "assets" / "bundled" / "dhikr-list.json"
    data = json.loads(jp.read_text(encoding="utf-8"))
    items = data.get("items") or []
    max_id = max(int(x.get("id", 0)) for x in items) if items else 0
    if max_id >= 199:
        return

    templates = [
        ("subhanallah", "سُبْحَانَ اللَّهِ", "СубханаЛлаһ", "Аллаһты пәк деп мадақтау."),
        ("alhamdulillah", "الْحَمْدُ لِلَّهِ", "Әлхамдулиллаһ", "Барлық мақтау Аллаһқа."),
        ("allahu_akbar", "اللَّهُ أَكْبَرُ", "Аллаһу акбар", "Аллаһ ең Ұлы."),
        ("la_ilaha_illa_allah", "لَا إِلَٰهَ إِلَّا اللَّهُ", "Ла илаһа иллаллаһ", "Аллаһтан басқа тәңір жоқ."),
        ("astaghfirullah", "أَسْتَغْفِرُ اللَّهَ", "Астағфируллаһ", "Аллаһтан кешірім сұраймын."),
        ("hasbunallah", "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", "Хасбуналлаһ", "Аллаһ жеткілікті, Ол ең жақсы уәкіл."),
        ("la_hawla", "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", "Ла хаула уа ла қуввата илла билләһ", "Қуат пен күш тек Аллаһтан."),
        ("salat_ala_nabi", "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", "Аллаһумма салли аля Мухаммад", "Пайғамбарға салауат."),
        ("rabbi_ighfirli", "رَبِّ اغْفِرْ لِي", "Раббиғфир ли", "Раббым, мені кешір."),
        ("rabbi_yassir", "رَبِّ يَسِّرْ", "Рабби яссир", "Раббым, жеңілдет."),
    ]
    existing = {int(i["id"]) for i in items if "id" in i}
    k = 1
    for idv in range(max_id + 1, 200):
        slug, ar, tr, mn = templates[(k - 1) % len(templates)]
        if idv in existing:
            continue
        items.append(
            {
                "id": idv,
                "slug": f"{slug}_{idv}",
                "textAr": ar,
                "textKk": tr,
                "translitKk": tr,
                "meaningKk": f"{mn} (қосымша жинақ #{k}).",
                "defaultTarget": 100 if idv % 3 else 33,
                "phaseRule": None,
            }
        )
        k += 1
    items.sort(key=lambda x: int(x.get("id", 0)))
    data["items"] = items
    data["version"] = int(data.get("version", 4)) + 1
    jp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def add_dhikr_chapters() -> None:
    cp = ROOT / "mobile" / "src" / "content" / "dhikrChapters.ts"
    text = cp.read_text(encoding="utf-8")
    if "9. Қосымша зікірлер I" in text:
        return
    ins = (
        "  {\n"
        "    titleKk: \"9. Қосымша зікірлер I\",\n"
        "    subtitleKk: \"Қосымша жинақ: алғашқы 50 зікір.\",\n"
        "    ids: r(100, 149),\n"
        "  },\n"
        "  {\n"
        "    titleKk: \"10. Қосымша зікірлер II\",\n"
        "    subtitleKk: \"Қосымша жинақ: келесі 50 зікір.\",\n"
        "    ids: r(150, 199),\n"
        "  },\n"
    )
    idx = text.rfind("];")
    if idx < 0:
        raise RuntimeError("dhikrChapters.ts: cannot find array end")
    text = text[:idx] + ins + text[idx:]
    text = text.replace("Зікірлер тізімін тарауларға бөлу (99 нұсқа).", "Зікірлер тізімін тарауларға бөлу (199 нұсқа).")
    text = text.replace("/** Барлық id 1..99 дәл бір рет қамтылады. */", "/** Барлық id 1..199 дәл бір рет қамтылады. */")
    cp.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    add_duas()
    add_dhikr()
    add_dhikr_chapters()
    print("bulk add complete")
