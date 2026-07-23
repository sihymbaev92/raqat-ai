#!/usr/bin/env python3
"""
Open Food Facts additives + кеңейтілген үкім/алиас қабаты →
  data/halal_additives_seed.csv
  mobile/assets/bundled/halal-additives-seed.json

Usage:
  python scripts/build_halal_additives_seed.py
  npm run halal:additives:build --prefix mobile
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "halal_additives_seed.csv"
JSON_PATH = ROOT / "mobile" / "assets" / "bundled" / "halal-additives-seed.json"
OFF_ADDITIVES_URL = "https://static.openfoodfacts.org/data/taxonomies/additives.json"
UA = "Raqat-Halal-Additives/1.1 (+https://rahatomir.com)"

FIELDNAMES = ["code", "title_kk", "aliases", "risk", "note_kk"]

# Анық харам (көп мәзһаб / сертификат органдары)
HARAM_CODES: dict[str, tuple[str, str]] = {
    "e120": (
        "E120 — Кармин (кошениль)",
        "carmine|cochineal|кармин|кошениль|carmines|carminic acid|natural red 4|ci 75470|кошениль",
    ),
    "e441": (
        "E441 — Желатин",
        "gelatin|gelatine|желатин|jelatin|pork gelatin|свиной желатин",
    ),
    "e542": (
        "E542 — Сүйек фосфаты",
        "bone phosphate|edible bone phosphate|костный фосфат",
    ),
    "e904": (
        "E904 — Шеллак",
        "shellac|шеллак|confectioner's glaze|lac resin",
    ),
}

# Күдікті — тегі/сертификат керек
MUSHKIL_CODES: dict[str, tuple[str, str]] = {
    "e322": ("E322 — Лецитин", "lecithin|лецитин|soya lecithin|soy lecithin|E322i"),
    "e322i": ("E322i — Лецитин", "lecithin"),
    "e422": ("E422 — Глицерин", "glycerin|glycerol|глицерин|glycerine"),
    "e430": ("E430 — Полиоксиэтилен(8) стеарат", "polyoxyethylene stearate"),
    "e431": ("E431 — Полиоксиэтилен(40) стеарат", ""),
    "e432": ("E432 — Полисорбат 20", "polysorbate 20|tween 20"),
    "e433": ("E433 — Полисорбат 80", "polysorbate 80|tween 80"),
    "e434": ("E434 — Полисорбат 40", "polysorbate 40"),
    "e435": ("E435 — Полисорбат 60", "polysorbate 60"),
    "e436": ("E436 — Полисорбат 65", "polysorbate 65"),
    "e470": ("E470 — Май қышқылдарының тұздары", "fatty acid salts|соли жирных кислот"),
    "e470a": ("E470a — Na/K/Ca май қышқылы тұздары", ""),
    "e470b": ("E470b — Магний май қышқылы тұздары", ""),
    "e471": ("E471 — Моно- және диглицеридтер", "mono and diglycerides|моноглицериды|диглицериды|MDG"),
    "e472": ("E472 — Май қышқылы эфирлері (топ)", ""),
    "e472a": ("E472a — Сірке қышқылы эфирлері", "acetic acid esters"),
    "e472b": ("E472b — Сүт қышқылы эфирлері", "lactic acid esters"),
    "e472c": ("E472c — Лимон қышқылы эфирлері", "citric acid esters"),
    "e472d": ("E472d — Шарап қышқылы эфирлері", "tartaric acid esters"),
    "e472e": ("E472e — Диацетилвинді эфирлер", "DATEM"),
    "e472f": ("E472f — Аралас сірке/шарап эфирлері", ""),
    "e473": ("E473 — Сахароза май қышқылы эфирлері", "sucrose esters"),
    "e474": ("E474 — Сахароглицеридтер", "sucroglycerides"),
    "e475": ("E475 — Полиглицерин май қышқылы эфирлері", ""),
    "e476": ("E476 — PGPR", "pgpr|polyglycerol polyricinoleate"),
    "e477": ("E477 — Пропиленгликоль май қышқылы эфирлері", ""),
    "e478": ("E478 — Лактатталған май қышқылы эфирлері", ""),
    "e479b": ("E479b — Термиялық өңделген соя майы", ""),
    "e481": ("E481 — Натрий стеароил-2-лактилат", "sodium stearoyl lactylate|SSL"),
    "e482": ("E482 — Кальций стеароил-2-лактилат", "calcium stearoyl lactylate|CSL"),
    "e483": ("E483 — Стеарил тартрат", "stearyl tartrate"),
    "e484": ("E484 — Стеарил цитрат", "stearyl citrate"),
    "e485": ("E485 — Натрий стеароил фумарат", ""),
    "e491": ("E491 — Сорбитан моностеарат", "span 60|sorbitan monostearate"),
    "e492": ("E492 — Сорбитан тристеарат", "sorbitan tristearate"),
    "e493": ("E493 — Сорбитан монолаурат", "span 20"),
    "e494": ("E494 — Сорбитан моноолеат", "span 80"),
    "e495": ("E495 — Сорбитан монопальмитат", "span 40"),
    "e570": ("E570 — Стеарин қышқылы", "stearic acid|стеариновая кислота"),
    "e572": ("E572 — Магний стеараты", "magnesium stearate"),
    "e573": ("E573 — Алюминий стеараты", "aluminium stearate|aluminum stearate"),
    "e626": ("E626 — Гуанил қышқылы", "guanylic acid"),
    "e627": ("E627 — Динатрий гуанилат", "disodium guanylate|гуанилат"),
    "e628": ("E628 — Дикалий гуанилат", ""),
    "e629": ("E629 — Кальций гуанилат", ""),
    "e630": ("E630 — Инозин қышқылы", "inosinic acid"),
    "e631": ("E631 — Динатрий инозинат", "disodium inosinate|инозинат"),
    "e632": ("E632 — Дикалий инозинат", ""),
    "e633": ("E633 — Кальций инозинат", ""),
    "e634": ("E634 — Кальций 5'-рибонуклеотидтер", ""),
    "e635": ("E635 — Динатрий 5'-рибонуклеотидтер", "disodium ribonucleotides"),
    "e640": ("E640 — Глицин", "glycine|глицин"),
    "e920": ("E920 — L-цистеин", "l-cysteine|цистеин|cysteine"),
    "e921": ("E921 — L-цистеин гидрохлорид", "l-cysteine hydrochloride"),
    "e1105": ("E1105 — Лизоцим", "lysozyme|лизоцим"),
    "e1517": ("E1517 — Глиацетил", "glyceryl diacetate"),
    "e1518": ("E1518 — Триэтил цитрат / глицерил триацетат", "triacetin|glyceryl triacetate"),
    "e1519": ("E1519 — Бензил спирт", "benzyl alcohol|бензиловый спирт"),
}

# E-кодсыз жиі кездесетін құрам атаулары
NAMED_INGREDIENTS: list[dict[str, str]] = [
    {
        "code": "rennet",
        "risk": "MUSHKIL",
        "title_kk": "Реннет (ірімшік ферменті)",
        "aliases": "rennet|сычужный фермент|пепсин|pepsin|chymosin|химозин|микробиальный реннет",
        "note_kk": "Жануар немесе микробтық болуы мүмкін — халал сертификат тексерілсін.",
    },
    {
        "code": "lard",
        "risk": "HARAM",
        "title_kk": "Шошқа майы (lard)",
        "aliases": "lard|pork fat|свиной жир|шошқа майы|мантеқа де сердо",
        "note_kk": "Шошқа өнімі — харам.",
    },
    {
        "code": "pork",
        "risk": "HARAM",
        "title_kk": "Шошқа / шошқа өнімдері",
        "aliases": "pork|свинина|шошқа|bacon|хамон|jamon|prosciutto|pepperoni pork",
        "note_kk": "Шошқа — харам.",
    },
    {
        "code": "alcohol",
        "risk": "HARAM",
        "title_kk": "Этил спирті / алкоголь",
        "aliases": "alcohol|ethanol|ethyl alcohol|этанол|спирт|wine|beer|вино|пиво|ром|rum|brandy",
        "note_kk": "Ішімдік/этанол — харам (тағамдағы мөлшер бойынша үкім әртүрлі болуы мүмкін).",
    },
    {
        "code": "wine_vinegar_doubt",
        "risk": "MUSHKIL",
        "title_kk": "Шарап сіркесі",
        "aliases": "wine vinegar|винный уксус|шарап сіркесі",
        "note_kk": "Кей мәзһабта рұқсат, кейде күдікті — жергілікті үкімге қараңыз.",
    },
    {
        "code": "vanilla_extract",
        "risk": "MUSHKIL",
        "title_kk": "Ваниль экстракты",
        "aliases": "vanilla extract|экстракт ванили|ванильный экстракт",
        "note_kk": "Кейде спиртте ерітілген — құрамын тексеріңіз.",
    },
    {
        "code": "emulsifier",
        "risk": "MUSHKIL",
        "title_kk": "Эмульгатор (жалпы)",
        "aliases": "emulsifier|эмульгатор|эмульгаторы",
        "note_kk": "E471 тобындағылар сияқты тегі белгісіз болуы мүмкін.",
    },
    {
        "code": "animal_fat",
        "risk": "MUSHKIL",
        "title_kk": "Жануар майы",
        "aliases": "animal fat|животный жир|жануар майы|beef fat|tallow|говяжий жир",
        "note_kk": "Сойыс/сертификат тексерілсін; шошқа болса — харам.",
    },
    {
        "code": "whey",
        "risk": "MUSHKIL",
        "title_kk": "Сарысу (whey)",
        "aliases": "whey|сыворотка|сарысу|whey powder",
        "note_kk": "Реннетпен жасалған ірімшіден болуы мүмкін — тексеріңіз.",
    },
    {
        "code": "enzymes",
        "risk": "MUSHKIL",
        "title_kk": "Ферменттер (enzymes)",
        "aliases": "enzyme|enzymes|фермент|ферменты",
        "note_kk": "Микробтық немесе жануар текті — өндірушіні тексеріңіз.",
    },
    {
        "code": "mono_diglycerides",
        "risk": "MUSHKIL",
        "title_kk": "Моно- және диглицеридтер (атау)",
        "aliases": "mono- and diglycerides|monoglycerides|diglycerides|моно- и диглицериды",
        "note_kk": "Е471 тобы — тегі тексерілсін.",
    },
    {
        "code": "natural_flavour",
        "risk": "MUSHKIL",
        "title_kk": "Табиғи хош иіс",
        "aliases": "natural flavour|natural flavor|натуральный ароматизатор|табиғи хош иіс",
        "note_kk": "Кейде спирт/жануар текті еріткіш — өндірушіні сұраңыз.",
    },
]


def note_for_risk(risk: str) -> str:
    if risk == "HARAM":
        return "RAQAT анықтамасы: харам болуы ықтимал — ресми пәтуа емес."
    if risk == "MUSHKIL":
        return "RAQAT анықтамасы: күдікті — тегі/сертификат тексерілсін."
    return "RAQAT анықтамасы: жалпы каталог — құрамы мен өндірушіні тексеріңіз."


def normalize_code(raw: str) -> str | None:
    s = (raw or "").strip().lower()
    s = s.replace("en:", "").replace("xx:", "")
    s = s.replace("_", "").replace("-", "").replace(" ", "")
    if not s:
        return None
    if re.match(r"^e\d", s):
        return s
    if re.match(r"^\d", s):
        return "e" + s
    # named ingredient keys
    if re.match(r"^[a-z][a-z0-9_]{1,40}$", s):
        return s
    return None


def collect_name_aliases(names: dict) -> list[str]:
    out: list[str] = []
    for lang in ("en", "ru", "kk", "tr", "ar", "de", "fr", "uk", "pl"):
        val = names.get(lang)
        if isinstance(val, str) and val.strip():
            # "E471 - Something" → Something
            part = val.split(" - ", 1)
            label = part[1].strip() if len(part) == 2 else val.strip()
            if label and len(label) >= 2:
                out.append(label)
            out.append(val.strip())
    return out


def risk_from_off_obj(obj: dict, title: str) -> str | None:
    vegan = obj.get("vegan") if isinstance(obj.get("vegan"), dict) else {}
    vegetarian = obj.get("vegetarian") if isinstance(obj.get("vegetarian"), dict) else {}
    v = (vegan.get("en") or "").strip().lower()
    g = (vegetarian.get("en") or "").strip().lower()
    # OFF vegan=no ≠ fiqh харам; күдікті деп белгілейміз (қолмен HARAM қабаты басым)
    if v == "no" or g == "no" or v == "maybe" or g == "maybe":
        return "MUSHKIL"

    n = title.lower()
    if any(t in n for t in ("carmine", "cochineal", "кармин", "кошениль", "bone phosphate")):
        return "HARAM"
    if "желатин" in n or "gelatin" in n or "gelatine" in n:
        return "HARAM"
    if any(
        t in n
        for t in (
            "shellac",
            "шеллак",
            "cysteine",
            "цистеин",
            "stear",
            "стеар",
            "glycerin",
            "glycerol",
            "глицерин",
            "lecithin",
            "лецитин",
            "diglyceride",
            "monoglyceride",
            "моноглицер",
            "диглицер",
            "lysozyme",
            "лизоцим",
            "inosinate",
            "инозинат",
            "guanylate",
            "гуанилат",
            "polysorbate",
            "полисорбат",
            "sorbitan",
            "lactylate",
            "benzyl alcohol",
            "beeswax",
            "пчелиный воск",
            "lanolin",
            "ланолин",
        )
    ):
        return "MUSHKIL"
    return None


def merge_aliases(*groups: list[str] | str) -> str:
    seen: set[str] = set()
    out: list[str] = []
    for g in groups:
        parts = g.split("|") if isinstance(g, str) else list(g)
        for p in parts:
            a = re.sub(r"\s+", " ", (p or "").strip())
            if len(a) < 2:
                continue
            key = a.lower()
            if key in seen:
                continue
            seen.add(key)
            out.append(a)
            if len(out) >= 24:
                return "|".join(out)
    return "|".join(out)


def fetch_off_additives() -> dict:
    req = urllib.request.Request(OFF_ADDITIVES_URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build_rows(off: dict) -> list[dict[str, str]]:
    by_code: dict[str, dict[str, str]] = {}

    for key, obj in off.items():
        if not isinstance(key, str) or not isinstance(obj, dict):
            continue
        code = normalize_code(key)
        if not code or not code.startswith("e"):
            continue
        names = obj.get("name") if isinstance(obj.get("name"), dict) else {}
        title_src = (
            (names.get("ru") if isinstance(names.get("ru"), str) else None)
            or (names.get("en") if isinstance(names.get("en"), str) else None)
            or code.upper()
        )
        title_src = re.sub(r"\s+", " ", title_src.strip())[:160]
        aliases = merge_aliases(collect_name_aliases(names if isinstance(names, dict) else {}))
        # e_number field
        eno = obj.get("e_number")
        if isinstance(eno, dict) and isinstance(eno.get("en"), str):
            aliases = merge_aliases(aliases, eno["en"])
        guessed = risk_from_off_obj(obj, title_src)
        risk = guessed or "REFERENCE"
        by_code[code] = {
            "code": code,
            "title_kk": title_src,
            "aliases": aliases,
            "risk": risk,
            "note_kk": note_for_risk(risk),
        }

    for code, (title, aliases) in HARAM_CODES.items():
        c = normalize_code(code)
        if not c:
            continue
        prev = by_code.get(c, {})
        by_code[c] = {
            "code": c,
            "title_kk": title,
            "aliases": merge_aliases(aliases, prev.get("aliases", "")),
            "risk": "HARAM",
            "note_kk": note_for_risk("HARAM")
            if c != "e120"
            else "Жәндіктен алынатын қызыл бояу — әдетте харам деп саналады.",
        }
        if c == "e441":
            by_code[c]["note_kk"] = (
                "Жануар (жиі шошқа) текті желатин — сертификатсыз харам деп есептеледі."
            )
        if c == "e904":
            by_code[c]["note_kk"] = (
                "Жәндік шырыны (лак) — Ханафи/көп ғалымдарда тыйымды немесе күшті күдікті."
            )

    for code, (title, aliases) in MUSHKIL_CODES.items():
        c = normalize_code(code)
        if not c:
            continue
        prev = by_code.get(c, {})
        # curated HARAM басым
        if prev.get("risk") == "HARAM":
            continue
        by_code[c] = {
            "code": c,
            "title_kk": title,
            "aliases": merge_aliases(aliases, prev.get("aliases", "")),
            "risk": "MUSHKIL",
            "note_kk": note_for_risk("MUSHKIL"),
        }

    for named in NAMED_INGREDIENTS:
        c = normalize_code(named["code"])
        if not c:
            continue
        by_code[c] = {
            "code": c,
            "title_kk": named["title_kk"],
            "aliases": named.get("aliases") or "",
            "risk": named["risk"],
            "note_kk": named.get("note_kk") or note_for_risk(named["risk"]),
        }

    rows = list(by_code.values())
    rows.sort(key=lambda r: ({"HARAM": 0, "MUSHKIL": 1, "REFERENCE": 2}.get(r["risk"], 9), r["code"]))
    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDNAMES, lineterminator="\n")
        w.writeheader()
        for row in rows:
            w.writerow({k: row.get(k, "") for k in FIELDNAMES})


def write_json(path: Path, rows: list[dict[str, str]]) -> None:
    items = []
    for i, row in enumerate(rows, start=1):
        aliases = [a.strip() for a in (row.get("aliases") or "").split("|") if a.strip()]
        items.append(
            {
                "id": i,
                "code": row["code"],
                "title": row["title_kk"],
                "aliases": aliases,
                "risk": row["risk"],
                "description": row.get("note_kk") or note_for_risk(row["risk"]),
            }
        )
    payload = {
        "version": 2,
        "updated": date.today().isoformat(),
        "source": "open_food_facts_additives + raqat_curated_v2",
        "disclaimer": "RAQAT уақытша E-код/құрам анықтамасы — ресми пәтуа/halaldamu additives емес.",
        "items": items,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Build RAQAT halal additives (E-code) seed")
    ap.add_argument("--csv", type=Path, default=CSV_PATH)
    ap.add_argument("--out", type=Path, default=JSON_PATH)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print("fetching Open Food Facts additives…", flush=True)
    off = fetch_off_additives()
    rows = build_rows(off)
    risk_counts: dict[str, int] = {}
    for r in rows:
        risk_counts[r["risk"]] = risk_counts.get(r["risk"], 0) + 1
    alias_avg = sum(len((r.get("aliases") or "").split("|")) for r in rows if r.get("aliases")) / max(
        1, sum(1 for r in rows if r.get("aliases"))
    )
    print(f"rows={len(rows)} risks={risk_counts} avg_aliases≈{alias_avg:.1f}", flush=True)
    if args.dry_run:
        return 0
    write_csv(args.csv, rows)
    write_json(args.out, rows)
    kb = args.out.stat().st_size / 1024
    print(f"wrote {args.csv}", flush=True)
    print(f"wrote {args.out} ({kb:.0f} KB)", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
