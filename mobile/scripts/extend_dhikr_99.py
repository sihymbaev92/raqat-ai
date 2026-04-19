#!/usr/bin/env python3
"""dhikr-list.json → 99 элемент; Құран/сүннет негізіндегі қысқа зікірлер."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "assets" / "bundled" / "dhikr-list.json"

NEW = [
    {"id": 55, "slug": "bismillah_only", "textAr": "بِسْمِ اللَّهِ", "textKk": "Бисмиллаһ", "translitKk": "Бисмиллаһ", "meaningKk": "Аллаһтың атымен бастау — әр істің сүннеті.", "defaultTarget": 100, "phaseRule": None},
    {"id": 56, "slug": "subhanallah_word", "textAr": "سُبْحَانَ اللَّهِ", "textKk": "СубханаЛлаһ (жеке)", "translitKk": "СубханаЛлаһ", "meaningKk": "Аллаһ бар кемшіліктен пәк — тәсбихтің негізі.", "defaultTarget": 33, "phaseRule": None},
    {"id": 57, "slug": "alhamdulillah_word", "textAr": "الْحَمْدُ لِلَّهِ", "textKk": "Әлхамдулиллаһ (жеке)", "translitKk": "Әлхамдулиллаһ", "meaningKk": "Бар мақтау Аллаһқа — шүкірдің негізі.", "defaultTarget": 33, "phaseRule": None},
    {"id": 58, "slug": "allahu_akbar_word", "textAr": "اللَّهُ أَكْبَرُ", "textKk": "Аллаһу акбар (жеке)", "translitKk": "Аллаһу акбар", "meaningKk": "Аллаһ ең ұлы — тәкбірдің негізі.", "defaultTarget": 33, "phaseRule": None},
    {"id": 59, "slug": "subhan_bi_hamd_subhan_azim", "textAr": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ", "textKk": "СубханаЛлаһи уа биҳамдиһи…", "translitKk": "СубханаЛлаһи уа биҳамдиһи, СубханаЛлаһил-'азим", "meaningKk": "Хадистегі мықты тәсбих: мадақтау және Ұлы Аллаһты пәк деп айту.", "defaultTarget": 100, "phaseRule": None},
    {"id": 60, "slug": "la_ilaha_full_tawhid", "textAr": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", "textKk": "Ла илаһа (толық тәухид)", "translitKk": "Ла илаһа иллаллаһу уахдаһу… уа һуа 'алә kulli шәй'in қадир", "meaningKk": "Тәухид, мулк, мақтау — таң/кеш жиі зікірі (сүннет формасы).", "defaultTarget": 100, "phaseRule": None},
    {"id": 61, "slug": "allahumma_antarabbi", "textAr": "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ", "textKk": "Сәййидүл-истигфар (басы)", "translitKk": "Аллаһумма анта рабби ла илаһа илла анта…", "meaningKk": "Ұлы истигфардың басы — кешірім мен тәуелділік.", "defaultTarget": 10, "phaseRule": None},
    {"id": 62, "slug": "rabbi_ighfir_warham", "textAr": "رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ خَيْرُ الرَّاحِمِينَ", "textKk": "Рабби ғфир уарҳам", "translitKk": "Раббиғфир уарҳам уа анта хайрур-рахимин", "meaningKk": "Раббым, кешір, мейірім ет — сен ең жақсы мейірімдісің (23:118).", "defaultTarget": 50, "phaseRule": None},
    {"id": 63, "slug": "subhan_al_aliyy_al_azim", "textAr": "سُبْحَانَ الْعَلِيِّ الْعَظِيمِ", "textKk": "Субхана әл-'алиййил-'азим", "translitKk": "Субхана әл-'алиййил-'азим", "meaningKk": "Биік пен Ұлы — рүку кезінде жиі.", "defaultTarget": 33, "phaseRule": None},
    {"id": 64, "slug": "allahumma_lakal_hamd", "textAr": "اللَّهُمَّ رَبَّنَا لَكَ الْحَمْدُ", "textKk": "Аллаһумма ләкал хамд", "translitKk": "Аллаһумма раббана ләкал хамд", "meaningKk": "Раббымыз, мақтау Саған (сәжде/құттықтау сияқты контекст).", "defaultTarget": 30, "phaseRule": None},
    {"id": 65, "slug": "allahumma_barik_rizq", "textAr": "اللَّهُمَّ بَارِكْ لِي فِي رِزْقِي", "textKk": "Аллаһумма барик ли ризқи", "translitKk": "Аллаһумма барик ли фи ризқи", "meaningKk": "Аллаһумма, ризығымда береке бер.", "defaultTarget": 50, "phaseRule": None},
    {"id": 66, "slug": "audhu_hamm_wal_hazan", "textAr": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ", "textKk": "Аллаһумма а'узу бика минал-һамм", "translitKk": "Аллаһумма инни а'узу бика минал-һамми уал-һазан", "meaningKk": "Қайғы мен мазасыздықтан пана (дуа басы).", "defaultTarget": 30, "phaseRule": None},
    {"id": 67, "slug": "audhu_ajz_wal_kasal", "textAr": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ", "textKk": "Аллаһумма а'узу минал-'ажзи", "translitKk": "Аллаһумма а'узу бика минал-'ажзи уал-касал", "meaningKk": "Әлсіздік пен жалқаулықтан пана.", "defaultTarget": 30, "phaseRule": None},
    {"id": 68, "slug": "asaluka_ilman_nafia", "textAr": "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا", "textKk": "Аллаһумма ас'alука 'илман нафи'а", "translitKk": "Аллаһумма ас'alука 'илман нафи'ан", "meaningKk": "Пайдалы білім сұрау (дуаның басы).", "defaultTarget": 40, "phaseRule": None},
    {"id": 69, "slug": "asaluka_alhuda", "textAr": "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى", "textKk": "Аллаһумма ас'alукал-һуда", "translitKk": "Аллаһумма ас'alукал-һуда", "meaningKk": "Түзу жол сұрау.", "defaultTarget": 40, "phaseRule": None},
    {"id": 70, "slug": "allahumma_afuww", "textAr": "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", "textKk": "Аллаһумма иннака 'афуввун…", "translitKk": "Аллаһумма иннака 'афуввун туһиббул-'афва фа'фу 'анни", "meaningKk": "Қадір түні: кешірімдісің, кешірімді сүйесің, кешір (жиі дұға).", "defaultTarget": 10, "phaseRule": None},
    {"id": 71, "slug": "allahumma_nur_qalb", "textAr": "اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا", "textKk": "Аллаһумма ж'ал фи қалби нуран", "translitKk": "Аллаһумма ж'ал фи қалби нуран", "meaningKk": "Жүрегіме нұр сал (рухани жарық).", "defaultTarget": 30, "phaseRule": None},
    {"id": 72, "slug": "allahumma_afwa_afiya", "textAr": "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ", "textKk": "Аллаһумма ас'alукал-'афва", "translitKk": "Аллаһумма ас'alукал-'афва уал-'афийа", "meaningKk": "Кешірім мен амандық сұрау.", "defaultTarget": 40, "phaseRule": None},
    {"id": 73, "slug": "allahumma_hasib_yasir", "textAr": "اللَّهُمَّ حَاسِبْنِي حِسَابًا يَسِيرًا", "textKk": "Аллаһумма ҳасибни ҳисабан йасиран", "translitKk": "Аллаһумма ҳасибни ҳисабан йасиран", "meaningKk": "Есебімді жеңіл ет (қайғысыз кездесу).", "defaultTarget": 30, "phaseRule": None},
    {"id": 74, "slug": "rabbana_la_tuzigh", "textAr": "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا", "textKk": "Раббана ла tuzиғ…", "translitKk": "Раббана ла tuzиғ қулубана ба'да ис һадайтана", "meaningKk": "Раббымыз, бізді бағыттағаннан кейін жүректерімізді бұтқа беттетпе (3:8).", "defaultTarget": 20, "phaseRule": None},
    {"id": 75, "slug": "wa_ma_tawfiqi", "textAr": "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ", "textKk": "Уа ма тәуфиқи илла биллаһ", "translitKk": "Уа ма тәуфиқи илла биллаһ", "meaningKk": "Табысым тек Аллаһпен (11:88).", "defaultTarget": 100, "phaseRule": None},
    {"id": 76, "slug": "hasbi_tawakkul_full", "textAr": "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", "textKk": "Һасбийаллаһ (толық тәуеккүл)", "translitKk": "Һасбийаллаһу ла илаһа илла һуа 'аләйһи тәуаккалту", "meaningKk": "Тәуеккүлдің толық нұсқасы (9:129).", "defaultTarget": 50, "phaseRule": None},
    {"id": 77, "slug": "subhan_dhi_mulk", "textAr": "سُبْحَانَ ذِي الْمُلْكِ وَالْمَلَكُوتِ", "textKk": "Субхана зил-мулки", "translitKk": "Субхана зил-мулки уал-малакут", "meaningKk": "Мүлік пен патшалық Иесі пәк.", "defaultTarget": 33, "phaseRule": None},
    {"id": 78, "slug": "allahumma_salim_muslimin", "textAr": "اللَّهُمَّ أَسْلِمْ أَسْلِمْ", "textKk": "Аллаһумма әслим әслим", "translitKk": "Аллаһумма әслим әслим", "meaningKk": "Аллаһумма, салаamat бер (қысқа жиі дұға).", "defaultTarget": 30, "phaseRule": None},
    {"id": 79, "slug": "allahumma_ftah_li", "textAr": "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", "textKk": "Аллаһуммафтaҳ ли абwаба рахматик", "translitKk": "Аллаһумма фтаҳ ли абwаба рахматик", "meaningKk": "Мейірім есіктерін аш (намаз сәлемінен кейін жиі).", "defaultTarget": 20, "phaseRule": None},
    {"id": 80, "slug": "allahumma_inni_zalamtu", "textAr": "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا", "textKk": "Аллаһумма инни заламту нафси", "translitKk": "Аллаһумма инни заламту нафси зulман касиран", "meaningKk": "Нәпсіме көп зұлымдық істедім (истигфар басы).", "defaultTarget": 10, "phaseRule": None},
    {"id": 81, "slug": "la_mani_atayta", "textAr": "لَا مَانِعَ لِمَا أَعْطَيْتَ وَلَا مُعْطِيَ لِمَا مَنَعْتَ", "textKk": "Ла мани лима а'тайта (толығы)", "translitKk": "Ла мани лима а'тайта уа ла му'ти лима мана'та", "meaningKk": "Бергеніңді тоқтатпайтын жоқ (қысқа нұсқа).", "defaultTarget": 30, "phaseRule": None},
    {"id": 82, "slug": "allahumma_rzuqni", "textAr": "اللَّهُمَّ ارْزُقْنِي حَلَالًا طَيِّبًا", "textKk": "Аллаһумма рзуқни ҳалалән таййибан", "translitKk": "Аллаһумма рзуқни ҳалалән таййибан", "meaningKk": "Таза халал ризық бер.", "defaultTarget": 50, "phaseRule": None},
    {"id": 83, "slug": "allahumma_qini_azab", "textAr": "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", "textKk": "Аллаһумма қини 'азабак", "translitKk": "Аллаһумма қини 'азабака йаwма таб'асу 'ибадак", "meaningKk": "Қиямет күні азабыңнан сақта (дуа басы).", "defaultTarget": 15, "phaseRule": None},
    {"id": 84, "slug": "subhan_rabbika_rabbil_izzati", "textAr": "سُبْحَانَ رَبِّكَ رَبِّ الْعِزَّةِ عَمَّا يَصِفُونَ", "textKk": "Субхана раббика раббил-'иззати", "translitKk": "Субхана раббика раббил-'иззати 'амма йасифун", "meaningKk": "Раббың ұлық — сипатталғандардан пәк (37:180).", "defaultTarget": 20, "phaseRule": None},
    {"id": 85, "slug": "wa_ila_rabbika_farghab", "textAr": "وَإِلَىٰ رَبِّكَ فَارْغَبْ", "textKk": "Уа илә раббика фарғаб", "translitKk": "Уа илә раббика фарғаб", "meaningKk": "Раббыңа ұмтыл (94:8).", "defaultTarget": 100, "phaseRule": None},
    {"id": 86, "slug": "wallahu_khairul_hafizin", "textAr": "وَاللَّهُ خَيْرٌ حَافِظًا وَهُوَ أَرْحَمُ الرَّاحِمِينَ", "textKk": "УалЛлаһу хайрун ҳафиза", "translitKk": "УалЛлаһу хайрун һафиза уа һуа арҳамур-рахимин", "meaningKk": "Аллаһ ең жақсы сақтаушы (12:64).", "defaultTarget": 30, "phaseRule": None},
    {"id": 87, "slug": "rabbishrah_li", "textAr": "رَبِّ اشْرَحْ لِي صَدْرِي", "textKk": "Рабби шраҳ ли садри", "translitKk": "Рабби шраҳ ли садри", "meaningKk": "Раббым, кеудемді жайғасын (Муса дұғасының басы).", "defaultTarget": 20, "phaseRule": None},
    {"id": 88, "slug": "allahumma_laka_sumtu", "textAr": "اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ", "textKk": "Аллаһумма ләка сумту", "translitKk": "Аллаһумма ләка сумту уа 'алә ризқика aftарту", "meaningKk": "Саған ораза ұстап, ризығыңмен аштым (ороза ашар).", "defaultTarget": 10, "phaseRule": None},
    {"id": 89, "slug": "dhikrullah_akbar", "textAr": "ذِكْرُ اللَّهِ أَكْبَرُ", "textKk": "Зикруллаһи акбар", "translitKk": "Зикруллаһи акбар", "meaningKk": "Аллаһ зікірі ең ұлы (29:45 мағынасына жақын ескерту).", "defaultTarget": 50, "phaseRule": None},
    {"id": 90, "slug": "fa_idha_azamta", "textAr": "فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ", "textKk": "Фаиза 'азамта фәтәуаккал 'алаллаһ", "translitKk": "Фаиза 'азамта фәтәуаккал 'алаллаһ", "meaningKk": "Белгілеп қойсаң, Аллаһқа тәуеккүл ет (3:159).", "defaultTarget": 30, "phaseRule": None},
    {"id": 91, "slug": "hasbunallahu_ni_mal_wakil", "textAr": "نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ", "textKk": "Ниғмал мaula уа ниғман насир", "translitKk": "Ниғмал мaula уа ниғман насир", "meaningKk": "Қандай жақсы Мәулә, қандай жақсы көмекші (8:40 жалғасы).", "defaultTarget": 50, "phaseRule": None},
    {"id": 92, "slug": "sallallahu_alayhi_wa_sallam_short", "textAr": "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ", "textKk": "Саллаллаһу 'аләйһи уа саллам", "translitKk": "Саллаллаһу 'аләйһи уа саллам", "meaningKk": "Аллаһ оған сәләу және сәләм етсін (елшіге).", "defaultTarget": 50, "phaseRule": None},
    {"id": 93, "slug": "allahumma_salli_muhammadin", "textAr": "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", "textKk": "Аллаһумма салли 'алә Мухаммад", "translitKk": "Аллаһумма салли 'алә Мухаммадин", "meaningKk": "Аллаһумма, Мұхаммедке сәләу ет (қысқа).", "defaultTarget": 100, "phaseRule": None},
    {"id": 94, "slug": "allahumma_ghfir_muslimin", "textAr": "اللَّهُمَّ اغْفِرْ لِلْمُسْلِمِينَ وَالْمُسْلِمَاتِ", "textKk": "Аллаһуммағфир лил-муслимин", "translitKk": "Аллаһуммағфир лил-муслимина уал-муслимат", "meaningKk": "Мұсылман ерлер мен әйелдерді кешір.", "defaultTarget": 20, "phaseRule": None},
    {"id": 95, "slug": "subhanallahi_wa_bihamdihi_adada", "textAr": "سُبْحَانَ اللَّهِ عَدَدَ خَلْقِهِ رِضَا نَفْسِهِ", "textKk": "СубханаЛлаһи 'адада халқиһи", "translitKk": "СубханаЛлаһи 'адада халқиһи риза нафсиһи", "meaningKk": "Жаратылыс санымен пәк (Фатима руаяты стиліндегі бастапқы).", "defaultTarget": 10, "phaseRule": None},
    {"id": 96, "slug": "allahumma_atina_fidunya", "textAr": "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", "textKk": "Раббана әтина (екі дүние)", "translitKk": "Раббана әтина фид-дунья хасанатан уafil-ахирати хасанатан", "meaningKk": "Дүниеде де, ахиретте де жақсылық бер (2:201).", "defaultTarget": 30, "phaseRule": None},
    {"id": 97, "slug": "innallaha_yuhibb", "textAr": "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ", "textKk": "Инналлаһа юһиббут-таwабин", "translitKk": "Инналлаһа юһиббут-таwабин", "meaningKk": "Расында Аллаһ тәубе еткендерді сүйеді (2:222 үзіндісі).", "defaultTarget": 30, "phaseRule": None},
    {"id": 98, "slug": "wala_taknatu", "textAr": "وَلَا تَيْأَسُوا مِنْ رَوْحِ اللَّهِ", "textKk": "Уа ла тай'асу мин рауһиллаһ", "translitKk": "Уа ла тай'асу мин рауһиллаһ", "meaningKk": "Аллаһтың мейірімінен үміт үзбеңдер (12:87).", "defaultTarget": 30, "phaseRule": None},
    {"id": 99, "slug": "alhamdu_lillahi_hamdan_kathiran", "textAr": "الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ", "textKk": "Әлхамдулиллаһи ҳамдан касиран", "translitKk": "Әлхамдулиллаһи ҳамдан касиран таййибан мубаракан фиһи", "meaningKk": "Көп, таза, берекелі мақтау Аллаһқа (сүннет сәлемдегі стиль).", "defaultTarget": 33, "phaseRule": None},
]


def main() -> None:
    with open(PATH, encoding="utf-8") as f:
        data = json.load(f)
    if len(data["items"]) != 54:
        raise SystemExit(f"Expected 54 items, got {len(data['items'])}")
    ids = {x["id"] for x in data["items"]}
    for n in NEW:
        if n["id"] in ids:
            raise SystemExit(f"Duplicate id {n['id']}")
    data["items"].extend(NEW)
    data["version"] = 4
    with open(PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("OK:", len(data["items"]), "items, version", data["version"])


if __name__ == "__main__":
    main()
