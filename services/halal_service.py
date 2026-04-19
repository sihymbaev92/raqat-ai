# -*- coding: utf-8 -*-
import re

HARAM_RULES = {
    "pork": "шошқа өнімі",
    "свинина": "шошқа өнімі",
    "шошқа": "шошқа өнімі",
    "bacon": "шошқа өнімі",
    "ham": "шошқа өнімі",
    "lard": "шошқа майы",
    "желатин свиной": "шошқа желатині",
    "pork gelatin": "шошқа желатині",
    "wine": "алкоголь",
    "beer": "алкоголь",
    "vodka": "алкоголь",
    "rum": "алкоголь",
    "whiskey": "алкоголь",
    "brandy": "алкоголь",
    "liqueur": "алкоголь",
    "ethanol": "этанол/алкоголь",
    "ethyl alcohol": "этил спирті",
    "спирт": "спирт",
    "алкоголь": "алкоголь",
    "вино": "алкоголь",
    "пиво": "алкоголь",
    "sake": "алкоголь",
    "mirin": "алкоголь",
    "cognac": "алкоголь",
    "champagne": "алкоголь",
    "e1510": "этил спирті (құрамда)",
    "blood": "қан құрамы",
    "қан": "қан",
    "carrion": "өлген жануар",
    "dog meat": "ит еті",
    "ит еті": "ит еті",
    "carnivore": "жыртқыш ет (күмән)",
}

DOUBTFUL_RULES = {
    "gelatin": "желатиннің тегі көрсетілмеген",
    "gelatine": "желатиннің тегі көрсетілмеген",
    "e441": "желатиннің тегі күмәнді",
    "e471": "моно- және диглицеридтердің тегі белгісіз",
    "e472": "эмульгатордың тегі белгісіз",
    "e476": "эмульгатор күмәнді",
    "mono- and diglycerides": "эмульгатордың тегі белгісіз",
    "monoglycerides": "эмульгатордың тегі белгісіз",
    "diglycerides": "эмульгатордың тегі белгісіз",
    "emulsifier": "эмульгатордың қайдан алынғаны белгісіз",
    "эмульгатор": "эмульгатордың қайдан алынғаны белгісіз",
    "enzyme": "ферменттің тегі көрсетілмеген",
    "фермент": "ферменттің тегі көрсетілмеген",
    "rennet": "мәйек ферменті күмәнді",
    "сычужный": "мәйек ферменті күмәнді",
    "flavor": "дәмдеуіш қоспасының құрамы толық емес",
    "flavour": "дәмдеуіш қоспасының құрамы толық емес",
    "ароматизатор": "қоспаның толық құрамы көрсетілмеген",
    "marshmallow": "желатин болуы мүмкін",
    "carmine": "бояғыштың тегі күмәнді",
    "cochineal": "бояғыштың тегі күмәнді",
    "e120": "бояғыштың шариғи үкімі күмәнді",
    "vanilla extract": "экстрактта алкоголь болуы мүмкін",
    "shellac": "E904 шеллақ — тегі нақтылануы керек",
    "e904": "шеллақ / құмар тегі",
    "isinglass": "балық желатині — тегі",
    "pepsin": "фермент тегі",
    "lipase": "фермент тегі",
    "shortening": "құрамдағы май тегі белгісіз",
    "margarine": "май мен эмульгатор тегі",
}

SAFE_HINTS = {
    "water", "salt", "sugar", "soy", "soy lecithin", "sunflower",
    "vegetable oil", "corn starch", "flour", "rice flour", "milk",
    "whey powder", "какао", "ұн", "су", "тұз", "қант", "өсімдік майы",
}


def _tokenize(text: str) -> list[str]:
    return [
        token.strip()
        for token in re.split(r"[,\n;()]+", (text or "").lower())
        if token.strip()
    ]


def _find_matches(text: str, rules: dict[str, str]) -> list[tuple[str, str]]:
    found = []
    lower = (text or "").lower()
    for keyword, reason in rules.items():
        if keyword in lower:
            found.append((keyword, reason))
    return found


def analyze_halal_text(text: str) -> dict[str, str]:
    cleaned = (text or "").strip()
    if not cleaned:
        return {
            "status": "empty",
            "message": "Өнім атауын не құрамын жазыңыз.",
        }

    tokens = _tokenize(cleaned)
    haram_hits = _find_matches(cleaned, HARAM_RULES)
    doubtful_hits = _find_matches(cleaned, DOUBTFUL_RULES)
    safe_hits = [hint for hint in SAFE_HINTS if hint in cleaned.lower()]

    if haram_hits:
        reasons = "\n".join(
            f"• <code>{keyword}</code> -> {reason}"
            for keyword, reason in haram_hits[:5]
        )
        return {
            "status": "haram",
            "message": (
                "🥗 <b>HALAL CHECK PRO</b> · <i>1-деңгей: құрам сүзгісі</i>\n\n"
                "❌ <b>Нәтиже: харам белгілер табылды</b>\n\n"
                f"{reasons}\n\n"
                "<b>Ескерту:</b> бұл автоматты сканер ғана; соңғы үкім үшін сертификат пен өндіруші дерегі қажет."
            ),
        }

    if doubtful_hits:
        reasons = "\n".join(
            f"• <code>{keyword}</code> -> {reason}"
            for keyword, reason in doubtful_hits[:6]
        )
        checked_count = len(tokens)
        return {
            "status": "doubtful",
            "message": (
                "🥗 <b>HALAL CHECK PRO</b> · <i>1-деңгей: құрам сүзгісі</i>\n\n"
                "⚠️ <b>Нәтиже: күмәнді құрам</b>\n\n"
                f"{reasons}\n\n"
                f"Ингредиент белгіленді: <b>{checked_count}</b>\n"
                "<b>Әрекет:</b> halal сертификаты, өндіруші хаты немесе толық құрам көзі."
            ),
        }

    safe_note = ""
    if safe_hits:
        safe_note = (
            "\n\nПайдалы белгі: айқын өсімдік не бейтарап ингредиенттер кездесті."
        )

    return {
        "status": "halal_possible",
        "message": (
            "🥗 <b>HALAL CHECK PRO</b> · <i>1-деңгей: құрам сүзгісі</i>\n\n"
            "✅ <b>Айқын харам кілт сөздер табылмады</b>\n\n"
            "Келесі қадам: <b>AI сараптама</b> (2-деңгей) құрамды қысқа талдайды. "
            "Соңғы шешім үшін сертификат пен өндіруші ақпараты сенімдірек."
            f"{safe_note}"
        ),
    }
