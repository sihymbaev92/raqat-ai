# -*- coding: utf-8 -*-
"""Шежіре каталогы — жүз → ру → тармақ (қайталанусыз, бір slug = бір түйін).

Дереккөздер: Мәшһүр Жүсіп, Шәкәрім, ҚР НА этнографиясы.
Негізгі рулар db/genealogy_seed.py ішінде; осы файл тек кеңейту + түзетулер.
"""
from __future__ import annotations

# Ескі slug → біртұтас slug
CLAN_SLUG_ALIASES: dict[str, str] = {
    "karakesek_argyn": "karakesek",
}

# Бір түйін — бір ата (seed-ке қайта орнату)
PARENT_SLUG_OVERRIDES: dict[str, str] = {
    "dulat": "uisin",
}

# Бірдей атау, әртүрлі ру — UI-да ажырату
DISPLAY_NAME_OVERRIDES: dict[str, str] = {
    "tobykty": "Тобықты (Арғын)",
    "tobyqty": "Тобықты (Дулат)",
    "uisin_kerey": "Керей (Үйсін)",
    "ysty_kerey": "Керей (Ысты)",
    "tortuyl": "Төртуыл (Арғын)",
    "tortuyl_nayman": "Төртуыл (Найман)",
    "shanyshkyly_tortuyl": "Төртуыл (Шанышқылы)",
    "zhappas": "Жаппас (Байұлы)",
    "zhappas_tabyn": "Жаппас (Табын)",
    "zhappas_uak": "Жаппас (Уақ)",
    "karasakal": "Қарасақал (Әлімұлы)",
    "kozhaman_karasakal": "Қарасақал (Қоңырат)",
    "karasakal_kongrat": "Қарасақал (Қоңырат)",
    "bura": "Бура (Найман)",
    "bura_ergenekti": "Бура (Ергенекті)",
}

# (parent_slug, slug, name_kk, name_lat, description_kk, name_kk_alt)
# —— Ұлы жүз ——
_CATALOG_ULY: list[tuple[str, str, str, str, str | None, str | None]] = [
    ("uly_zhuz", "kangly", "Қаңлы", "Qangly", "Ежелгі түркі тайпасынан тарайтын Ұлы жүз руы.", None),
    ("uly_zhuz", "shanyshkyly", "Шанышқылы", "Shanyshqyly",
     "Ұлы жүз руы; шанышқы (найза) ұранынан аталады.", None),
    ("uly_zhuz", "sirgeli", "Сіргелі", "Sirgeli", "Ұлы жүзге жататын ежелгі ру.", None),
    ("dulat", "botbay", "Ботбай", "Botbay", "Дулаттың негізгі тармағы.", None),
    ("dulat", "shymyr", "Шымыр", "Shymyr", "Дулаттың тармағы.", None),
    ("dulat", "sikym", "Сиқым", "Sikym", "Дулаттың тармағы.", None),
    ("dulat", "zhanys", "Жаныс", "Zhanys", "Дулаттың тармағы; Төле би осы тармақтан.", None),
    ("zhanys", "zhanys_daulet", "Дәулет", "Daulet", "Жаныс тармағы.", None),
    ("zhanys", "zhanys_zhamby", "Жамбай", "Zhamby", "Жаныс тармағы.", None),
    ("zhanys", "zhanys_bogejil", "Бөгежіл", "Bogejil", "Жаныс тармағы.", None),
    ("zhanys", "zhanys_kapal", "Қапал", "Kapal", "Жаныс тармағы.", None),
    ("zhanys", "zhanys_zhantay", "Жантай", "Zhantay", "Жаныс тармағы.", None),
    ("botbay", "botbay_bidas", "Бидас", "Bidas", "Ботбай тармағы.", None),
    ("botbay", "botbay_qoralas", "Қоралас", "Qoralas", "Ботбай тармағы.", None),
    ("sikym", "sikym_zhanibek", "Жәнібек", "Zhanibek", "Сиқым — Аккөйлі тармағы.", None),
    ("sikym", "sikym_alibek", "Әлібек", "Alibek", "Сиқым — Қойлы тармағы.", None),
    ("uisin", "uisin_karluk", "Қарлұқ", "Karluk", "Үйсін тармағы; Қарлұқ қағандығымен байланыс.", None),
    ("uisin", "uisin_kerey", "Керей", "Kerey uisin", "Үйсін ішіндегі тармақ.", None),
    ("uisin", "uisin_shaksham", "Шақшам", "Shaksham", "Үйсін тармағы.", None),
    ("sary_uisin", "sary_uisin_kozay", "Қозай", "Kozay", "Сарыүйсін тармағы.", None),
    ("sary_uisin", "sary_uisin_zhaksy", "Сарыжақсы", "Saryzhaksy", "Сарыүйсін тармағы.", None),
    ("jalayir", "jalayir_uzak", "Ұзақ", "Uzak", "Жалайыр тармағы.", None),
    ("jalayir", "jalayir_balbay", "Балбай", "Balbay", "Жалайыр тармағы.", None),
    ("jalayir", "jalayir_kozhabay", "Қожабай", "Kozhabay", "Жалайыр тармағы.", None),
    ("shapyrashty", "shapyrashty_zhymyr", "Жымыр", "Zhymyr", "Шапырашты тармағы; Жамбыл Жабаев осы рудан.", None),
    ("shapyrashty", "shapyrashty_baizak", "Байзақ", "Baizak", "Шапырашты тармағы.", None),
    ("ysty", "ysty_kerey", "Керей", "Kerey ysty", "Ысты тармағы.", None),
    ("ysty", "ysty_onirtay", "Өніртай", "Onirtay", "Ысты тармағы.", None),
    ("oshakty", "oshakty_kuandyk", "Қуандық", "Quandyq oshakty", "Ошақты тармағы.", None),
    ("oshakty", "oshakty_burkut", "Бүркіт", "Burkut", "Ошақты тармағы.", None),
    ("kangly", "kangly_kyrgyz", "Қырғыз", "Kyrgyz kangly", "Қаңлы тармағы.", None),
    ("kangly", "kangly_kulan", "Құлан", "Kulan", "Қаңлы тармағы.", None),
    ("shanyshkyly", "shanyshkyly_tortuyl", "Төртуыл", "Tortuyl shanysh", "Шанышқылы тармағы.", None),
    ("shanyshkyly", "shanyshkyly_sary", "Сары", "Sary shanysh", "Шанышқылы тармағы.", None),
    ("sirgeli", "sirgeli_boralbay", "Боралбай", "Boralbay", "Сіргелі тармағы.", None),
    ("sirgeli", "sirgeli_ongustik", "Оңтүстік", "Ongustik", "Сіргелі тармағы.", None),
    ("alban", "alban_sarysu", "Сарысу", "Sarysu", "Албан тармағы.", None),
    ("alban", "alban_kuandyk", "Қуандық", "Quandyq alban", "Албан тармағы.", None),
    ("suan", "suan_konyrau", "Қоңырау", "Konyrau", "Суан тармағы.", None),
    ("suan", "suan_tore", "Төре", "Tore suan", "Суан тармағы.", None),
]

# —— Орта жүз ——
_CATALOG_ORTA: list[tuple[str, str, str, str, str | None, str | None]] = [
    ("orta_zhuz", "tarakty", "Тарақты", "Taraqty", "Орта жүз руы.", None),
    ("argyn", "kuandyk", "Қуандық", "Quandyq", "Арғын — Мейрам тармағы.", None),
    ("argyn", "suyindik", "Сүйіндік", "Suyindik", "Арғын — Мейрам; Бұқар жырау осы рудан.", None),
    ("argyn", "begendik", "Бегендік", "Begendik", "Арғын — Мейрам тармағы.", None),
    ("argyn", "shegendik", "Шегендік", "Shegendik", "Арғын — Мейрам тармағы.", None),
    ("argyn", "kanzhygaly", "Қанжығалы", "Qanzhygaly", "Арғын — Момын; Бөгенбай батыр осы рудан.", None),
    ("argyn", "tobykty", "Тобықты", "Tobyqty", "Арғын — Момын; Абай мен Шәкәрім осы рудан.", None),
    ("argyn", "basentiin", "Басентиін", "Basentiin", "Арғын — Момын тармағы.", None),
    ("argyn", "karauyl", "Қарауыл", "Qarauyl", "Арғын — Момын тармағы.", None),
    ("argyn", "atygai", "Атығай", "Atygai", "Арғын — Момын тармағы.", None),
    ("tobykty", "tobykty_ekengbay", "Екіенбай", "Ekengbay", "Тобықты Арғын — Абай осы тармақтан.", None),
    ("tobykty", "tobykty_mamay", "Мамай", "Mamay", "Тобықты Арғын тармағы.", None),
    ("nayman", "karakerey", "Қаракерей", "Qarakerey", "Найман; Қабанбай батыр осы рудан.", None),
    ("nayman", "matai", "Матай", "Matai", "Найман тармағы.", None),
    ("nayman", "sadyr", "Садыр", "Sadyr", "Найман тармағы.", None),
    ("nayman", "tortuyl_nayman", "Төртуыл", "Tortuyl nayman", "Найман тармағы.", None),
    ("nayman", "baganaly", "Бағаналы", "Baganaly", "Найман тармағы.", None),
    ("nayman", "baltaly", "Балталы", "Baltaly", "Найман тармағы.", None),
    ("nayman", "ergenekti", "Ергенекті", "Ergenekti", "Найман тармағы.", None),
    ("nayman", "kulin_nayman", "Күлің", "Kulin nayman", "Найман тармағы.", None),
    ("nayman", "altay_nayman", "Алтай", "Altay nayman", "Найман тармағы.", None),
    ("ergenekti", "bura_ergenekti", "Бура", "Bura ergenekti", "Ергенекті Найман тармағы.", None),
    ("ergenekti", "kokzharly_nayman", "Көкжарлы", "Kokzharly", "Ергенекті Найман тармағы.", None),
    ("karakerey", "karakerey_karakypchak", "Қарақыпшақ", "Qaraqypchak", "Қаракерей Найман тармағы.", None),
    ("matai", "matai_karabas", "Қарабас", "Karabas", "Матай Найман тармағы.", None),
    ("kerey", "abak_kerey", "Абақ керей", "Abaq kerey", "Керейдің ірі тармағы.", None),
    ("kerey", "ashamaily_kerey", "Ашамайлы керей", "Ashamaily kerey", "Керей тармағы.", None),
    ("kerey", "kerey_abzal", "Абзал", "Abzal", "Керей тармағы.", None),
    ("kerey", "kerey_truhan", "Трухан", "Truhan", "Керей тармағы.", None),
    ("kerey", "kerey_mukyrlau", "Мұқырлау", "Mukyrlau", "Керей тармағы.", None),
    ("kerey", "kerey_kazakh", "Қазақ", "Qazaq kerey", "Керей тармағы.", None),
    ("qypshaq", "bultyn", "Бұлтың", "Bultyn", "Қыпшақ тармағы.", None),
    ("qypshaq", "kara_balyk", "Қарабалық", "Qarabalyq", "Қыпшақ тармағы.", None),
    ("qypshaq", "tory_qypshaq", "Торы", "Tory", "Қыпшақ тармағы.", None),
    ("qypshaq", "uzyn_qypshaq", "Ұзын", "Uzyn", "Қыпшақ тармағы.", None),
    ("qypshaq", "oybaqy", "Ойбақ", "Oybaqy", "Қыпшақ тармағы.", None),
    ("qypshaq", "balymshy", "Балымшы", "Balymshy", "Қыпшақ тармағы.", None),
    ("kongrat", "kotenshi", "Көтенші", "Kotenshi", "Қоңырат тармағы.", None),
    ("kongrat", "zhetimder", "Жетімдер", "Zhetimder", "Қоңырат тармағы.", None),
    ("kongrat", "kokten", "Көктіңұлы", "Koktenuly", "Қоңырат тармағы.", None),
    ("kongrat", "karasakal_kongrat", "Қарасақал", "Qarasaqal kongrat", "Қоңырат тармағы.", None),
    ("kotenshi", "kotenshi_erten", "Ертен", "Erten", "Көтенші тармағы.", None),
    ("kozhaman", "kozhaman_karasakal", "Қарасақал", "Qarasaqal kongrat", "Кожаман тармағы.", None),
    ("uak", "sarbas", "Сарбас", "Sarbas", "Уақ тармағы.", None),
    ("uak", "shoga", "Шоға", "Shoga", "Уақ тармағы.", None),
    ("uak", "zhappas_uak", "Жаппас", "Zhappas uak", "Уақ тармағы.", None),
]

# —— Кіші жүз ——
_CATALOG_KISHI: list[tuple[str, str, str, str, str | None, str | None]] = [
    ("kishi_zhuz", "zhetiru", "Жетіру", "Zhetiru",
     "Жеті ру: Табын, Тама, Кердері, Керейт, Жағалбайлы, Телеу, Рамадан.", None),
    ("zhetiru", "tabyn", "Табын", "Tabyn", "Жетіру құрамындағы ру.", None),
    ("zhetiru", "tama", "Тама", "Tama", "Жетіру құрамындағы ру.", None),
    ("zhetiru", "kerderi", "Кердері", "Kerderi", "Жетіру құрамындағы ру.", None),
    ("zhetiru", "kereit", "Керейт", "Kereit", "Жетіру құрамындағы ру.", None),
    ("zhetiru", "zhagalbaily", "Жағалбайлы", "Zhagalbaily", "Жетіру құрамындағы ру.", None),
    ("zhetiru", "teleu", "Телеу", "Teleu", "Жетіру құрамындағы ру.", None),
    ("zhetiru", "ramadan", "Рамадан", "Ramadan", "Жетіру құрамындағы ру.", None),
    ("tabyn", "zhappas_tabyn", "Жаппас", "Zhappas tabyn", "Табын тармағы.", None),
    ("tabyn", "kaldama", "Қалдама", "Qaldama", "Табын тармағы.", None),
    ("tabyn", "baimuly", "Баймұлы", "Baimuly", "Табын тармағы (Мәшһүр шежіресі).", None),
    ("alshyn", "alimuly", "Әлімұлы", "Alimuly",
     "Алты ру: Қаракесек, Қарасақал, Шекті, Төртқара, Кете, Шөмекей.", "Әлім"),
    ("alimuly", "karakesek_alim", "Қаракесек", "Qarakesek", "Әлімұлы руы.", None),
    ("alimuly", "karasakal", "Қарасақал", "Qarasaqal", "Әлімұлы руы.", None),
    ("alimuly", "shekty", "Шекті", "Shekty", "Әлімұлы руы.", None),
    ("alimuly", "tortkara", "Төртқара", "Tortqara", "Әлімұлы; Әйтеке би осы рудан.", None),
    ("alimuly", "kete", "Кете", "Kete", "Әлімұлы руы.", None),
    ("alimuly", "shomekey", "Шөмекей", "Shomekey", "Әлімұлы руы.", None),
    ("alimuly", "zhuzbiay", "Жүзбай", "Zhuzbiay", "Әлімұлы руы.", None),
    ("alshyn", "baiuly", "Байұлы", "Baiuly", "Кіші жүздің ең көп ру жинаған ата.", "Бай"),
    ("baiuly", "adai", "Адай", "Adai", "Маңғыстау мен Атырауда кең таралған.", None),
    ("baiuly", "berish", "Беріш", "Berish", "Махамбет пен Исатай осы рудан.", None),
    ("baiuly", "zhappas", "Жаппас", "Zhappas", "Байұлы руы.", None),
    ("baiuly", "alasha", "Алаша", "Alasha", "Байұлы руы.", None),
    ("baiuly", "baibakty", "Байбақты", "Baibaqty", "Сырым Датұлы осы рудан.", None),
    ("baiuly", "maskar", "Масқар", "Masqar", "Байұлы руы.", None),
    ("baiuly", "taz", "Таз", "Taz", "Байұлы руы.", None),
    ("baiuly", "esentemir", "Есентемір", "Esentemir", "Байұлы руы.", None),
    ("baiuly", "ysyk", "Ысық", "Ysyq", "Байұлы руы.", None),
    ("baiuly", "kyzylkurt", "Қызылқұрт", "Qyzylqurt", "Байұлы руы.", None),
    ("baiuly", "sherkesh", "Шеркеш", "Sherkesh", "Байұлы руы.", None),
    ("baiuly", "tana_baiuly", "Тана", "Tana baiuly", "Байұлы руы.", None),
    ("baiuly", "altyn_baiuly", "Алтын", "Altyn", "Байұлы руы.", None),
    ("baiuly", "koshen", "Көшен", "Koshen", "Байұлы руы.", None),
    ("baiuly", "kozha_baiuly", "Қожа", "Kozha", "Байұлы руы.", None),
    ("adai", "adai_kesemen", "Кесеңмен", "Kesemen", "Адайдың ең ірі тармағы.", None),
    ("adai", "adai_uzyn", "Ұзын", "Uzyn adai", "Адай тармағы.", None),
    ("adai", "adai_kesibi", "Кесібі", "Kesibi", "Адай тармағы.", None),
    ("adai", "adai_zhetim", "Жетім", "Zhetim adai", "Адай тармағы.", None),
    ("adai", "adai_tore", "Төре", "Tore adai", "Адай тармағы.", None),
    ("berish", "berish_karabas_berish", "Қарабас", "Karabas berish", "Беріш тармағы.", None),
]

CATALOG_CLAN_ROWS: list[tuple[str, str, str, str, str | None, str | None]] = (
    _CATALOG_ULY + _CATALOG_ORTA + _CATALOG_KISHI
)

NODE_PATCHES: dict[str, dict[str, str | None]] = {
    "kete": {"description_kk": "Әлімұлы ішіндегі ру; Кіші жүз шежіресі бойынша."},
    "kete_suan": {"description_kk": "Суан руының тармағы (Мәшһүр шежіресі)."},
    "jalayir": {"description_kk": "Ұлы жүздің ірі руларының бірі; Жетісу мен Семей өңірінде."},
    "shapyrashty": {"description_kk": "Ұлы жүз руы; Жамбыл Жабаев осы рудан."},
    "ysty": {"description_kk": "Ұлы жүз руы; Оңтүстік Қазақстанда."},
    "oshakty": {"description_kk": "Ұлы жүз руы."},
    "orta_zhuz": {"description_kk": "Орталық Қазақстан, Сарыарқа және Шығыс Қазақстанға жақын жүз."},
    "kishi_zhuz": {"description_kk": "Батыс Қазақстан мен Жайық–Еділ өңіріне байланысты жүз."},
    "karakesek": {"description_kk": "Арғын ішіндегі ірі тармақ; Қазыбек би осы рудан."},
}

PERSON_EXTRA_ROWS: list[tuple] = [
    ("kazybek_bi", "karakesek", "Қаз дауысты Қазыбек би", "Qazybek bi", 1667, 1764,
     "historical", "Үш бидің бірі, шешен", "Орта жүздің биі; «Қаз дауысты» атанған шешен."),
    ("bogenbai_batyr", "kanzhygaly", "Бөгенбай батыр", "Bogenbai batyr", 1690, 1775,
     "historical", "Қолбасшы, батыр", "Қанжығалы Арғын; Жоңғарға қарсы соғыс."),
    ("shakarim", "tobykty", "Шәкәрім Құдайбердіұлы", "Shakarim", 1858, 1931,
     "historical", "Ақын, ойшыл", "Тобықты Арғын; «Шежіре-тарих» авторы."),
    ("aktamberdi", "nayman", "Ақтамберді жырау", "Aqtamberdi zhyrau", 1675, 1768,
     "historical", "Жырау, батыр", "Найман руы; жыраулық дәстүр."),
    ("tole_bi_uly", "zhanys", "Төле би Әлібекұлы", "Tole bi uly", 1663, 1756,
     "historical", "Үш бидің бірі", "Ұлы жүздің биі; Дулат-Жаныс."),
    ("zhambyl", "shapyrashty_zhymyr", "Жамбыл Жабаев", "Zhambyl Zhabaev", 1846, 1945,
     "contemporary", "Ақын, жырау", "Шапырашты-Жымыр руынан."),
    ("bauyrzhan", "dulat", "Бауыржан Момышұлы", "Bauyrzhan Momyshuly", 1910, 1982,
     "contemporary", "Қолбасшы, жазушы", "Ұлы жүз Дулат; Кеңес Одағының Батыры."),
    ("syrym_datuly", "baibakty", "Сырым Датұлы", "Syrym Datuly", 1742, 1802,
     "historical", "Батыр, көтеріліс басшысы", "Байбақты Байұлы."),
    ("makhambet", "berish", "Махамбет Өтемісұлы", "Makhambet", 1803, 1846,
     "historical", "Ақын, батыр", "Беріш Байұлы; Исатай-Махамбет көтерілісі."),
    ("isatai", "berish", "Исатай Тайманұлы", "Isatai Taimanuly", 1791, 1838,
     "historical", "Батыр, көтеріліс басшысы", "Беріш Байұлы."),
    ("aiteke_bi", "tortkara", "Әйтеке би Бәйбекұлы", "Aiteke bi", 1644, 1700,
     "historical", "Үш бидің бірі", "Әлімұлы-Төртқара; Кіші жүз биі."),
    ("akhmet_baitursynov", "argyn", "Ахмет Байтұрсынұлы", "Akhmet Baitursynov", 1872, 1937,
     "historical", "Алаш қайраткері", "Арғын руы."),
    ("mirzhakyp_dulatov", "dulat", "Міржақып Дулатов", "Mirzhakyp Dulatov", 1885, 1935,
     "historical", "Алаш қайраткері", "Ұлы жүз Дулат."),
    ("mustafa_shokai", "uly_zhuz", "Мұстафа Шоқай", "Mustafa Shokai", 1890, 1941,
     "historical", "Алаш қайраткері", "Ұлы жүз."),
    ("amanzholov", "argyn", "Әбілқайыр Аманжолов", "Amanzholov", 1903, 1973,
     "contemporary", "Ақын", "Арғын руы."),
    ("kassym_kaisenov", "adai", "Қасым Қайсенов", "Kassym Kaisenov", 1920, 2002,
     "contemporary", "Жазушы", "Адай руы."),
    ("nurpeis_bayganin", "tabyn", "Нұрпейіс Байғанин", "Nurpeis Bayganin", 1896, 1986,
     "contemporary", "Ақын, жырау", "Табын руы."),
    ("kurmangazy", "adai", "Құрманғазы Сағырбайұлы", "Kurmangazy", 1823, 1889,
     "historical", "Күйші", "Адай руы."),
]

PERSON_SLUG_ALIASES: dict[str, str] = {
    "zhambyl": "zhambul_zhabayev",
    "kazybek_bi": "kazybek_biy",
    "makhambet": "makhambet_otemisuly",
    "isatai": "isatai_taymanuly",
    "bogenbai_batyr": "bogenbay_batyr",
    "shakarim": "shakarim_kudaiberdiuly",
}


DISPLAY_NAME_OVERRIDES["kete_suan"] = "Кете (Суан)"
DISPLAY_NAME_OVERRIDES["kete"] = "Кете (Әлімұлы)"
