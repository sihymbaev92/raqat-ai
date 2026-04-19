# -*- coding: utf-8 -*-
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRAYER_ASSETS_DIR = os.path.join(BASE_DIR, "assets", "prayer")
# .png бірінші — бір база атауымен eski .jpg пен жаңа қазақ инфографикасы қатар болса PNG таңдалады
SUPPORTED_IMAGE_EXTENSIONS = (".png", ".jpeg", ".jpg", ".webp")

PRAYER_VISUALS = {
    "visual_wudu": {
        "local_names": ("wudu", "visual_wudu", "daret"),
        "photo": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Wudu_%28Wuju%29..jpg",
        "source": "https://commons.wikimedia.org/wiki/File:Wudu_(Wuju)..jpg",
        "source_label": "Wikimedia Commons",
    },
    "wudu_men": {
        "local_names": ("wudu_er_kk", "wudu_men"),
        "photo": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Wudu_%28Wuju%29..jpg",
        "source": "https://commons.wikimedia.org/wiki/File:Wudu_(Wuju)..jpg",
        "source_label": "Wikimedia Commons",
    },
    "wudu_women": {
        "local_names": ("wudu_ayel_kk", "wudu_women"),
        "photo": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Wudu_%28Wuju%29..jpg",
        "source": "https://commons.wikimedia.org/wiki/File:Wudu_(Wuju)..jpg",
        "source_label": "Wikimedia Commons",
    },
    "visual_salah": {
        "local_names": ("namaz_er_ayel_kk", "namaz_2_rakaat", "visual_salah", "salah", "namaz"),
        "photo": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Salat_positions.jpg",
        "source": "https://commons.wikimedia.org/wiki/File:Salat_positions.jpg",
        "source_label": "Wikimedia Commons",
    },
    "salah_2rakat": {
        "local_names": ("namaz_er_ayel_kk", "namaz_2_rakaat", "visual_salah", "salah", "namaz"),
        "photo": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Salat_positions.jpg",
        "source": "https://commons.wikimedia.org/wiki/File:Salat_positions.jpg",
        "source_label": "Wikimedia Commons",
    },
    "men": {
        "local_names": ("namaz_er_ayel_kk", "namaz_2_rakaat", "men_prayer", "men", "visual_salah"),
        "photo": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Salat_positions.jpg",
        "source": "https://commons.wikimedia.org/wiki/File:Salat_positions.jpg",
        "source_label": "Wikimedia Commons",
    },
    "women": {
        "local_names": ("namaz_er_ayel_kk", "namaz_2_rakaat", "women_prayer", "women", "visual_salah"),
        "photo": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Salat_positions.jpg",
        "source": "https://commons.wikimedia.org/wiki/File:Salat_positions.jpg",
        "source_label": "Wikimedia Commons",
    },
}


def _find_local_prayer_asset(names: tuple[str, ...]) -> str | None:
    for base_name in names:
        for ext in SUPPORTED_IMAGE_EXTENSIONS:
            path = os.path.join(PRAYER_ASSETS_DIR, f"{base_name}{ext}")
            if os.path.exists(path):
                return path
    return None


def get_prayer_visual(section: str):
    visual = PRAYER_VISUALS.get(section)
    if not visual:
        return None

    resolved = dict(visual)
    local_path = _find_local_prayer_asset(tuple(resolved.get("local_names") or (section,)))
    resolved["path"] = local_path
    resolved["kind"] = "local" if local_path else "url"
    resolved["photo"] = local_path or resolved["photo"]
    return resolved


# Бір тарауға бірнеше сурет (қазақ инфографика: ер/әйел дәрет)
_MULTI_VISUAL_KEYS: dict[str, tuple[str, ...]] = {
    "wudu_visual": ("wudu_men", "wudu_women"),
    "visual_wudu": ("wudu_men", "wudu_women"),
    "purification": ("wudu_men", "wudu_women"),
}

_VISUAL_CAPTIONS_KK: dict[str, str] = {
    "wudu_men": "👨 Дәрет алу тәртібі — ер · қазақ инфографикасы",
    "wudu_women": "🧕 Дәрет алу тәртібі — әйел · қазақ инфографикасы",
    "visual_salah": "🕌 Намаз (ер/әйел) — қазақ инфографикасы",
    "salah_2rakat": "🕌 Екі рәкағат намаз — қазақ инфографикасы",
    "men": "🕌 Намаз — ер/әйел схемасы (бір инфографика)",
    "women": "🕌 Намаз — ер/әйел схемасы (бір инфографика)",
}


def iter_visual_payloads(section: str) -> list[dict[str, str]]:
    """
    Telegram-ға жіберу үшін суреттер тізімі.
    Әр элемент: kind=local|url, path немесе photo, caption (қысқа).
    """
    keys = _MULTI_VISUAL_KEYS.get(section, (section,))
    out: list[dict[str, str]] = []
    seen_paths: set[str] = set()
    for k in keys:
        v = get_prayer_visual(k)
        if not v:
            continue
        cap = _VISUAL_CAPTIONS_KK.get(k, "📎 Намаз / дәрет")
        if v["kind"] == "local" and v.get("path"):
            p = str(v["path"])
            if p in seen_paths:
                continue
            seen_paths.add(p)
            out.append({"kind": "local", "path": p, "caption": cap})
        elif str(v.get("photo", "")).startswith("http"):
            out.append({"kind": "url", "photo": str(v["photo"]), "caption": cap})
    return out
