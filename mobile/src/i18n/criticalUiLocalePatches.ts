/**
 * Қолмен аудит: chrome/батырма мәтіндері — офлайн MT bundle жоқ кезде де 7 тілде жұмыс істейді.
 */

type CriticalPatch = Record<string, unknown>;

const savedTabRu = {
  emptyTitle: "Пока нет сохранённых данных",
  emptyHint:
    "Если добавить закладку в Коране, продолжить хатм или добавить организацию Halal в избранное — всё появится здесь.",
  quickHatim: "Хатм",
  quickHalal: "Халал",
  lastAyahTitle: "Последний прочитанный аят",
  open: "Открыть",
  hatimProgressTitle: "Прогресс хатма",
  readSurahLabel: "Прочитанные суры",
  continue: "Продолжить",
  openHatim: "Открыть хатм",
  markedAyahs: "Отмеченные аяты",
  markedAyahDefault: "Отмеченный аят",
  bookmarkSurahs: "Закладки сур",
  halalFavorites: "Избранное Halal",
  halalFavoriteBody: "Организация Halal добавлена в избранное",
  openHalal: "Открыть Halal",
};

const savedTabEn = {
  emptyTitle: "No saved items yet",
  emptyHint:
    "Bookmark a Quran page, continue your hatim, or favorite a Halal organization — everything gathers here.",
  quickHatim: "Hatim",
  quickHalal: "Halal",
  lastAyahTitle: "Last read ayah",
  open: "Open",
  hatimProgressTitle: "Hatim progress",
  readSurahLabel: "Surahs read",
  continue: "Continue",
  openHatim: "Open hatim",
  markedAyahs: "Marked ayahs",
  markedAyahDefault: "Marked ayah",
  bookmarkSurahs: "Bookmarked surahs",
  halalFavorites: "Halal favorites",
  halalFavoriteBody: "Halal organization added to favorites",
  openHalal: "Open Halal",
};

const savedTabKy = {
  emptyTitle: "Азырынча сакталган маалымат жок",
  emptyHint:
    "Куранда bookmark койсоңуз, хатмды улантсаңыз же Halal уюмун тандалмаларга кошсоңуз — баары ушул жерде чогулат.",
  quickHatim: "Хатм",
  quickHalal: "Халал",
  lastAyahTitle: "Акыркы окулган аят",
  open: "Ачуу",
  hatimProgressTitle: "Хатм прогресси",
  readSurahLabel: "Окулган сүрөлөр",
  continue: "Улантуу",
  openHatim: "Хатмды ачуу",
  markedAyahs: "Белгиленген аяттар",
  markedAyahDefault: "Белги коюлган аят",
  bookmarkSurahs: "Bookmark сүрөлөр",
  halalFavorites: "Halal тандалмалар",
  halalFavoriteBody: "Halal уюму тандалмаларга кошулду",
  openHalal: "Halal ачуу",
};

const savedTabUz = {
  emptyTitle: "Hozircha saqlangan ma'lumot yo'q",
  emptyHint:
    "Qur'onga bookmark qo'ysangiz, xatmni davom ettirsangiz yoki Halal tashkilotini sevimlilarga qo'shsangiz — hammasi shu yerda yig'iladi.",
  quickHatim: "Xatm",
  quickHalal: "Halol",
  lastAyahTitle: "Oxirgi o'qilgan oyat",
  open: "Ochish",
  hatimProgressTitle: "Xatm progressi",
  readSurahLabel: "O'qilgan suralar",
  continue: "Davom etish",
  openHatim: "Xatmni ochish",
  markedAyahs: "Belgilangan oyatlar",
  markedAyahDefault: "Belgilangan oyat",
  bookmarkSurahs: "Bookmark suralar",
  halalFavorites: "Halal sevimlilar",
  halalFavoriteBody: "Halal tashkiloti sevimlilarga qo'shildi",
  openHalal: "Halalni ochish",
};

const savedTabTr = {
  emptyTitle: "Henüz kayıtlı veri yok",
  emptyHint:
    "Kur'an'da yer imi koyarsanız, hatmi sürdürürseniz veya Halal kurumunu favorilere eklerseniz — hepsi burada toplanır.",
  quickHatim: "Hatim",
  quickHalal: "Helal",
  lastAyahTitle: "Son okunan ayet",
  open: "Aç",
  hatimProgressTitle: "Hatim ilerlemesi",
  readSurahLabel: "Okunan sureler",
  continue: "Devam",
  openHatim: "Hatmi aç",
  markedAyahs: "İşaretli ayetler",
  markedAyahDefault: "İşaretlenen ayet",
  bookmarkSurahs: "Yer imli sureler",
  halalFavorites: "Halal favoriler",
  halalFavoriteBody: "Halal kurumu favorilere eklendi",
  openHalal: "Halal'i aç",
};

const savedTabAr = {
  emptyTitle: "لا توجد بيانات محفوظة بعد",
  emptyHint:
    "إذا أضفت إشارة مرجعية في القرآن أو واصلت الختمة أو أضفت مؤسسة حلال إلى المفضلة — يجتمع كل ذلك هنا.",
  quickHatim: "الختمة",
  quickHalal: "حلال",
  lastAyahTitle: "آخر آية قُرئت",
  open: "فتح",
  hatimProgressTitle: "تقدم الختمة",
  readSurahLabel: "السور المقروءة",
  continue: "متابعة",
  openHatim: "فتح الختمة",
  markedAyahs: "الآيات المعلّمة",
  markedAyahDefault: "آية معلّمة",
  bookmarkSurahs: "سور محفوظة",
  halalFavorites: "مفضّلات الحلال",
  halalFavoriteBody: "أُضيفت مؤسسة الحلال إلى المفضلة",
  openHalal: "فتح الحلال",
};

function traditionChrome(locale: "ru" | "en" | "ky" | "uz" | "tr" | "ar") {
  const map = {
    ru: {
      nothingFound: "Ничего не найдено",
      elderReadBtn: "Прочитать вслух для старших",
      emptySearch: "Подходящий раздел не найден.",
      topicsLeadShort: "Связь обычаев с религией — понятные темы",
      aboutSectionTitle: "О чём этот раздел?",
      aboutSectionBody:
        "Кратко и ясно объясняет, как казахские обычаи сочетаются с исламом и какие суеверия соответствуют религии, а какие выходят за её пределы. Откройте тему и читайте полностью — внутри нет лишних кнопок.",
      searchPlaceholderShort: "Поиск: суеверие, бата, той…",
      articlesTitle: "Статьи",
      articlesLead: "Казахская традиция и ценности ислама",
      articlesSub: "Краткое пояснение, семейное чтение и практический ориентир",
      openOnSite: "Открыть на сайте",
      allArticles: "Все статьи",
      favoritesTitle: "Избранное",
      favoritesLead: "Сохранённые традиции и статьи",
      favoritesEmpty: "Пока нет избранного",
      favoritesEmptyHint: "Сохраните традицию или статью через закладку.",
      favoriteTypeTopic: "Традиция",
      favoriteTypeArticle: "Статья",
      filterAll: "Все",
      filterFamily: "Семья",
      filterSocial: "Общество",
      filterCeremony: "Обряд",
      filterFaith: "Связь с религией",
      topicsCount: (n: number) => `${n} тем`,
      dinDasturConnectionTitle: "Религия, традиция и ырым",
      dinDasturPointsTitle: "Три ясные мысли",
      dinDasturRulesTitle: "Основные правила",
      dinDasturFoundationBtn: "Читать основу",
      dinDasturYrymBtn: "Ырым и религия",
      dinDasturBataBtn: (n: number) => `Тексты бата (${n})`,
      asylSozCtaTitle: "Благородные слова",
      asylSozCtaSub: "Абай · Жамбыл · Мукагали · Магжан и другие поэты",
      asylSozCtaA11y: "Открыть слова казахских поэтов",
      sanaSozCtaTitle: "Слова, открывающие разум",
      sanaSozCtaSub: "Мысль · знание · самопознание · терпение · правда",
      sanaSozCtaA11y: "Открыть слова, расширяющие сознание",
      bataCountLabel: (n: number) => `${n} бата`,
      bataShowMore: (n: number) => `Показать ещё ${n}`,
      bataShowLess: "Свернуть",
      topicNotFound: "Традиция не найдена",
      aboutTraditionTitle: "Кратко",
      originTitle: "Откуда взялось",
      religionLinkTitle: "Как сочетается с религией",
      superstitionLimitTitle: "Где проходит граница",
      religionLinkLead: "Ниже — связь этой традиции с религией: сначала согласие, затем граница.",
      howToHoldTitle: "Как правильно соблюдать",
      bataTextsTitle: "Тексты благословений",
      relatedArticlesTitle: "Связанные статьи",
      quickChewTitle: "Краткое объяснение",
      quickChewLead: "Основные 4 традиции — история, шариатское правило и связь с религией.",
      quickHistoryLabel: "🔍 История происхождения:",
      quickShariatLabel: "⚖️ Шариатское правило:",
      quickEvidenceLabel: "📖 Связь с религией (доказательство):",
      quickReadFull: "Читать полный текст",
      traditionEvidenceHint: "Краткое доказательство — понять связь с религией. Полный хукм — у учителя.",
      traditionEvidenceDisclaimer:
        "Это краткий смысл. Для полного текста и хукма смотрите Коран, хадисы и разъяснения муфтията.",
      introDetail:
        "Традиция — опыт общества, проверенный временем; шариат — повеление Аллаха и сунна Пророка ﷺ. Они могут идти вместе только если не причиняют вреда людям, семье и соседям.\n\n" +
        "Номера аятов на этом экране даны для ориентира; особенности мазхаба уточняйте по указаниям национального духовного управления.",
    },
    en: {
      nothingFound: "Nothing found",
      elderReadBtn: "Read aloud for elders",
      emptySearch: "No matching section found.",
      topicsLeadShort: "How customs relate to faith — clear topics",
      aboutSectionTitle: "What is this section about?",
      aboutSectionBody:
        "It briefly explains how Kazakh customs align with Islam and which superstitions fit the faith versus those that go beyond it. Tap a topic and read fully — no extra buttons inside.",
      searchPlaceholderShort: "Search: custom, blessing, wedding…",
      articlesTitle: "Articles",
      articlesLead: "Kazakh tradition and Islamic values",
      articlesSub: "Short explanations, family reading and practical guidance",
      openOnSite: "Open on site",
      allArticles: "All articles",
      favoritesTitle: "Favorites",
      favoritesLead: "Saved traditions and articles",
      favoritesEmpty: "No favorites yet",
      favoritesEmptyHint: "Bookmark a tradition or article to save it here.",
      favoriteTypeTopic: "Tradition",
      favoriteTypeArticle: "Article",
      filterAll: "All",
      filterFamily: "Family",
      filterSocial: "Society",
      filterCeremony: "Ceremony",
      filterFaith: "Faith link",
      topicsCount: (n: number) => `${n} topics`,
      dinDasturConnectionTitle: "Faith, tradition, and custom",
      dinDasturPointsTitle: "Three clear points",
      dinDasturRulesTitle: "Core rules",
      dinDasturFoundationBtn: "Read the foundation",
      dinDasturYrymBtn: "Customs and faith",
      dinDasturBataBtn: (n: number) => `Blessing texts (${n})`,
      asylSozCtaTitle: "Noble words",
      asylSozCtaSub: "Abai · Zhambyl · Mukagali · Magzhan and other poets",
      asylSozCtaA11y: "Open words of Kazakh poets",
      sanaSozCtaTitle: "Mind-opening words",
      sanaSozCtaSub: "Thought · knowledge · self-knowledge · patience · truth",
      sanaSozCtaA11y: "Open mind-expanding wisdom",
      bataCountLabel: (n: number) => `${n} blessings`,
      bataShowMore: (n: number) => `Show ${n} more`,
      bataShowLess: "Show less",
      topicNotFound: "Tradition not found",
      aboutTraditionTitle: "In short",
      originTitle: "Where it came from",
      religionLinkTitle: "How it fits with faith",
      superstitionLimitTitle: "Where the limit is",
      religionLinkLead: "Below — how this custom relates to faith: first the fit, then the limit.",
      howToHoldTitle: "How to observe it",
      bataTextsTitle: "Blessing texts",
      relatedArticlesTitle: "Related articles",
      quickChewTitle: "Quick explainers",
      quickChewLead: "Four core traditions — history, sharia ruling and faith link.",
      quickHistoryLabel: "🔍 Origin history:",
      quickShariatLabel: "⚖️ Sharia ruling:",
      quickEvidenceLabel: "📖 Link to religion (evidence):",
      quickReadFull: "Read full content",
      traditionEvidenceHint: "Short evidence — to understand the faith link. Full rulings — with a teacher.",
      traditionEvidenceDisclaimer:
        "This is a short meaning. For full text and rulings see Quran, hadith and muftiate guidance.",
      introDetail:
        "Tradition is society's long-tested practice; sharia is Allah's command and the Prophet's ﷺ sunnah. They go together only when they do not harm people, family or neighbors.\n\n" +
        "Ayah numbers on this screen are for reference; confirm madhhab specifics with your national religious authority.",
    },
    ky: {
      nothingFound: "Эч нерсе табылган жок",
      elderReadBtn: "Улгайгандарга үн чыгарып окуу",
      emptySearch: "Ылайыктуу бөлүм табылган жок.",
      topicsLeadShort: "Салттын дин менен байланышы — түшүнүктүү темалар",
      aboutSectionTitle: "Бул бөлүм эмне жөнүндө?",
      aboutSectionBody:
        "Казак салты ислам менен кантип шайкеш келерин жана ырымдардын кайсынысы динге туура, кайсынысы чектен чыгарын кыска жана ачык түшүндүрөт. Теманы басып толук окуңуз — ичинде кошумча баскычтар жок.",
      searchPlaceholderShort: "Издөө: ырым, бата, той...",
      articlesTitle: "Макалалар",
      articlesLead: "Казак салты жана ислам баалуулуктары",
      articlesSub: "Кыска түшүндүрмө, үй-бүлөлүк окуу жана практикалык багыт",
      openOnSite: "Сайтта ачуу",
      allArticles: "Бардык макалалар",
      favoritesTitle: "Тандалмалар",
      favoritesLead: "Сакталган салттар жана макалалар",
      favoritesEmpty: "Азырынча тандалма жок",
      favoritesEmptyHint: "Салт же макаланы bookmark менен сактаңыз.",
      favoriteTypeTopic: "Салт",
      favoriteTypeArticle: "Макала",
      filterAll: "Баары",
      filterFamily: "Үй-бүлө",
      filterSocial: "Коом",
      filterCeremony: "Ырым",
      filterFaith: "Дин менен байланыш",
      topicsCount: (n: number) => `${n} тема`,
      dinDasturConnectionTitle: "Дин, салт жана ырым",
      dinDasturPointsTitle: "Үч анык ой",
      dinDasturRulesTitle: "Негизги эрежелер",
      dinDasturFoundationBtn: "Негизди окуу",
      dinDasturYrymBtn: "Ырымдар жана дин",
      dinDasturBataBtn: (n: number) => `Бата тексттери (${n})`,
      asylSozCtaTitle: "Асыл сөздөр",
      asylSozCtaSub: "Абай · Жамбыл · Мукагали · Магжан жана башка акындар",
      asylSozCtaA11y: "Казак акындарынын сөздөрүн ачуу",
      sanaSozCtaTitle: "Аң-сезимди ача турган сөздөр",
      sanaSozCtaSub: "Ой · билим · өзүн таануу · сабыр · чындык",
      sanaSozCtaA11y: "Аң-сезимди ача турган дааналык сөздөрдү ачуу",
      bataCountLabel: (n: number) => `${n} бата`,
      bataShowMore: (n: number) => `Дагы ${n} көрсөтүү`,
      bataShowLess: "Жыюу",
      topicNotFound: "Салт табылган жок",
      aboutTraditionTitle: "Кыскача",
      originTitle: "Кайдан чыкты",
      religionLinkTitle: "Дин менен кантип шайкеш",
      superstitionLimitTitle: "Кайда чек бар",
      religionLinkLead: "Төмөндө — бул салттын дин менен байланышы: адегенде шайкештиги, андан соң чеги.",
      howToHoldTitle: "Кантип кармоо керек",
      bataTextsTitle: "Бата тексттери",
      relatedArticlesTitle: "Байланыштуу макалалар",
      quickChewTitle: "Кыска түшүндүрүү",
      quickChewLead: "Негизги 4 салт — тарыхы, шариат өкүмү жана дин менен байланышы.",
      quickHistoryLabel: "🔍 Чыгуу тарыхы:",
      quickShariatLabel: "⚖️ Шариаттагы өкүмү:",
      quickEvidenceLabel: "📖 Дин менен байланышы (далил):",
      quickReadFull: "Толук мазмунду окуу",
      traditionEvidenceHint: "Кыска далил — дин менен байланышты түшүнүү үчүн. Толук өкүм — устаз менен.",
      traditionEvidenceDisclaimer:
        "Бул кыска маани. Толук текст жана өкүм үчүн Куран, хадис жана муфтият түшүндүрмөсүн караңыз.",
      introDetail:
        "Салт — коомдун узак убакытта сыналган тажрыйбасы; шариат — Аалланын буйругу жана Пайгамбардын ﷺ сүннөтү. Адамга, үй-бүлөгө жана коңшуга зыяны жок болсо гана бирге жүрөт.\n\n" +
        "Бул экрандагы аят номерлери багыт берүү үчүн; мазхабтык өзгөчөлүктөрдү улуттук диний башкармалык нускамасы менен ырастаңыз.",
    },
    uz: {
      nothingFound: "Hech narsa topilmadi",
      elderReadBtn: "Kattalarga ovoz chiqarib o'qish",
      emptySearch: "Mos bo'lim topilmadi.",
      topicsLeadShort: "Urf-odatning din bilan bog'liqligi — tushunarli mavzular",
      aboutSectionTitle: "Bu bo'lim nima haqida?",
      aboutSectionBody:
        "Qozoq urf-odatlarining islom bilan qanday uyg'unlashishini va qaysi e'tiqodlar dinga mos, qaysilari chegaradan chiqishini qisqa va aniq tushuntiradi. Mavzuni bosib to'liq o'qing — ichida ortiqcha tugmalar yo'q.",
      searchPlaceholderShort: "Qidiruv: e'tiqod, duo, to'y...",
      articlesTitle: "Maqolalar",
      articlesLead: "Qozoq an'anasi va islom qadriyatlari",
      articlesSub: "Qisqa izoh, oilaviy o'qish va amaliy yo'nalish",
      openOnSite: "Saytda ochish",
      allArticles: "Barcha maqolalar",
      favoritesTitle: "Sevimlilar",
      favoritesLead: "Saqlangan an'analar va maqolalar",
      favoritesEmpty: "Hozircha sevimli yo'q",
      favoritesEmptyHint: "An'ana yoki maqolani bookmark orqali saqlang.",
      favoriteTypeTopic: "An'ana",
      favoriteTypeArticle: "Maqola",
      filterAll: "Hammasi",
      filterFamily: "Oila",
      filterSocial: "Jamiyat",
      filterCeremony: "Marosim",
      filterFaith: "Din bilan bog'liq",
      topicsCount: (n: number) => `${n} mavzu`,
      dinDasturConnectionTitle: "Din, an'ana va urf",
      dinDasturPointsTitle: "Uch aniq fikr",
      dinDasturRulesTitle: "Asosiy qoidalar",
      dinDasturFoundationBtn: "Asosni o'qish",
      dinDasturYrymBtn: "Urf-odat va din",
      dinDasturBataBtn: (n: number) => `Duo matnlari (${n})`,
      asylSozCtaTitle: "Asil so'zlar",
      asylSozCtaSub: "Abay · Jambul · Mukagali · Magjan va boshqa shoirlar",
      asylSozCtaA11y: "Qozoq shoirlari so'zlarini ochish",
      sanaSozCtaTitle: "Ongni ochadigan so'zlar",
      sanaSozCtaSub: "Fikr · bilim · o'zini bilish · sabr · haqiqat",
      sanaSozCtaA11y: "Ongni ochadigan donolik so'zlarini ochish",
      bataCountLabel: (n: number) => `${n} duo`,
      bataShowMore: (n: number) => `Yana ${n} ko'rsatish`,
      bataShowLess: "Yig'ish",
      topicNotFound: "An'ana topilmadi",
      aboutTraditionTitle: "Qisqacha",
      originTitle: "Qayerdan kelgan",
      religionLinkTitle: "Din bilan qanday uyg'un",
      superstitionLimitTitle: "Chegara qayerda",
      religionLinkLead: "Pastda — bu an'ananing din bilan bog'liqligi: avval uyg'unlik, keyin chegara.",
      howToHoldTitle: "Qanday tutish kerak",
      bataTextsTitle: "Duo matnlari",
      relatedArticlesTitle: "Bog'liq maqolalar",
      quickChewTitle: "Qisqa tushuntirish",
      quickChewLead: "Asosiy 4 an'ana — tarixi, shariat hukmi va din bilan bog'liqligi.",
      quickHistoryLabel: "🔍 Kelib chiqish tarixi:",
      quickShariatLabel: "⚖️ Shariatdagi hukmi:",
      quickEvidenceLabel: "📖 Din bilan bog'liqligi (dalil):",
      quickReadFull: "To'liq mazmunni o'qish",
      traditionEvidenceHint: "Qisqa dalil — din bilan bog'liqlikni tushunish uchun. To'liq hukm — ustoz bilan.",
      traditionEvidenceDisclaimer:
        "Bu qisqa ma'no. To'liq matn va hukm uchun Qur'on, hadis va muftiyat izohini ko'ring.",
      introDetail:
        "An'ana — jamiyatning uzoq sinovdan o'tgan tajribasi; shariat — Allohning buyrug'i va Payg'ambar ﷺ sunnati. Ularning birga yurishi faqat odam, oila va qo'shniga zarar yetkazmasa mumkin.\n\n" +
        "Bu ekrandagi oyat raqamlari yo'naltirish uchun; mazhab xususiyatlarini milliy diniy boshqarma ko'rsatmasi bilan tasdiqlang.",
    },
    tr: {
      nothingFound: "Hiçbir şey bulunamadı",
      elderReadBtn: "Yaşlılar için sesli okuma",
      emptySearch: "Uygun bölüm bulunamadı.",
      topicsLeadShort: "Geleneklerin dinle ilişkisi — anlaşılır konular",
      aboutSectionTitle: "Bu bölüm ne hakkında?",
      aboutSectionBody:
        "Kazak geleneklerinin İslam ile nasıl uyuştuğunu ve hangi batıl inanışların dine uygun, hangilerinin aşırı olduğunu kısa ve net açıklar. Bir konuya basıp tam okuyun — içinde ekstra düğme yok.",
      searchPlaceholderShort: "Ara: batıl, dua, düğün...",
      articlesTitle: "Makaleler",
      articlesLead: "Kazak geleneği ve İslam değerleri",
      articlesSub: "Kısa açıklama, ailece okuma ve pratik yön",
      openOnSite: "Sitede aç",
      allArticles: "Tüm makaleler",
      favoritesTitle: "Favoriler",
      favoritesLead: "Kayıtlı gelenekler ve makaleler",
      favoritesEmpty: "Henüz favori yok",
      favoritesEmptyHint: "Gelenek veya makaleyi yer imiyle kaydedin.",
      favoriteTypeTopic: "Gelenek",
      favoriteTypeArticle: "Makale",
      filterAll: "Tümü",
      filterFamily: "Aile",
      filterSocial: "Toplum",
      filterCeremony: "Tören",
      filterFaith: "Dinle bağlantı",
      topicsCount: (n: number) => `${n} konu`,
      dinDasturConnectionTitle: "Din, gelenek ve âdet",
      dinDasturPointsTitle: "Üç net fikir",
      dinDasturRulesTitle: "Temel kurallar",
      dinDasturFoundationBtn: "Temeli oku",
      dinDasturYrymBtn: "Âdetler ve din",
      dinDasturBataBtn: (n: number) => `Dua metinleri (${n})`,
      asylSozCtaTitle: "Asil sözler",
      asylSozCtaSub: "Abay · Jambıl · Mukagali · Magcan ve diğer şairler",
      asylSozCtaA11y: "Kazak şairlerinin sözlerini aç",
      sanaSozCtaTitle: "Zihni açan sözler",
      sanaSozCtaSub: "Düşünce · bilgi · kendini tanıma · sabır · hakikat",
      sanaSozCtaA11y: "Zihni açan bilgelik sözlerini aç",
      bataCountLabel: (n: number) => `${n} dua`,
      bataShowMore: (n: number) => `${n} tane daha göster`,
      bataShowLess: "Daralt",
      topicNotFound: "Gelenek bulunamadı",
      aboutTraditionTitle: "Kısaca",
      originTitle: "Nereden geldi",
      religionLinkTitle: "Dinle nasıl uyumlu",
      superstitionLimitTitle: "Sınır nerede",
      religionLinkLead: "Aşağıda — bu geleneğin dinle bağı: önce uyum, sonra sınır.",
      howToHoldTitle: "Nasıl tutulmalı",
      bataTextsTitle: "Dua metinleri",
      relatedArticlesTitle: "İlgili makaleler",
      quickChewTitle: "Kısa açıklama",
      quickChewLead: "Temel 4 gelenek — tarihi, şeriat hükmü ve dinle bağı.",
      quickHistoryLabel: "🔍 Köken tarihi:",
      quickShariatLabel: "⚖️ Şeriat hükmü:",
      quickEvidenceLabel: "📖 Dinle bağlantısı (delil):",
      quickReadFull: "Tam içeriği oku",
      traditionEvidenceHint: "Kisa delil — din baglantisini anlamak icin. Tam hukm — bir ogretmenle.",
      traditionEvidenceDisclaimer:
        "Bu kisa manadir. Tam metin ve hukm icin Kur'an, hadis ve müftülük açiklamasina bakin.",
      introDetail:
        "Gelenek — toplumun uzun sürede sınanmış deneyimi; şeriat — Allah'ın emri ve Peygamber'in ﷺ sünnetidir. İnsana, aileye ve komşuya zarar vermediği sürece birlikte yürürler.\n\n" +
        "Bu ekrandaki ayet numaraları yön bulmak içindir; mezhep özelliklerini ulusal dinî idarenin rehberliğiyle doğrulayın.",
    },
    ar: {
      nothingFound: "لم يُعثر على شيء",
      elderReadBtn: "قراءة بصوت عالٍ لكبار السن",
      emptySearch: "لم يُعثر على قسم مناسب.",
      topicsLeadShort: "علاقة العادات بالدين — مواضيع واضحة",
      aboutSectionTitle: "عمّ يتحدث هذا القسم؟",
      aboutSectionBody:
        "يشرح باختصار ووضوح كيف تتوافق العادات الكازاخية مع الإسلام وأي الخرافات توافق الدين وأيها يتجاوز حدوده. اضغط موضوعًا واقرأ كاملًا — بلا أزرار إضافية داخله.",
      searchPlaceholderShort: "بحث: خرافة، دعاء، زفاف…",
      articlesTitle: "مقالات",
      articlesLead: "التقاليد الكازاخية وقيم الإسلام",
      articlesSub: "شرح موجز وقراءة أسرية واتجاه عملي",
      openOnSite: "فتح في الموقع",
      allArticles: "كل المقالات",
      favoritesTitle: "المفضلة",
      favoritesLead: "تقاليد ومقالات محفوظة",
      favoritesEmpty: "لا مفضّلات بعد",
      favoritesEmptyHint: "احفظ تقليدًا أو مقالة عبر الإشارة المرجعية.",
      favoriteTypeTopic: "تقليد",
      favoriteTypeArticle: "مقالة",
      filterAll: "الكل",
      filterFamily: "الأسرة",
      filterSocial: "المجتمع",
      filterCeremony: "شعيرة",
      filterFaith: "الصلة بالدين",
      topicsCount: (n: number) => `${n} موضوع`,
      dinDasturConnectionTitle: "الدين والتقليد والعادات",
      dinDasturPointsTitle: "ثلاث أفكار واضحة",
      dinDasturRulesTitle: "قواعد أساسية",
      dinDasturFoundationBtn: "اقرأ الأساس",
      dinDasturYrymBtn: "العادات والدين",
      dinDasturBataBtn: (n: number) => `نصوص الدعاء (${n})`,
      asylSozCtaTitle: "كلمات نبيلة",
      asylSozCtaSub: "أباي · جامبيل · موكاغالي · ماغجان وشعراء آخرون",
      asylSozCtaA11y: "فتح كلمات الشعراء الكازاخ",
      sanaSozCtaTitle: "كلمات تفتح العقل",
      sanaSozCtaSub: "فكر · علم · معرفة النفس · صبر · حق",
      sanaSozCtaA11y: "فتح كلمات الحكمة التي توسّع الوعي",
      bataCountLabel: (n: number) => `${n} دعاء`,
      bataShowMore: (n: number) => `عرض ${n} إضافية`,
      bataShowLess: "طيّ",
      topicNotFound: "لم يُعثر على التقليد",
      aboutTraditionTitle: "باختصار",
      originTitle: "من أين جاء",
      religionLinkTitle: "كيف يوافق الدين",
      superstitionLimitTitle: "أين الحد",
      religionLinkLead: "أدناه — صلة هذا التقليد بالدين: أولاً الوفاق، ثم الحد.",
      howToHoldTitle: "كيف يُراعى",
      bataTextsTitle: "نصوص الدعاء",
      relatedArticlesTitle: "مقالات ذات صلة",
      quickChewTitle: "شرح موجز",
      quickChewLead: "أربعة تقاليد أساسية — التاريخ وحكم الشرع والصلة بالدين.",
      quickHistoryLabel: "🔍 تاريخ الأصل:",
      quickShariatLabel: "⚖️ الحكم الشرعي:",
      quickEvidenceLabel: "📖 الصلة بالدين (دليل):",
      quickReadFull: "قراءة المحتوى الكامل",
      traditionEvidenceHint: "دليل مختصر — لفهم الصلة بالدين. الحكم الكامل — مع معلم.",
      traditionEvidenceDisclaimer:
        "هذا معنى مختصر. للنص الكامل والحكم انظر القرآن والحديث وإرشاد المفتية.",
      introDetail:
        "التقليد — تجربة المجتمع المجرّبة عبر الزمن؛ والشريعة — أمر الله وسنة النبي ﷺ. يمكن أن يسيرا معًا ما لم يضرا بالناس والأسرة والجيران.\n\n" +
        "أرقام الآيات في هذه الشاشة للإرشاد؛ أكّد خصوصيات المذهب بإرشاد الإدارة الدينية الوطنية.",
    },
  } as const;
  return map[locale];
}

type LeakLocale = "ru" | "en" | "ky" | "uz" | "tr" | "ar";

function traditionTileSub(locale: LeakLocale): string {
  const map = {
    ru: "Связь обычаев и ырым с религией",
    en: "How customs relate to faith",
    ky: "Ырым менен салттын динге катышы",
    uz: "Urf-odatning din bilan bog'liqligi",
    tr: "Gelenek ve din baglantisi",
    ar: "صلة العادات بالدين",
  } as const;
  return map[locale];
}

function traditionIntroLine(locale: LeakLocale): string {
  const map = {
    ru: "Простыми словами: как традиция и ырым связаны с религией. В каждой теме — как сочетается и где граница.",
    en: "In plain words: how tradition and custom relate to faith. Each topic covers fit and limit.",
    ky: "Жөнөкөй тил менен: салт менен ырымдын динге катышы. Ар темада — кантип туура жана чеги.",
    uz: "Oddiy til bilan: an'ana va urfning din bilan bog'liqligi. Har mavzuda — qanday uyg'un va chegara.",
    tr: "Sade dilde: gelenek ve adetin dinle bagisi. Her konuda uyum ve sinir.",
    ar: "بكلمات بسيطة: صلة التقليد والعادات بالدين. في كل موضوع: الوفاق والحد.",
  } as const;
  return map[locale];
}

function namazCompanionChrome(locale: LeakLocale) {
  const map = {
    ru: {
      screenTitle: "Сопровождение суджуда",
      pickerTitle: "Какой намаз сопровождаем?",
      pickerSub:
        "Пройдите фарз-ракяты шаг за шагом: takbir → киям → руку → суджуд → салам. Ниже — текст тех же шагов.",
      rakatWord: "ракят",
      finish: "Завершить",
      lockedHint: "По шагам",
    },
    en: {
      screenTitle: "Sujood guidance",
      pickerTitle: "Which prayer shall we guide?",
      pickerSub:
        "Walk through fard units step by step: takbir → qiyam → ruku → sujood → salam. Reading text for those steps is below.",
      rakatWord: "unit",
      finish: "Finish",
      lockedHint: "Step by step",
    },
    ky: {
      screenTitle: "Сажда жетектее",
      pickerTitle: "Кай намазды жетектейбиз?",
      pickerSub:
        "Фарз ракаттарды кадам-кадам өтүңүз: takbir → кыям → руку → сажда → салам. Төмөндө окуу тексти да бар.",
      rakatWord: "ракат",
      finish: "Аяктоо",
      lockedHint: "Кадам боюнча",
    },
    uz: {
      screenTitle: "Sajda yo'lboshchisi",
      pickerTitle: "Qaysi namozni kuzatamiz?",
      pickerSub:
        "Farzy rak'atlarni qadam-baqadam o'ting: takbir → qiyom → ruku → sajda → salom. Pastda o'qish matni ham bor.",
      rakatWord: "rak'at",
      finish: "Tugatish",
      lockedHint: "Qadam bo'yicha",
    },
    tr: {
      screenTitle: "Secde rehberi",
      pickerTitle: "Hangi namazi rehberleyelim?",
      pickerSub:
        "Farz rekatlari adim adim gecin: tekbir → kiyam → rüku → secde → selam. Asagida okuma metni de var.",
      rakatWord: "rekat",
      finish: "Bitir",
      lockedHint: "Adim adim",
    },
    ar: {
      screenTitle: "إرشاد السجود",
      pickerTitle: "أي صلاة نرشد؟",
      pickerSub:
        "امشِ في ركعات الفرض خطوة بخطوة: تكبير → قيام → ركوع → سجود → سلام. وفي الأسفل نص القراءة.",
      rakatWord: "ركعة",
      finish: "إنهاء",
      lockedHint: "خطوة بخطوة",
    },
  } as const;
  return map[locale];
}

function alphabetTajweedChrome(locale: LeakLocale) {
  const map = {
    ru: {
      shortTitle: "Алфавит",
      screenTitle: "Арабский алфавит",
      alphabetHeading: "Арабский алфавит",
      intro:
        "С нуля: буква → учебник → чтение Корана. Сначала 28 букв, затем звук и правила, потом учебник; когда готовы — сразу откройте Аль-Фатиху.",
      sectionAlphabet: "Шаг 1",
      sectionLaterTitle: "Шаг 2: звук и правила",
      sectionLaterSub: "После букв — звук, продление, гунна",
      sectionBook: "Шаг 3: полный учебник",
      sectionQuranColors: "Позже: цветные знаки в Коране",
      quranColorsHint:
        "После букв и правил. Цвета — вспомогательная помощь, в начале знать их не обязательно.",
      alphabetTapHint:
        "Нажмите букву — услышите название. Красный — твёрдый (тафхим), чёрный — мягкий (таркик).",
      alphabetSelectHint: "Выберите букву — здесь появятся название, звук и короткий пример.",
      alphabetToneHeavy: "Звук: твёрдый (тафхим)",
      alphabetToneLight: "Звук: мягкий (таркик)",
      alphabetExampleLabel: "Пример",
      alphabetLegendHeavy: "Твёрдый",
      alphabetLegendLight: "Мягкий",
      openQuranCta: "Читать Коран · Аль-Фатиха",
      openQuranHint: "Выучите буквы и сразу переходите к чтению с цветами таджвида.",
      openQuranA11y: "Открыть Аль-Фатиху с цветами таджвида",
      openColoredListCta: "Суры с цветами",
      openColoredListA11y: "Открыть список сур с цветами таджвида",
      practiceCtaTitle: "Читать Коран · Аль-Фатиха",
      practiceCtaHint: "Выучите буквы и сразу переходите к чтению с цветами таджвида.",
      practiceCtaA11y: "Открыть Аль-Фатиху с цветами таджвида",
    },
    en: {
      shortTitle: "Alphabet",
      intro:
        "From zero: letters → textbook → Quran reading. First the 28 letters, then sound and rules, then the textbook; when ready, open Al-Fatiha right away.",
      sectionAlphabet: "Step 1",
      sectionLaterTitle: "Step 2: sound and rules",
      sectionLaterSub: "After letters — sound, madd, ghunnah",
      sectionBook: "Step 3: full textbook",
      sectionQuranColors: "Later: colored marks in the Quran",
      quranColorsHint:
        "After letters and rules. Colors are optional help; you do not need them at the start.",
      alphabetTapHint:
        "Tap a letter to hear its name. Red — heavy (tafkhīm), black — light (tarqīq).",
      alphabetSelectHint: "Pick a letter — name, sound and a short example show here.",
      alphabetToneHeavy: "Sound: heavy (tafkhīm)",
      alphabetToneLight: "Sound: light (tarqīq)",
      openQuranCta: "Read Quran · Al-Fatiha",
      openQuranHint: "Learn the letters, then jump straight into reading with tajweed colors.",
      openQuranA11y: "Open Al-Fatiha with tajweed colors",
      openColoredListCta: "Surahs with colors",
      openColoredListA11y: "Open the list of surahs with tajweed colors",
      practiceCtaTitle: "Read Quran · Al-Fatiha",
      practiceCtaHint: "Learn the letters, then jump straight into reading with tajweed colors.",
      practiceCtaA11y: "Open Al-Fatiha with tajweed colors",
    },
    ky: {
      shortTitle: "Алфавит",
      intro:
        "Нөлдөн: тамга → окуу китеби → Куран окуу. Адегенде 28 тамга, андан кийин үн жана эрежелер, кийин окуу китеби; даяр болсоңуз — дароо Ал-Фатиханы ачыңыз.",
      sectionAlphabet: "1-кадам",
      sectionLaterTitle: "2-кадам: үн жана эрежелер",
      sectionLaterSub: "Тамгалардан кийин — үн, узартуу, гунна",
      sectionBook: "3-кадам: толук окуу китеби",
      sectionQuranColors: "Кийин: Курандагы түстүү белгилер",
      quranColorsHint:
        "Тамга жана эрежеден кийин. Түстөр — кошумча жардам, башында билүү милдеттүү эмес.",
      alphabetTapHint:
        "Тамганы басыңыз — аты окулат. Кызыл — жоон (тафхим), кара — ичке (таркик).",
      alphabetSelectHint: "Тамганы тандаңыз — аты, үнү жана кыска мисал ушул жерде чыгат.",
      alphabetToneHeavy: "Үн: жоон (тафхим)",
      alphabetToneLight: "Үн: ичке (таркик)",
      openQuranCta: "Куран окуу · Ал-Фатиха",
      openQuranHint: "Тамганы үйрөнүп, дароо тажвид түстөрү менен окууга өтүңүз.",
      openQuranA11y: "Ал-Фатиханы тажвид түстөрү менен ачуу",
      openColoredListCta: "Түстөр менен сүрөлөр",
      openColoredListA11y: "Тажвид түстөрү менен сүрөлөр тизмесин ачуу",
      practiceCtaTitle: "Куран окуу · Ал-Фатиха",
      practiceCtaHint: "Тамганы үйрөнүп, дароо тажвид түстөрү менен окууга өтүңүз.",
      practiceCtaA11y: "Ал-Фатиханы тажвид түстөрү менен ачуу",
    },
    uz: {
      shortTitle: "Alifbo",
      intro:
        "Noldan: harf → darslik → Qur'on o'qish. Avval 28 harf, keyin tovush va qoidalar, so'ng darslik; tayyor bo'lsangiz — darhol Al-Fotihani oching.",
      sectionAlphabet: "1-qadam",
      sectionLaterTitle: "2-qadam: tovush va qoidalar",
      sectionLaterSub: "Harflardan keyin — tovush, cho'zish, g'unna",
      sectionBook: "3-qadam: to'liq darslik",
      sectionQuranColors: "Keyin: Qur'ondagi rangli belgilar",
      quranColorsHint:
        "Harf va qoidalardan keyin. Ranglar — qo'shimcha yordam, boshida bilish shart emas.",
      alphabetTapHint:
        "Harfni bosing — nomi o'qiladi. Qizil — qalin (tafxim), qora — yupqa (tarqiq).",
      alphabetSelectHint: "Harfni tanlang — nomi, ovozi va qisqa misol shu yerda chiqadi.",
      alphabetToneHeavy: "Tovush: qalin (tafxim)",
      alphabetToneLight: "Tovush: yupqa (tarqiq)",
      openQuranCta: "Qur'on o'qish · Al-Fotiha",
      openQuranHint: "Harflarni o'rganib, darhol tajvid ranglari bilan o'qishga o'ting.",
      openQuranA11y: "Al-Fotihani tajvid ranglari bilan ochish",
      openColoredListCta: "Rangli suralar",
      openColoredListA11y: "Tajvid ranglari bilan suralar ro'yxatini ochish",
      practiceCtaTitle: "Qur'on o'qish · Al-Fotiha",
      practiceCtaHint: "Harflarni o'rganib, darhol tajvid ranglari bilan o'qishga o'ting.",
      practiceCtaA11y: "Al-Fotihani tajvid ranglari bilan ochish",
    },
    tr: {
      shortTitle: "Alfabe",
      intro:
        "Sifirdan: harf → ders kitabi → Kur'an okuma. Once 28 harf, sonra ses ve kurallar, sonra ders kitabi; hazirsaniz hemen Fatiha'yi acin.",
      sectionAlphabet: "1. adim",
      sectionLaterTitle: "2. adim: ses ve kurallar",
      sectionLaterSub: "Harflerden sonra — ses, uzatma, gunne",
      sectionBook: "3. adim: tam ders kitabi",
      sectionQuranColors: "Sonra: Kur'andaki renkli isaretler",
      quranColorsHint:
        "Harf ve kurallardan sonra. Renkler yardimcidir; bastta bilmek zorunlu degil.",
      alphabetTapHint:
        "Harfe basin — adi okunur. Kirmizi — kalin (tafhim), siyah — ince (tarkik).",
      alphabetSelectHint: "Harf secin — adi, sesi ve kisa ornek burada gorünür.",
      alphabetToneHeavy: "Ses: kalin (tafhim)",
      alphabetToneLight: "Ses: ince (tarkik)",
      openQuranCta: "Kur'an oku · Fatiha",
      openQuranHint: "Harfleri ogrenip hemen tecvid renkleriyle okumaya gecin.",
      openQuranA11y: "Fatiha'yi tecvid renkleriyle ac",
      openColoredListCta: "Renkli sureler",
      openColoredListA11y: "Tecvid renkli sure listesini ac",
      practiceCtaTitle: "Kur'an oku · Fatiha",
      practiceCtaHint: "Harfleri ogrenip hemen tecvid renkleriyle okumaya gecin.",
      practiceCtaA11y: "Fatiha'yi tecvid renkleriyle ac",
    },
    ar: {
      shortTitle: "الألفباء",
      intro:
        "من الصفر: الحرف → الكتاب → قراءة القرآن. أولاً ٢٨ حرفاً، ثم الصوت والقواعد، ثم الكتاب؛ وإن كنت جاهزاً فافتح الفاتحة مباشرة.",
      sectionAlphabet: "الخطوة 1",
      sectionLaterTitle: "الخطوة 2: الصوت والقواعد",
      sectionLaterSub: "بعد الحروف — الصوت والمد والغنة",
      sectionBook: "الخطوة 3: الكتاب الكامل",
      sectionQuranColors: "لاحقًا: علامات الألوان في القرآن",
      quranColorsHint:
        "بعد الحروف والقواعد. الألوان مساعدة إضافية وليست ضرورية في البداية.",
      alphabetTapHint:
        "اضغط الحرف — يُقرأ اسمه. الأحمر مفخّم، والأسود مرقّق.",
      alphabetSelectHint: "اختر حرفًا — يظهر الاسم والصوت ومثال قصير هنا.",
      alphabetToneHeavy: "الصوت: مفخّم",
      alphabetToneLight: "الصوت: مرقّق",
      openQuranCta: "قراءة القرآن · الفاتحة",
      openQuranHint: "تعلّم الحروف ثم انتقل مباشرة للقراءة بألوان التجويد.",
      openQuranA11y: "فتح الفاتحة بألوان التجويد",
      openColoredListCta: "سور بالألوان",
      openColoredListA11y: "فتح قائمة السور بألوان التجويد",
      practiceCtaTitle: "قراءة القرآن · الفاتحة",
      practiceCtaHint: "تعلّم الحروف ثم انتقل مباشرة للقراءة بألوان التجويد.",
      practiceCtaA11y: "فتح الفاتحة بألوان التجويد",
    },
  } as const;
  return map[locale];
}

function prayerNotifAcceptanceIos(locale: LeakLocale): string[] {
  const map = {
    ru: [
      "1. Дайте разрешение на уведомления.",
      "2. iOS 26+: дайте разрешение AlarmKit (будильник) — полный азан на экране блокировки.",
      "3. «Locked-screen QA (90 сек)» → сразу заблокируйте → системный будильник / кнопка Азан.",
      "4. Нажмите «Азан» → экран PrayerAzan + полный звук.",
      "5. iOS 18 и ниже: Time Sensitive уведомление + полный экран по нажатию.",
    ],
    en: [
      "1. Allow notification permission.",
      "2. iOS 26+: allow AlarmKit (alarm) — full azan on the lock screen.",
      "3. «Locked-screen QA (90s)» → lock immediately → system alarm / Azan button.",
      "4. Tap «Azan» → PrayerAzan screen + full sound.",
      "5. iOS 18 and below: Time Sensitive notification + full screen on tap.",
    ],
    ky: [
      "1. Билдирүү уруксатын бериңиз.",
      "2. iOS 26+: AlarmKit (ойготкуч) уруксатын бериңиз — кулпуланган экранда толук азан.",
      "3. «Locked-screen QA (90 сек)» → дароо кулпулаңыз → системалык ойготкуч / Азан баскычы.",
      "4. «Азан» баскычын басыңыз → PrayerAzan экраны + толук үн.",
      "5. iOS 18 жана төмөн: Time Sensitive билдирүү + басканда толук экран.",
    ],
    uz: [
      "1. Bildirishnoma ruxsatini bering.",
      "2. iOS 26+: AlarmKit (signal) ruxsatini bering — qulflangan ekranda to'liq azon.",
      "3. «Locked-screen QA (90 sek)» → darhol qulflang → tizim signali / Azon tugmasi.",
      "4. «Azon» tugmasini bosing → PrayerAzan ekrani + to'liq ovoz.",
      "5. iOS 18 va pastroq: Time Sensitive bildirishnoma + bosganda to'liq ekran.",
    ],
    tr: [
      "1. Bildirim iznini verin.",
      "2. iOS 26+: AlarmKit (alarm) iznini verin — kilit ekraninda tam ezan.",
      "3. «Locked-screen QA (90 sn)» → hemen kilitleyin → sistem alarmi / Ezan dugmesi.",
      "4. «Ezan» dugmesine basin → PrayerAzan ekrani + tam ses.",
      "5. iOS 18 ve alti: Time Sensitive bildirim + dokununca tam ekran.",
    ],
    ar: [
      "1. امنح إذن الإشعارات.",
      "2. iOS 26+: امنح إذن AlarmKit (المنبّه) — أذان كامل على شاشة القفل.",
      "3. «Locked-screen QA (90 ث)» → اقفل فورًا → منبّه النظام / زر الأذان.",
      "4. اضغط «أذان» → شاشة PrayerAzan + صوت كامل.",
      "5. iOS 18 وأقل: إشعار Time Sensitive + شاشة كاملة عند الضغط.",
    ],
  } as const;
  return [...map[locale]];
}

export const CRITICAL_UI_LOCALE_PATCHES = {
  ru: {
    dashboard: { traditionTileSub: traditionTileSub("ru") },
    namazCompanion: namazCompanionChrome("ru"),
    common: { close: "Закрыть", back: "Назад", open: "Открыть", continue: "Продолжить", none: "нет", guideAccordionExpand: "открыть", guideAccordionCollapse: "скрыть", appErrorTitle: "Ошибка приложения", appErrorHint: "«Повторить» — попробовать снова. Причину смотрите в логе / на экране.", distanceKmUnit: "км" },
    navigation: {
      savedTab: savedTabRu,
      tabArticles: "Статьи",
      telegramInfo: {
        title: "Telegram-бот",
        featuresLine:
          "Поиск Корана, хадисы, таджвид, хатм, намаз, омовение, кибла, тасбих, голосовые команды",
        botCollectionSuffix: "полный набор в боте.",
        mobileExtra:
          "Мобильное приложение дополняет офлайн-кэшем, уведомлениями и текстом Корана.",
        openBot: "Открыть бота",
      },
    },
    hadith: {
      arabicOriginalLabel: "Арабский оригинал",
      title: "Сахих хадисы",
      hub: {
        searchPlaceholderShort: "Поиск хадиса…",
        searchPlaceholderExamples: "Поиск: намерение, намаз, сосед…",
        listHint:
          "Показываются только хадисы на выбранном языке. Тексты из надёжных источников — без машинного перевода.",
        emptySearch: "По запросу хадис не найден",
        moreShort: "Ещё",
        moreHadithSearchHint: "хадисов. Для точного поиска используйте поиск или категорию.",
      },
    },
    features: {
      halalHeroTagRegistry: "Официальный реестр",
      halalHeroTagVerify: "Проверка продукта",
      halalTabInstitutions: "Учреждения",
      halalTabVerify: "Проверка",
      halalTabMap: "Организации с халяль-сертификатом на карте",
      traditionGuide: traditionChrome("ru"),
      traditionIntro: traditionIntroLine("ru"),
      kaabaLiveTitle: "Кааба — прямой эфир",
      hajjRoadmapTitle: "Дорожная карта хаджа",
      hajjRoadmapLead:
        "От подготовки до умры, основных дней хаджа и дел после возвращения — по порядку.",
      hajjPhasePrepTitle: "1. Подготовка и намерение",
      hajjPhasePrepSub: "понятие, условие, микат, ихрам, тальбия",
      hajjPhaseUmrahTitle: "2. Порядок умры",
      hajjPhaseUmrahSub: "Мекка, таваф, замзам, са‘и, волосы",
      hajjPhaseDaysTitle: "3. Дни хаджа",
      hajjPhaseDaysSub: "Мина, Арафа, Муздалифа, джамарат",
      hajjPhaseZiyarahTitle: "4. Зиярат и особые случаи",
      hajjPhaseZiyarahSub: "Медина, женщины, пожилые, безопасность",
      hajjPhaseAfterTitle: "5. После хаджа",
      hajjPhaseAfterSub: "духовный итог, выводы, схемы",
      hajjKaabaOnlineTitle: "Кааба онлайн",
      hajjKaabaOnlineLive: "Прямой эфир",
      hajjKaabaOnlineA11y: "Кааба онлайн — прямой эфир",
      hajjFullDataLabel: "Полные данные",
      hajjOfficialBookTitle: "Официальная книга ДУМК",
      hajjFullTextLabel: "Полный текст",
      hajjSectionUnit: "раздел",
      hajjTapSectionHint: "Нажмите раздел — текст откроется по порядку.",
    },
    namazGuide: {
      screenTitle: "Учебник намаза",
      studyMapTitle: "Карта обучения",
      studyNamazCardSub: "От омовения до шагов намаза — системное изучение",
      studyMapPickHint: "Выберите раздел. Сначала омовение, затем шаги намаза.",
      wuduHeroTitle: "Омовение",
      wuduCardSub: "Шаги и то, что нарушает",
      fivePrayersTitle: "5 намазов",
      fivePrayersSub: "От намерения до салама",
      rakatTableTitle: "Ракяты и порядок чтения 5 намазов",
      rakatTableHint:
        "Порядок ракятов записан текстом в приложении, не картинкой. При смене языка таблица тоже переводится.",
      afterPrayerDuasTitle: "Дуа после намаза",
      afterPrayerDuasHint:
        "Порядок: сначала Аят аль-Курси, затем дуа Кунут — удобный текст для заучивания.",
    },
    tajweedGuide: {
      ...alphabetTajweedChrome("ru"),
      chaptersTitle: "Разделы",
      chaptersHint:
        "Учебник таджвида на 65 страницах разбит на главы: алфавит, звук, удлинение, гунна, вакф и особые знаки. Нажмите главу — откроется с того места.",
    },
    seerah: { lastLessonLabel: "Последний урок", lastBadge: "Последний" },
    hatim: {
      settingsFootnote:
        "Мушаф, шрифт, чтец и язык перевода — на экране «Настройки Корана».",
    },
    settings: {
      prayerNotifAcceptanceItemsIos: prayerNotifAcceptanceIos("ru"),
      nativeAzanExactAlarmWarning:
        "Чтобы азан звучал точно вовремя на Android, включите разрешение «Точные будильники».",
      languageSectionSub:
        "Меню и навигация на 7 языках: казахский, русский, английский, кыргызский, узбекский, турецкий и арабский.",
      languageKy: "Кыргызча",
      languageUz: "Oʻzbekcha",
      languageTr: "Türkçe",
      languageAr: "العربية",
      quranSectionReadingSub: "Последнее место, язык перевода и транскрипции.",
      quranTranslationLocaleTitle: "Язык перевода",
      quranTranslationLocaleHint:
        "Отдельно от языка приложения. Например: меню на русском, смысл — на казахском.",
      quranTranslationLocaleOption: (id: string) => {
        switch (id) {
          case "ru":
            return "Русский";
          case "en":
            return "English";
          case "tr":
            return "Türkçe";
          case "uz":
            return "Oʻzbekcha";
          case "ky":
            return "Кыргызча";
          default:
            return "Казахский";
        }
      },
      quranTranslitScriptTitle: "Письмо транскрипции",
      quranTranslitScriptHint: "Показывать чтение кириллицей или латиницей.",
      quranTranslitScriptOption: (id: string) => (id === "latin" ? "Латиница" : "Кириллица (казахский)"),
      prayerAzanScreenOnHint:
        "Важно: когда экран включён и телефон в использовании, система может не открыть полноэкранный азан — нажмите уведомление. Для полного экрана проверьте с блокировкой/выключенным экраном.",
      sectionTransparency: "Прозрачность и право",
      sectionTransparencySub: "Независимость, конфиденциальность, потоки данных.",
      transparencyIndependenceTitle: "Независимость",
      transparencyPrivacyTitle: "Политика конфиденциальности",
      transparencyPrivacyOpen: "Открыть политику",
      transparencyDataFlowsTitle: "Потоки данных",
      transparencyUsageAnalyticsTitle: "Статистика приложения",
      transparencyUsageAnalyticsSub:
        "Анонимные события сессии/экрана на api.rahatomir.com (хеш IP). Можно отключить.",
    },
    transparency: {
      independenceShort:
        "RAHAT OMIR — независимый проект. Не официальное приложение ДУМК / Fatua.kz / Muftyat.kz.",
      independenceFull:
        "RAHAT OMIR — независимый исламский сервис. Не официальное мобильное приложение ДУМК, Fatua.kz или Muftyat.kz. По разрешению показываются выдержки/ссылки с официальных сайтов; фетва и хукм не выдаются. Обучение намазу без учёного рецензирования — только учебный материал.",
      dataFlowsBody:
        "Третьи стороны: api.rahatomir.com (аккаунт/синк); Muftyat/Fatua (индекс); api.muftyat.kz и Aladhan (намаз); islamic.network / alquran.cloud (Коран); Google/Apple (OAuth); live.net.sa (Кааба HLS).",
    },
    prayer: {
      sourceCalc: "Расчёт (Muftyat / резерв)",
      sourceMuftyatLive: "Источник: Muftyat.kz",
      sourceAladhanLive: "Источник: резерв Aladhan (ISNA · Hanafi asr)",
      sourceMethodHint:
        "Для городов РК приоритет — api.muftyat.kz. Если недоступен — Aladhan (method 2 / Hanafi asr). Сверьте с расписанием местной мечети — это не знак официального приложения ДУМК.",
    },
    communityDua: {
      stripSub: "Чтение, «аминь» и публикация своей дуа — вместе.",
      listIntro:
        "Можно читать общинные дуа, говорить «Аминь» и отправить свою дуа ниже — кратко и с благим намерением.",
      postingDisabled:
        "Публикация временно закрыта: только чтение и «Аминь».",
      empty: "Пока записей нет.",
      emptyOffline: "Нужен интернет. Список появится при подключении.",
      placeholder: "Напишите дуа…",
    },
    quran: {
      tajweedHelperLegendNote:
        "Шпаргалка (Al Quran Cloud): #537FFF — мадд · #FF7E1E — гунна · #9400A8 — ихфа · #DD0008 — калкала · #169777 — идгам.",
      readerShowMeaningLabel: "Смысл (перевод)",
      meaningCaption: "Смысл (перевод)",
      translitCaption: "Чтение (транскрипция)",
      readerReadingThemeHint: "Белый — светлая страница; Чёрный — тёмный фон.",
      readerReciterHint:
        "Звук для каждого аята загружается из интернета. Смысл на экране — перевод Ерлана Алимулы; аудио «Перевод» — Халифа Алтай (казахский), Эльмир Кулиев (русский), Ibrahim Walk (английский), Диянет (турецкий); кыргызский/узбекский голос — скоро; «Арабские чтецы» — оригинальный таджвид. Если одна версия не играет, выберите другого чтеца.",
    },
  },
  en: {
    dashboard: { traditionTileSub: traditionTileSub("en") },
    namazCompanion: namazCompanionChrome("en"),
    common: {
      close: "Close",
      back: "Back",
      open: "Open",
      continue: "Continue",
      none: "none",
      guideAccordionExpand: "expand",
      guideAccordionCollapse: "collapse",
      appErrorTitle: "App error",
      appErrorHint: "Tap Retry to try again. Check the log or screen for the cause.",
      distanceKmUnit: "km",
    },
    navigation: {
      savedTab: savedTabEn,
      tabArticles: "Articles",
      telegramInfo: {
        title: "Telegram bot",
        featuresLine:
          "Quran search, hadith, tajweed, hatim, prayer guide, wudu, qibla, tasbih, voice commands",
        botCollectionSuffix: "full collection in the bot.",
        mobileExtra: "The mobile app adds offline cache, notifications and Quran text.",
        openBot: "Open bot",
      },
    },
    hadith: {
      arabicOriginalLabel: "Arabic original",
      title: "Sahih hadiths",
      hub: {
        searchPlaceholderShort: "Search hadith…",
        searchPlaceholderExamples: "Search: intention, prayer, neighbor…",
        listHint:
          "Only hadiths in the selected language are shown. Texts come from trusted sources — no machine translation.",
        emptySearch: "No hadith found for this search",
        moreShort: "More",
        moreHadithSearchHint: "hadiths. Use search or a category to find them faster.",
      },
    },
    features: {
      halalHeroTagRegistry: "Official registry",
      halalHeroTagVerify: "Product check",
      halalTabInstitutions: "Institutions",
      halalTabVerify: "Verify",
      halalTabMap: "Halal-certified organizations on the map",
      traditionGuide: traditionChrome("en"),
      traditionIntro: traditionIntroLine("en"),
      kaabaLiveTitle: "Kaaba — live",
      hajjRoadmapTitle: "Hajj roadmap",
      hajjRoadmapLead:
        "From preparation through umrah, the main hajj days and after-return deeds — in order.",
      hajjPhasePrepTitle: "1. Preparation and intention",
      hajjPhasePrepSub: "concept, conditions, miqat, ihram, talbiyah",
      hajjPhaseUmrahTitle: "2. Umrah sequence",
      hajjPhaseUmrahSub: "Makkah, tawaf, zamzam, sa'i, hair",
      hajjPhaseDaysTitle: "3. Hajj days",
      hajjPhaseDaysSub: "Mina, Arafah, Muzdalifah, jamarat",
      hajjPhaseZiyarahTitle: "4. Ziyarah and special cases",
      hajjPhaseZiyarahSub: "Madinah, women, elders, safety",
      hajjPhaseAfterTitle: "5. After hajj",
      hajjPhaseAfterSub: "spiritual outcome, summary, diagrams",
      hajjKaabaOnlineTitle: "Kaaba online",
      hajjKaabaOnlineLive: "Live",
      hajjKaabaOnlineA11y: "Kaaba online — live",
      hajjFullDataLabel: "Full details",
      hajjOfficialBookTitle: "Official SAMK book",
      hajjFullTextLabel: "Full text",
      hajjSectionUnit: "section",
      hajjTapSectionHint: "Tap a section — the text opens in order.",
    },
    namazGuide: {
      screenTitle: "Prayer guide",
      studyMapTitle: "Study map",
      studyNamazCardSub: "From wudu to prayer steps — structured learning",
      studyMapPickHint: "Choose a section. Start with wudu, then prayer steps.",
      wuduHeroTitle: "Wudu",
      wuduCardSub: "Steps and what breaks it",
      fivePrayersTitle: "5 daily prayers",
      fivePrayersSub: "From intention to salam",
      rakatTableTitle: "Rakats and recitation order for 5 prayers",
      rakatTableHint:
        "Rakat order is written as text in the app, not an image. It translates when you change language.",
      afterPrayerDuasTitle: "Duas after prayer",
      afterPrayerDuasHint:
        "Order: first Ayat al-Kursi, then Qunut dua — easy text to memorize.",
    },
    tajweedGuide: {
      ...alphabetTajweedChrome("en"),
      chaptersTitle: "Chapters",
      chaptersHint:
        "A 65-page tajweed textbook split into chapters: alphabet, sound, elongation, ghunnah, waqf and special marks. Tap a chapter to open there.",
    },
    seerah: { lastLessonLabel: "Last lesson", lastBadge: "Latest" },
    hatim: {
      settingsFootnote:
        "Mushaf, font, reciter and translation language are in Quran Settings.",
    },
    settings: {
      prayerNotifAcceptanceItemsIos: prayerNotifAcceptanceIos("en"),
      nativeAzanExactAlarmWarning:
        "On Android, enable Exact alarms so the adhan can fire on time.",
      languageSectionSub:
        "Menus and navigation work in 7 languages: Kazakh, Russian, English, Kyrgyz, Uzbek, Turkish and Arabic.",
      languageKy: "Кыргызча",
      languageUz: "Oʻzbekcha",
      languageTr: "Türkçe",
      languageAr: "العربية",
      quranSectionReadingSub: "Last position, translation language and transcription script.",
      quranTranslationLocaleTitle: "Translation language",
      quranTranslationLocaleHint:
        "Separate from the app language. Example: menus in English, meaning in Kazakh.",
      quranTranslationLocaleOption: (id: string) => {
        switch (id) {
          case "ru":
            return "Russian";
          case "en":
            return "English";
          case "tr":
            return "Turkish";
          case "uz":
            return "Uzbek";
          case "ky":
            return "Kyrgyz";
          default:
            return "Kazakh";
        }
      },
      quranTranslitScriptTitle: "Transcription script",
      quranTranslitScriptHint: "Show reading in Cyrillic or Latin letters.",
      quranTranslitScriptOption: (id: string) => (id === "latin" ? "Latin" : "Cyrillic (Kazakh)"),
      prayerAzanScreenOnHint:
        "Note: when the screen is on and the phone is in use, Android may show only a notification — tap it to open the adhan screen. For full-screen, test with the screen locked/off.",
      sectionTransparency: "Transparency & legal",
      sectionTransparencySub: "Independence, privacy, data flows.",
      transparencyIndependenceTitle: "Independence",
      transparencyPrivacyTitle: "Privacy policy",
      transparencyPrivacyOpen: "Open policy",
      transparencyDataFlowsTitle: "Data flows",
      transparencyUsageAnalyticsTitle: "App analytics",
      transparencyUsageAnalyticsSub:
        "Anonymous session/screen events to api.rahatomir.com (hashed IP). You can turn this off.",
    },
    transparency: {
      independenceShort:
        "RAHAT OMIR is an independent project — not an official QMDB / Fatua.kz / Muftyat.kz app.",
      independenceFull:
        "RAHAT OMIR is an independent Islamic service. It is not the official mobile app of QMDB, Fatua.kz, or Muftyat.kz. Licensed excerpts/links from official sites may appear; no fatwa or ruling is issued. Prayer learning without scholar review is study material only.",
      dataFlowsBody:
        "Third parties: api.rahatomir.com (account/sync); Muftyat/Fatua (index); api.muftyat.kz and Aladhan (prayer); islamic.network / alquran.cloud (Quran); Google/Apple (OAuth); live.net.sa (Kaaba HLS).",
    },
    prayer: {
      sourceCalc: "Calculation (Muftyat / fallback)",
      sourceMuftyatLive: "Source: Muftyat.kz",
      sourceAladhanLive: "Source: Aladhan fallback (ISNA · Hanafi asr)",
      sourceMethodHint:
        "For Kazakhstan cities, api.muftyat.kz is preferred. If unavailable — Aladhan (method 2 / Hanafi asr). Compare with your local mosque — this is not a QMDB official-app mark.",
    },
    communityDua: {
      stripSub: "Read, say Amen, and post your own dua together.",
      listIntro:
        "You can read community duas, say Amen, and send your own dua below — keep it short and sincere.",
      postingDisabled:
        "Posting is temporarily closed: read and Amen only.",
      empty: "No entries yet.",
      emptyOffline: "Internet required. The list appears when you are online.",
      placeholder: "Write your dua…",
    },
    quran: {
      tajweedHelperLegendNote:
        "Cheat sheet: #537FFF — madd · #FF7E1E — ghunnah · #9400A8 — ikhfa · #DD0008 — qalqalah · #169777 — idgham.",
      readerShowMeaningLabel: "Meaning (translation)",
      meaningCaption: "Meaning (translation)",
      translitCaption: "Reading (transcription)",
      readerReadingThemeHint: "White — light page; Black — dark background.",
      readerReciterHint:
        "Ayah audio loads from the internet. On-screen Kazakh meaning is Erlan Alimuly’s translation; «Translation» audio covers Khalifa Altai (Kazakh), Elmir Kuliev (Russian), Ibrahim Walk (English), Diyanet (Turkish); Kyrgyz/Uzbek voices coming soon; «Arabic reciters» are original tajweed. If one version fails, try another reciter.",
    },
  },
  ky: {
    dashboard: { traditionTileSub: traditionTileSub("ky") },
    namazCompanion: namazCompanionChrome("ky"),
    common: {
      close: "Жабуу",
      back: "Артка",
      open: "Ачуу",
      continue: "Улантуу",
      none: "жок",
      guideAccordionExpand: "ачуу",
      guideAccordionCollapse: "жашыруу",
      appErrorTitle: "Колдонмо катасы",
      appErrorHint: "«Кайталоо» — кайра аракет. Себебин логдон / экрандан караңыз.",
      distanceKmUnit: "км",
    },
    navigation: {
      savedTab: savedTabKy,
      tabArticles: "Макалалар",
      telegramInfo: {
        title: "Telegram бот",
        featuresLine:
          "Куран издөө, хадис, тажвид, хатм, намаз бөлүмү, даарат, кыбыла, тасбих, үн буйруктары",
        botCollectionSuffix: "толук жыйнагы ботто.",
        mobileExtra: "Мобилдик колдонмо офлайн кеш, билдирүүлөр жана Куран тексти менен толукталат.",
        openBot: "Ботту ачуу",
      },
    },
    hadith: {
      arabicOriginalLabel: "Арабча түпнуска",
      title: "Сахих хадистер",
      hub: {
        searchPlaceholderShort: "Хадис издөө…",
        searchPlaceholderExamples: "Издөө: ниети, намаз, кошуна...",
        listHint:
          "Тандалган тилдеги хадистер гана көрсөтүлөт. Тексттер ишенимдүү булактан — машиналык котормо жок.",
        emptySearch: "Издөө боюнча хадис табылган жок",
        moreShort: "Дагы",
        moreHadithSearchHint: "хадис бар. Так табуу үчүн издөө же категорияны колдонуңуз.",
      },
    },
    features: {
      halalTabInstitutions: "Мекемелер",
      halalTabVerify: "Текшерүү",
      halalTabMap: "Картадагы халал сертификаттуу уюмдар",
      traditionGuide: traditionChrome("ky"),
      traditionIntro: traditionIntroLine("ky"),
      kaabaLiveTitle: "Кааба — түз эфир",
      hajjRoadmapTitle: "Ажылык жол картасы",
      hajjRoadmapLead:
        "Даярдыктан умрага, негизги ажылык күндөрүнө жана кайткандан кийинки амалдарга чейин ирет менен берилди.",
      hajjPhasePrepTitle: "1. Даярдык жана ниети",
      hajjPhasePrepSub: "түшүнүк, шарт, микат, ихрам, талбия",
      hajjPhaseUmrahTitle: "2. Умра тартиби",
      hajjPhaseUmrahSub: "Мекке, тауаф, замзам, саай, чач",
      hajjPhaseDaysTitle: "3. Ажылык күндөрү",
      hajjPhaseDaysSub: "Мина, Арафа, Муздалифа, жамарат",
      hajjPhaseZiyarahTitle: "4. Зиярат жана өзгөчө учурлар",
      hajjPhaseZiyarahSub: "Медина, аялдар, улгайгандар, коопсуздук",
      hajjPhaseAfterTitle: "5. Ажылыктан кийин",
      hajjPhaseAfterSub: "руханий жыйынтык, корутунду, схемалар",
      hajjKaabaOnlineTitle: "Кааба онлайн",
      hajjKaabaOnlineLive: "Түз эфир",
      hajjKaabaOnlineA11y: "Кааба онлайн — түз эфир",
      hajjFullDataLabel: "Толук маалымат",
      hajjOfficialBookTitle: "КМДБ расмий китеби",
      hajjFullTextLabel: "Толук текст",
      hajjSectionUnit: "бөлүм",
      hajjTapSectionHint: "Бөлүмдү басыңыз — текст ирети менен ачылат.",
    },
    namazGuide: {
      screenTitle: "Намаз окуулугу",
      studyMapTitle: "Окуу картасы",
      studyNamazCardSub: "Даараттан намаз кадамдарына чейин системалуу окуу",
      studyMapPickHint: "Бөлүмдү тандаңыз. Адегенде даарат, андан кийин намаз кадамдары.",
      wuduHeroTitle: "Даарат",
      wuduCardSub: "Кадамдар жана бузулуу",
      fivePrayersTitle: "5 убакыт намаз",
      fivePrayersSub: "Ниеттен саламга чейин",
      rakatTableTitle: "5 убакыт намаздын ракааттары жана окуу ирети",
      rakatTableHint:
        "Ракаат ирети сүрөт эмес, колдонмо бетине текст болуп жазылды. Тил алмашканда бул таблица да которулат.",
      afterPrayerDuasTitle: "Намаздан кийин окулуучу дуалар",
      afterPrayerDuasHint:
        "Ирети: адегенде Аят ал-Курси, андан кийин Кунут дуасын жаттауга ыңгайлуу текст катары окуңуз.",
    },
    tajweedGuide: {
      ...alphabetTajweedChrome("ky"),
      chaptersTitle: "Бөлүмдөр",
      chaptersHint:
        "65 бет тажвид окуулугу бөлүмдөргө бөлүндү: алиппе, үн, созуу, гунна, вакф жана өзгөчө белгилер. Бөлүмдү бассаңыз, ошол жерден ачылат.",
    },
    seerah: { lastLessonLabel: "Акыркы сабак", lastBadge: "Акыркы" },
    hatim: {
      settingsFootnote:
        "Мусаф, шрифт, кари жана котормо тили — «Куран жөндөөлөрү» экранында.",
    },
    settings: {
      prayerNotifAcceptanceItemsIos: prayerNotifAcceptanceIos("ky"),
      nativeAzanExactAlarmWarning:
        "Android'де азан так убагында чыгышы үчүн «Так ойготкучтар» уруксатын күйгүзүңүз.",
      languageSectionSub:
        "Меню жана навигация 7 тилде: казак, орус, англис, кыргыз, өзбек, түрк жана араб.",
      languageKy: "Кыргызча",
      languageUz: "Oʻzbekcha",
      languageTr: "Türkçe",
      languageAr: "العربية",
      cityPickerTitle: "Шаар тандоо",
      cityPickerSearch: "Шаар издөө…",
      cityPickerRecent: "Акыркы тандоолор",
      quranSectionReadingSub: "Акыркы орун, котормо жана транскрипция тили.",
      quranTranslationLocaleTitle: "Котормо тили",
      quranTranslationLocaleHint:
        "Колдонмо тилинен өзүнчө. Мисалы: меню орусча, маани — казакча.",
      quranTranslationLocaleOption: (id: string) => {
        switch (id) {
          case "ru":
            return "Орусча";
          case "en":
            return "Англисче";
          case "tr":
            return "Түркчө";
          case "uz":
            return "Өзбекче";
          case "ky":
            return "Кыргызча";
          default:
            return "Казакча";
        }
      },
      quranTranslitScriptTitle: "Транскрипция жазуусу",
      quranTranslitScriptHint: "Окууну кирилл же латын тамгалары менен көрсөтүү.",
      quranTranslitScriptOption: (id: string) => (id === "latin" ? "Латын" : "Кирилл (казакча)"),
      prayerAzanScreenOnHint:
        "Эскертүү: экран күйүк жана телефон колдонулуп жатканда система толук экран азанды ачпашы мүмкүн — билдирмени басыңыз. Толук экран үчүн экранды кулпулап/өчүрүп текшериңиз.",
      sectionTransparency: "Ачыктык жана укук",
      sectionTransparencySub: "Көз карандысыздык, купуялык, маалымат агымдары.",
      transparencyIndependenceTitle: "Көз карандысыздык",
      transparencyPrivacyTitle: "Купуялык саясаты",
      transparencyPrivacyOpen: "Саясатты ачуу",
      transparencyDataFlowsTitle: "Маалымат агымдары",
      transparencyUsageAnalyticsTitle: "Колдонмо статистикасы",
      transparencyUsageAnalyticsSub:
        "Аноним сессия/экран окуялары api.rahatomir.com'га (IP хэш). Өчүрүүгө болот.",
    },
    transparency: {
      independenceShort:
        "RAHAT OMIR — көз карандысыз долбоор. КМДБ / Fatua.kz / Muftyat.kz расмий колдонмосу эмес.",
      independenceFull:
        "RAHAT OMIR — көз карандысыз исламдык сервис. КМДБ, Fatua.kz же Muftyat.kz расмий мобилдик колдонмосу эмес. Расмий сайттардан уруксат менен үзүндү/шилтеме көрсөтүлөт; фетва жана өкүм берилбейт.",
      dataFlowsBody:
        "Үчүнчү тараптар: api.rahatomir.com; Muftyat/Fatua; api.muftyat.kz жана Aladhan; islamic.network / alquran.cloud; Google/Apple; live.net.sa.",
    },
    communityDua: {
      stripSub: "Окуу, «аамийн» жана өз дуаңды жарыялоо — чогуу.",
      listIntro:
        "Жамаат дуаларын окуп, «Аамийн» десеңиз жана төмөндө өз дуаңды жөнөтө аласыз — кыска жана ыклас менен.",
      postingDisabled:
        "Жарыялоо убактылуу жабык: окуу жана «Аамийн» гана.",
      empty: "Азырынча жазуу жок.",
      emptyOffline: "Интернет керек. Тизме онлайнда көрүнөт.",
      placeholder: "Дуаңызды жазыңыз…",
    },
    prayer: {
      sourceMuftyatLive: "Булагы: Muftyat.kz",
      sourceAladhanLive: "Булагы: Aladhan резерв (ISNA · Hanafi asr)",
    },
    quran: {
      tajweedHelperLegendNote:
        "Шпаргалка: #537FFF — мадд · #FF7E1E — гунна · #9400A8 — ихфа · #DD0008 — калкала · #169777 — идгам.",
      readerShowMeaningLabel: "Маани (котормо)",
      meaningCaption: "Маани (котормо)",
      translitCaption: "Окулушу (транскрипция)",
      readerReadingThemeHint: "Ак — ачык бет; Кара — кара фон.",
      readerReciterHint:
        "Аят сайын ун интернеттен жуктолот. Экрандагы казакча маани — Ерлан Алимулы котормосу; «Котормо» аудиосу — Халифа Алтай (казак), Эльмир Кулиев (орус), Ibrahim Walk (англис), Дианет (түрк); кыргыз/өзбек үн — жакында; «Араб карылар» — тупнуска тажвид. Бир нуска ойнобосо, башка карыга отонуз.",
    },
  },
  uz: {
    dashboard: { traditionTileSub: traditionTileSub("uz") },
    namazCompanion: namazCompanionChrome("uz"),
    common: {
      close: "Yopish",
      back: "Orqaga",
      open: "Ochish",
      continue: "Davom etish",
      none: "yo'q",
      guideAccordionExpand: "ochish",
      guideAccordionCollapse: "yopish",
      appErrorTitle: "Ilova xatosi",
      appErrorHint: "«Qayta urinish» — yana sinang. Sababini log / ekrandan ko'ring.",
      distanceKmUnit: "km",
    },
    navigation: {
      savedTab: savedTabUz,
      tabArticles: "Maqolalar",
      telegramInfo: {
        title: "Telegram bot",
        featuresLine:
          "Qur'on qidiruv, hadis, tajvid, xatm, namoz bo'limi, tahorat, qibla, tasbih, ovozli buyruqlar",
        botCollectionSuffix: "to'liq to'plami botda.",
        mobileExtra: "Mobil ilova oflayn kesh, bildirishnomalar va Qur'on matni bilan to'ldiriladi.",
        openBot: "Botni ochish",
      },
    },
    hadith: {
      arabicOriginalLabel: "Arabcha asl matn",
      title: "Sahih hadislar",
      hub: {
        searchPlaceholderShort: "Hadis qidirish…",
        searchPlaceholderExamples: "Qidiruv: niyat, namoz, qo'shni...",
        listHint:
          "Faqat tanlangan tildagi hadislar ko'rsatiladi. Matnlar ishonchli manbadan — mashina tarjimasi yo'q.",
        emptySearch: "Qidiruv bo'yicha hadis topilmadi",
        moreShort: "Yana",
        moreHadithSearchHint:
          "hadis bor. Aniqroq topish uchun qidiruv yoki kategoriyadan foydalaning.",
      },
    },
    features: {
      halalHeroTagRegistry: "Rasmiy ro'yxat",
      halalHeroTagVerify: "Mahsulot tekshiruvi",
      halalTabInstitutions: "Muassasalar",
      halalTabVerify: "Tekshirish",
      halalTabMap: "Xaritadagi halol sertifikatli tashkilotlar",
      traditionGuide: traditionChrome("uz"),
      traditionIntro: traditionIntroLine("uz"),
      kaabaLiveTitle: "Ka'ba — jonli efir",
      hajjRoadmapTitle: "Haj yo'l xaritasi",
      hajjRoadmapLead:
        "Tayyorgarlikdan umra, asosiy haj kunlari va qaytgandan keyingi amallargacha tartib bilan berildi.",
      hajjPhasePrepTitle: "1. Tayyorgarlik va niyat",
      hajjPhasePrepSub: "tushuncha, shart, miqot, ihram, talbiya",
      hajjPhaseUmrahTitle: "2. Umra tartibi",
      hajjPhaseUmrahSub: "Makka, tavof, zamzam, sa'y, soch",
      hajjPhaseDaysTitle: "3. Haj kunlari",
      hajjPhaseDaysSub: "Mino, Arafa, Muzdalifa, jamarot",
      hajjPhaseZiyarahTitle: "4. Ziyorat va maxsus holatlar",
      hajjPhaseZiyarahSub: "Madina, ayollar, keksalar, xavfsizlik",
      hajjPhaseAfterTitle: "5. Hajdan keyin",
      hajjPhaseAfterSub: "ruhiy natija, xulosa, sxemalar",
      hajjKaabaOnlineTitle: "Ka'ba onlayn",
      hajjKaabaOnlineLive: "Jonli efir",
      hajjKaabaOnlineA11y: "Ka'ba onlayn — jonli efir",
      hajjFullDataLabel: "To'liq ma'lumot",
      hajjOfficialBookTitle: "KMDB rasmiy kitobi",
      hajjFullTextLabel: "To'liq matn",
      hajjSectionUnit: "bo'lim",
      hajjTapSectionHint: "Bo'limni bosing — matn tartib bilan ochiladi.",
    },
    namazGuide: {
      screenTitle: "Namoz o'quvligi",
      studyMapTitle: "O'qish xaritasi",
      studyNamazCardSub: "Tahoratdan namoz qadamlarigacha tizimli o'rganish",
      studyMapPickHint: "Bo'limni tanlang. Avval tahorat, keyin namoz qadamlari.",
      wuduHeroTitle: "Tahorat",
      wuduCardSub: "Qadamlar va buzilish",
      fivePrayersTitle: "5 vaqt namoz",
      fivePrayersSub: "Niyatdan salomgacha",
      rakatTableTitle: "5 vaqt namozning rakatlari va o'qish tartibi",
      rakatTableHint:
        "Rakat tartibi rasm emas, ilova sahifasiga matn bo'lib yozildi. Til o'zgarganda bu jadval ham tarjima qilinadi.",
      afterPrayerDuasTitle: "Namozdan keyin o'qiladigan duolar",
      afterPrayerDuasHint:
        "Tartib: avval Oyat al-Kursiy, keyin Qunut duosini yodlash uchun qulay matn sifatida o'qing.",
    },
    tajweedGuide: {
      ...alphabetTajweedChrome("uz"),
      chaptersTitle: "Bo'limlar",
      chaptersHint:
        "65 betlik tajvid o'quvligi boblarga bo'lindi: alifbo, tovush, cho'zish, g'unna, vaqf va maxsus belgilari. Bobni bossangiz, shu yerdan ochiladi.",
    },
    seerah: { lastLessonLabel: "Oxirgi dars", lastBadge: "Oxirgi" },
    hatim: {
      settingsFootnote:
        "Mushaf, shrift, qori va tarjima tili — «Qur'on sozlamalari» ekranida.",
    },
    settings: {
      prayerNotifAcceptanceItemsIos: prayerNotifAcceptanceIos("uz"),
      nativeAzanExactAlarmWarning:
        "Android'da azon aniq vaqtda yangrashi uchun «Aniq signal» ruxsatini yoqing.",
      languageSectionSub:
        "Menyu va navigatsiya 7 tilda: qozoq, rus, ingliz, qirg'iz, o'zbek, turk va arab.",
      languageKy: "Кыргызча",
      languageUz: "Oʻzbekcha",
      languageTr: "Türkçe",
      languageAr: "العربية",
      cityPickerTitle: "Shaharni tanlash",
      cityPickerSearch: "Shahar qidirish…",
      cityPickerRecent: "So'nggi tanlovlar",
      quranSectionReadingSub: "Oxirgi o'rin, tarjima va transkripsiya tili.",
      quranTranslationLocaleTitle: "Tarjima tili",
      quranTranslationLocaleHint:
        "Ilova tilidan alohida. Masalan: menyu ruscha, ma'no — qozoqcha.",
      quranTranslationLocaleOption: (id: string) => {
        switch (id) {
          case "ru":
            return "Ruscha";
          case "en":
            return "Inglizcha";
          case "tr":
            return "Turkcha";
          case "uz":
            return "Oʻzbekcha";
          case "ky":
            return "Qirgʻizcha";
          default:
            return "Qozoqcha";
        }
      },
      quranTranslitScriptTitle: "Transkripsiya yozuvi",
      quranTranslitScriptHint: "Oʻqishni kirill yoki lotin harflari bilan koʻrsatish.",
      quranTranslitScriptOption: (id: string) => (id === "latin" ? "Lotin" : "Kirill (qozoqcha)"),
      prayerAzanScreenOnHint:
        "Eslatma: ekran yoqilgan va telefon ishlatilayotganda tizim to'liq ekran azonni ochmasligi mumkin — bildirishnomani bosing. To'liq ekran uchun ekranni qulflab/o'chirib tekshiring.",
      sectionTransparency: "Shaffoflik va huquq",
      sectionTransparencySub: "Mustaqillik, maxfiylik, ma'lumot oqimlari.",
      transparencyIndependenceTitle: "Mustaqillik",
      transparencyPrivacyTitle: "Maxfiylik siyosati",
      transparencyPrivacyOpen: "Siyosatni ochish",
      transparencyDataFlowsTitle: "Ma'lumot oqimlari",
      transparencyUsageAnalyticsTitle: "Ilova statistikasi",
      transparencyUsageAnalyticsSub:
        "Anonim sessiya/ekran hodisalari api.rahatomir.com ga (IP xesh). O'chirish mumkin.",
    },
    transparency: {
      independenceShort:
        "RAHAT OMIR — mustaqil loyiha. KMDB / Fatua.kz / Muftyat.kz rasmiy ilovasi emas.",
      independenceFull:
        "RAHAT OMIR — mustaqil islomiy xizmat. KMDB, Fatua.kz yoki Muftyat.kz rasmiy mobil ilovasi emas. Rasmiy saytlardan ruxsat bilan parcha/havola ko'rsatiladi; fatvo va hukm berilmaydi.",
      dataFlowsBody:
        "Uchinchi tomonlar: api.rahatomir.com; Muftyat/Fatua; api.muftyat.kz va Aladhan; islamic.network / alquran.cloud; Google/Apple; live.net.sa.",
    },
    communityDua: {
      stripSub: "O'qish, «omin» va o'z duongizni joylash — birga.",
      listIntro:
        "Jamoa duolarini o'qib, «Omin» desangiz va pastda o'z duongizni yuborishingiz mumkin — qisqa va ixlos bilan.",
      postingDisabled:
        "Joylash vaqtincha yopiq: faqat o'qish va «Omin».",
      empty: "Hozircha yozuv yo'q.",
      emptyOffline: "Internet kerak. Ro'yxat onlaynda ko'rinadi.",
      placeholder: "Duongizni yozing…",
    },
    prayer: {
      sourceMuftyatLive: "Manba: Muftyat.kz",
      sourceAladhanLive: "Manba: Aladhan zaxira (ISNA · Hanafi asr)",
    },
    quran: {
      tajweedHelperLegendNote:
        "Eslatma (Al Quran Cloud): #537FFF — madd · #FF7E1E — g'unna · #9400A8 — ixfo · #DD0008 — qalqala · #169777 — idg'om.",
      readerShowMeaningLabel: "Ma'no (tarjima)",
      meaningCaption: "Ma'no (tarjima)",
      translitCaption: "O'qilishi (transkripsiya)",
      readerReadingThemeHint: "Oq — ochiq sahifa; Qora — qora fon.",
      readerReciterHint:
        "Oyat audiosi internetdan yuklanadi. Ekrandagi qozoqcha ma'no — Erlan Alimuly tarjimasi; «Tarjima» audiosi — Xalifa Altay (qozoq), Elmir Kuliev (rus), Ibrahim Walk (ingliz), Diyanet (turk); qirg'iz/o'zbek ovoz — tez orada; «Arab qorilar» — asl tajvid. Bir versiya o'ynamasa, boshqa qorini tanlang.",
    },
  },
  tr: {
    dashboard: { traditionTileSub: traditionTileSub("tr") },
    namazCompanion: namazCompanionChrome("tr"),
    common: {
      close: "Kapat",
      back: "Geri",
      open: "Aç",
      continue: "Devam",
      none: "yok",
      guideAccordionExpand: "aç",
      guideAccordionCollapse: "gizle",
      appErrorTitle: "Uygulama hatası",
      appErrorHint: "«Yeniden dene» — tekrar deneyin. Nedeni log / ekranda.",
      distanceKmUnit: "km",
    },
    navigation: {
      savedTab: savedTabTr,
      tabArticles: "Makaleler",
      telegramInfo: {
        title: "Telegram botu",
        featuresLine:
          "Kur'an arama, hadis, tecvid, hatim, namaz bölümü, abdest, kıble, tesbih, sesli komutlar",
        botCollectionSuffix: "tam koleksiyonu botta.",
        mobileExtra: "Mobil uygulama çevrimdışı önbellek, bildirimler ve Kur'an metniyle tamamlanır.",
        openBot: "Botu aç",
      },
    },
    hadith: {
      arabicOriginalLabel: "Arapça asıl metin",
      title: "Sahih hadisler",
      hub: {
        searchPlaceholderShort: "Hadis ara…",
        searchPlaceholderExamples: "Ara: niyet, namaz, komşu...",
        listHint:
          "Yalnızca seçilen dildeki hadisler gösterilir. Metinler güvenilir kaynaktan — makine çevirisi yok.",
        emptySearch: "Aramaya göre hadis bulunamadı",
        moreShort: "Daha",
        moreHadithSearchHint: "hadis var. Daha net bulmak için arama veya kategori kullanın.",
      },
    },
    features: {
      halalHeroTagRegistry: "Resmi kayıt",
      halalHeroTagVerify: "Ürün kontrolü",
      halalTabInstitutions: "Kurumlar",
      halalTabVerify: "Kontrol",
      halalTabMap: "Haritada helal sertifikalı kuruluşlar",
      traditionGuide: traditionChrome("tr"),
      traditionIntro: traditionIntroLine("tr"),
      kaabaLiveTitle: "Kâbe — canlı yayın",
      hajjRoadmapTitle: "Hac yol haritası",
      hajjRoadmapLead:
        "Hazırlıktan umreye, ana hac günlerine ve dönüş sonrası amellere kadar sırayla verildi.",
      hajjPhasePrepTitle: "1. Hazırlık ve niyet",
      hajjPhasePrepSub: "kavram, şart, mikat, ihram, telbiye",
      hajjPhaseUmrahTitle: "2. Umre sırası",
      hajjPhaseUmrahSub: "Mekke, tavaf, zemzem, sa'y, saç",
      hajjPhaseDaysTitle: "3. Hac günleri",
      hajjPhaseDaysSub: "Mina, Arafe, Müzdelife, cemarat",
      hajjPhaseZiyarahTitle: "4. Ziyaret ve özel durumlar",
      hajjPhaseZiyarahSub: "Medine, kadınlar, yaşlılar, güvenlik",
      hajjPhaseAfterTitle: "5. Hac sonrası",
      hajjPhaseAfterSub: "manevi sonuç, özet, şemalar",
      hajjKaabaOnlineTitle: "Kâbe çevrimiçi",
      hajjKaabaOnlineLive: "Canlı yayın",
      hajjKaabaOnlineA11y: "Kâbe çevrimiçi — canlı yayın",
      hajjFullDataLabel: "Tam veri",
      hajjOfficialBookTitle: "Resmî SAMK kitabı",
      hajjFullTextLabel: "Tam metin",
      hajjSectionUnit: "bölüm",
      hajjTapSectionHint: "Bölüme basın — metin sırayla açılır.",
    },
    namazGuide: {
      screenTitle: "Namaz rehberi",
      studyMapTitle: "Çalışma haritası",
      studyNamazCardSub: "Abdestten namaz adımlarına kadar sistemli öğrenme",
      studyMapPickHint: "Bölüm seçin. Önce abdest, sonra namaz adımları.",
      wuduHeroTitle: "Abdest",
      wuduCardSub: "Adımlar ve bozanlar",
      fivePrayersTitle: "5 vakit namaz",
      fivePrayersSub: "Niyetten selama",
      rakatTableTitle: "5 vakit namazın rekatları ve okuma sırası",
      rakatTableHint:
        "Rekat sırası resim değil, uygulama sayfasına metin olarak yazıldı. Dil değişince bu tablo da çevrilir.",
      afterPrayerDuasTitle: "Namaz sonrası dualar",
      afterPrayerDuasHint:
        "Sıra: önce Ayetel Kürsi, sonra Kunut duasını ezberlemeye uygun metin olarak okuyun.",
    },
    tajweedGuide: {
      ...alphabetTajweedChrome("tr"),
      chaptersTitle: "Bölümler",
      chaptersHint:
        "65 sayfalık tecvid kitabı bölümlere ayrıldı: elifba, ses, uzatma, ğunne, vakıf ve özel işaretler. Bölüme basarsanız oradan açılır.",
    },
    seerah: { lastLessonLabel: "Son ders", lastBadge: "Son" },
    hatim: {
      settingsFootnote:
        "Mushaf, yazı tipi, kari ve meal dili — «Kur'an ayarları» ekranında.",
    },
    settings: {
      prayerNotifAcceptanceItemsIos: prayerNotifAcceptanceIos("tr"),
      nativeAzanExactAlarmWarning:
        "Android'de ezanın tam vaktinde çalması için «Tam alarmlar» iznini açın.",
      languageSectionSub:
        "Menü ve gezinme 7 dilde: Kazakça, Rusça, İngilizce, Kırgızca, Özbekçe, Türkçe ve Arapça.",
      languageKy: "Кыргызча",
      languageUz: "Oʻzbekcha",
      languageTr: "Türkçe",
      languageAr: "العربية",
      cityPickerTitle: "Şehir seç",
      cityPickerSearch: "Şehir ara…",
      cityPickerRecent: "Son seçimler",
      quranSectionReadingSub: "Son konum, çeviri dili ve transkripsiyon yazısı.",
      quranTranslationLocaleTitle: "Çeviri dili",
      quranTranslationLocaleHint:
        "Uygulama dilinden ayrı. Örnek: menü Rusça, meal — Kazakça.",
      quranTranslationLocaleOption: (id: string) => {
        switch (id) {
          case "ru":
            return "Rusça";
          case "en":
            return "İngilizce";
          case "tr":
            return "Türkçe";
          case "uz":
            return "Özbekçe";
          case "ky":
            return "Kırgızca";
          default:
            return "Kazakça";
        }
      },
      quranTranslitScriptTitle: "Transkripsiyon yazısı",
      quranTranslitScriptHint: "Okunuşu Kiril veya Latin harfleriyle göster.",
      quranTranslitScriptOption: (id: string) => (id === "latin" ? "Latin" : "Kiril (Kazakça)"),
      prayerAzanScreenOnHint:
        "Not: ekran açık ve telefon kullanılırken sistem tam ekran ezanı açmayabilir — bildirime dokunun. Tam ekran için ekranı kilitli/kapalı deneyin.",
      sectionTransparency: "Şeffaflık ve hukuk",
      sectionTransparencySub: "Bağımsızlık, gizlilik, veri akışları.",
      transparencyIndependenceTitle: "Bağımsızlık",
      transparencyPrivacyTitle: "Gizlilik politikası",
      transparencyPrivacyOpen: "Politikayı aç",
      transparencyDataFlowsTitle: "Veri akışları",
      transparencyUsageAnalyticsTitle: "Uygulama istatistikleri",
      transparencyUsageAnalyticsSub:
        "Anonim oturum/ekran olayları api.rahatomir.com'a (IP hash). Kapatılabilir.",
    },
    transparency: {
      independenceShort:
        "RAHAT OMIR bağımsız bir projedir. SAMK / Fatua.kz / Muftyat.kz resmi uygulaması değildir.",
      independenceFull:
        "RAHAT OMIR bağımsız bir İslami hizmettir. SAMK, Fatua.kz veya Muftyat.kz resmi mobil uygulaması değildir. Resmi sitelerden izinle alıntı/bağlantı gösterilir; fetva ve hüküm verilmez.",
      dataFlowsBody:
        "Üçüncü taraflar: api.rahatomir.com; Muftyat/Fatua; api.muftyat.kz ve Aladhan; islamic.network / alquran.cloud; Google/Apple; live.net.sa.",
    },
    communityDua: {
      stripSub: "Okuma, «amin» ve kendi duanı paylaşma — birlikte.",
      listIntro:
        "Topluluk dualarını okuyup «Amin» diyebilir ve aşağıdan kendi duanızı gönderebilirsiniz — kısa ve samimi yazın.",
      postingDisabled:
        "Paylaşım geçici olarak kapalı: yalnızca okuma ve «Amin».",
      empty: "Henüz kayıt yok.",
      emptyOffline: "İnternet gerekli. Liste çevrimiçiyken görünür.",
      placeholder: "Duanızı yazın…",
    },
    prayer: {
      sourceMuftyatLive: "Kaynak: Muftyat.kz",
      sourceAladhanLive: "Kaynak: Aladhan yedek (ISNA · Hanafi asr)",
    },
    quran: {
      tajweedHelperLegendNote:
        "Kısa not (Al Quran Cloud): #537FFF — med · #FF7E1E — gunne · #9400A8 — ihfa · #DD0008 — kalkale · #169777 — idgam.",
      readerShowMeaningLabel: "Anlam (meal)",
      meaningCaption: "Anlam (meal)",
      translitCaption: "Okunuş (transkripsiyon)",
      readerReadingThemeHint: "Beyaz — açık sayfa; Siyah — koyu arka plan.",
      readerReciterHint:
        "Ayet sesi internetten yüklenir. Ekrandaki Kazakça anlam Erlan Alimuly mealidir; «Meal» sesi Halife Altay (Kazakça), Elmir Kuliev (Rusça), Ibrahim Walk (İngilizce), Diyanet (Türkçe); Kırgızca/Özbekçe ses yakında; «Arap kâriler» orijinal tecviddir. Bir sürüm çalmazsa başka kâri deneyin.",
    },
  },
  ar: {
    dashboard: { traditionTileSub: traditionTileSub("ar") },
    namazCompanion: namazCompanionChrome("ar"),
    common: {
      close: "إغلاق",
      back: "رجوع",
      open: "فتح",
      continue: "متابعة",
      none: "لا شيء",
      guideAccordionExpand: "فتح",
      guideAccordionCollapse: "إخفاء",
      appErrorTitle: "خطأ في التطبيق",
      appErrorHint: "«إعادة» — حاول مرة أخرى. راجع السجل أو الشاشة للسبب.",
      distanceKmUnit: "كم",
    },
    navigation: {
      savedTab: savedTabAr,
      tabArticles: "مقالات",
      telegramInfo: {
        title: "بوت تيليغرام",
        featuresLine:
          "بحث القرآن، الحديث، التجويد، الختمة، قسم الصلاة، الوضوء، القبلة، التسبيح، أوامر صوتية",
        botCollectionSuffix: "المجموعة الكاملة في البوت.",
        mobileExtra: "يكمل التطبيق المحمول بذاكرة مؤقتة دون اتصال وإشعارات ونص القرآن.",
        openBot: "فتح البوت",
      },
    },
    hadith: {
      arabicOriginalLabel: "النص العربي الأصلي",
      title: "أحاديث صحيحة",
      hub: {
        searchPlaceholderShort: "البحث عن حديث…",
        searchPlaceholderExamples: "بحث: نية، صلاة، جار…",
        listHint:
          "تُعرض فقط أحاديث اللغة المختارة. النصوص من مصادر موثوقة — بلا ترجمة آلية.",
        emptySearch: "لم يُعثر على حديث لهذا البحث",
        moreShort: "المزيد",
        moreHadithSearchHint: "أحاديث. للبحث الأدق استخدم البحث أو التصنيف.",
      },
    },
    features: {
      halalHeroTagRegistry: "السجل الرسمي",
      halalHeroTagVerify: "فحص المنتج",
      halalTabInstitutions: "المؤسسات",
      halalTabVerify: "التحقق",
      halalTabMap: "مؤسسات حلال معتمدة على الخريطة",
      traditionGuide: traditionChrome("ar"),
      traditionIntro: traditionIntroLine("ar"),
      kaabaLiveTitle: "الكعبة — بث مباشر",
      hajjRoadmapTitle: "خريطة طريق الحج",
      hajjRoadmapLead:
        "من الإعداد إلى العمرة وأيام الحج الرئيسية وأعمال ما بعد العودة — بالترتيب.",
      hajjPhasePrepTitle: "1. الاستعداد والنية",
      hajjPhasePrepSub: "المفهوم والشرط والميقات والإحرام والتلبية",
      hajjPhaseUmrahTitle: "2. ترتيب العمرة",
      hajjPhaseUmrahSub: "مكة والطواف وزمزم والسعي والشعر",
      hajjPhaseDaysTitle: "3. أيام الحج",
      hajjPhaseDaysSub: "منى وعرفة ومزدلفة والجمرات",
      hajjPhaseZiyarahTitle: "4. الزيارة والحالات الخاصة",
      hajjPhaseZiyarahSub: "المدينة والنساء وكبار السن والسلامة",
      hajjPhaseAfterTitle: "5. بعد الحج",
      hajjPhaseAfterSub: "الثمرة الروحية والخاتمة والرسوم",
      hajjKaabaOnlineTitle: "الكعبة أونلاين",
      hajjKaabaOnlineLive: "بث مباشر",
      hajjKaabaOnlineA11y: "الكعبة أونلاين — بث مباشر",
      hajjFullDataLabel: "بيانات كاملة",
      hajjOfficialBookTitle: "الكتاب الرسمي لإدارة المسلمين",
      hajjFullTextLabel: "النص الكامل",
      hajjSectionUnit: "قسم",
      hajjTapSectionHint: "اضغط القسم — يفتح النص بالترتيب.",
    },
    namazGuide: {
      screenTitle: "دليل الصلاة",
      studyMapTitle: "خريطة التعلم",
      studyNamazCardSub: "من الوضوء إلى خطوات الصلاة — تعلم منظّم",
      studyMapPickHint: "اختر قسمًا. أولًا الوضوء ثم خطوات الصلاة.",
      wuduHeroTitle: "الوضوء",
      wuduCardSub: "الخطوات وما ينقضه",
      fivePrayersTitle: "الصلوات الخمس",
      fivePrayersSub: "من النية إلى التسليم",
      rakatTableTitle: "ركعات الصلوات الخمس وترتيب القراءة",
      rakatTableHint:
        "ترتيب الركعات مكتوب نصًا في التطبيق وليس صورة. عند تغيير اللغة تُترجم هذه الجداول أيضًا.",
      afterPrayerDuasTitle: "أدعية بعد الصلاة",
      afterPrayerDuasHint:
        "الترتيب: أولًا آية الكرسي ثم دعاء القنوت كنص مناسب للحفظ.",
    },
    tajweedGuide: {
      ...alphabetTajweedChrome("ar"),
      chaptersTitle: "الأقسام",
      chaptersHint:
        "كتاب تجويد من 65 صفحة مقسّم إلى فصول: الأبجدية والصوت والمد والغنة والوقف والعلامات الخاصة. اضغط فصلًا ليفتح من هناك.",
    },
    seerah: { lastLessonLabel: "آخر درس", lastBadge: "الأخير" },
    hatim: {
      settingsFootnote:
        "المصحف والخط والقارئ ولغة الترجمة في «إعدادات القرآن».",
    },
    settings: {
      prayerNotifAcceptanceItemsIos: prayerNotifAcceptanceIos("ar"),
      nativeAzanExactAlarmWarning:
        "على Android، فعّل إذن «التنبيهات الدقيقة» ليُؤذَّن في الوقت المحدد.",
      languageSectionSub:
        "القوائم والتنقل بسبع لغات: الكازاخية والروسية والإنجليزية والقيرغيزية والأوزبكية والتركية والعربية.",
      languageKy: "Кыргызча",
      languageUz: "Oʻzbekcha",
      languageTr: "Türkçe",
      languageAr: "العربية",
      cityPickerTitle: "اختيار المدينة",
      cityPickerSearch: "بحث عن مدينة…",
      cityPickerRecent: "الأخيرة",
      quranSectionReadingSub: "آخر موضع ولغة الترجمة وخط النسخ الصوتي.",
      quranTranslationLocaleTitle: "لغة الترجمة",
      quranTranslationLocaleHint:
        "منفصلة عن لغة التطبيق. مثال: القوائم بالروسية والمعنى بالكازاخية.",
      quranTranslationLocaleOption: (id: string) => {
        switch (id) {
          case "ru":
            return "الروسية";
          case "en":
            return "الإنجليزية";
          case "tr":
            return "التركية";
          case "uz":
            return "الأوزبكية";
          case "ky":
            return "القيرغيزية";
          default:
            return "الكازاخية";
        }
      },
      quranTranslitScriptTitle: "خط النسخ الصوتي",
      quranTranslitScriptHint: "عرض القراءة بالحروف السيريلية أو اللاتينية.",
      quranTranslitScriptOption: (id: string) => (id === "latin" ? "لاتيني" : "سيريلي (كازاخي)"),
      prayerAzanScreenOnHint:
        "تنبيه: عندما تكون الشاشة قيد التشغيل وقد يُظهر النظام إشعارًا فقط بدل الأذان بملء الشاشة — اضغط الإشعار. للشاشة الكاملة جرّب مع قفل/إطفاء الشاشة.",
      sectionTransparency: "الشفافية والقانون",
      sectionTransparencySub: "الاستقلال، الخصوصية، تدفقات البيانات.",
      transparencyIndependenceTitle: "الاستقلال",
      transparencyPrivacyTitle: "سياسة الخصوصية",
      transparencyPrivacyOpen: "فتح السياسة",
      transparencyDataFlowsTitle: "تدفقات البيانات",
      transparencyUsageAnalyticsTitle: "إحصاءات التطبيق",
      transparencyUsageAnalyticsSub:
        "أحداث الجلسة/الشاشة مجهولة إلى api.rahatomir.com (IP hash). يمكن إيقافها.",
    },
    transparency: {
      independenceShort:
        "RAHAT OMIR مشروع مستقل — ليس التطبيق الرسمي لإدارة المسلمين / Fatua.kz / Muftyat.kz.",
      independenceFull:
        "RAHAT OMIR خدمة إسلامية مستقلة. ليست التطبيق الرسمي لإدارة المسلمين أو Fatua.kz أو Muftyat.kz. تُعرض مقتطفات/روابط بإذن من المواقع الرسمية؛ لا تُصدر فتاوى أو أحكام.",
      dataFlowsBody:
        "أطراف ثالثة: api.rahatomir.com؛ Muftyat/Fatua؛ api.muftyat.kz وAladhan؛ islamic.network / alquran.cloud؛ Google/Apple؛ live.net.sa.",
    },
    communityDua: {
      stripSub: "القراءة و«آمين» ونشر دعائك معًا.",
      listIntro:
        "يمكن قراءة أدعية المجتمع وقول «آمين» وإرسال دعائك أدناه — باختصار وبنية صالحة.",
      postingDisabled:
        "النشر مغلق مؤقتًا: قراءة و«آمين» فقط.",
      empty: "لا توجد إدخالات بعد.",
      emptyOffline: "يلزم الإنترنت. تظهر القائمة عند الاتصال.",
      placeholder: "اكتب دعاءك…",
    },
    prayer: {
      sourceMuftyatLive: "المصدر: Muftyat.kz",
      sourceAladhanLive: "المصدر: احتياطي Aladhan (ISNA · Hanafi asr)",
    },
    quran: {
      tajweedHelperLegendNote:
        "ملخص (Al Quran Cloud): #537FFF — مد · #FF7E1E — غنة · #9400A8 — إخفاء · #DD0008 — قلقلة · #169777 — إدغام.",
      readerShowMeaningLabel: "المعنى (الترجمة)",
      meaningCaption: "المعنى (الترجمة)",
      translitCaption: "القراءة (النسخ الصوتي)",
      readerReadingThemeHint: "أبيض — صفحة فاتحة؛ أسود — خلفية داكنة.",
      readerReciterHint:
        "يُحمَّل صوت كل آية من الإنترنت. المعنى الظاهر على الشاشة ترجمة إرلان أليموي؛ صوت «الترجمة» يشمل خليفة ألتاي (كازاخية) وإلمير كولييف (روسية) وإبراهيم ووك (إنجليزية) وديانت (تركية)؛ الصوت القرغيزي/الأوزبكي قريبًا؛ «القرّاء العرب» تجويد أصلي. إن لم يعمل أحد الإصدارات فجرّب قارئًا آخر.",
    },
  },
} as const satisfies Record<"ru" | "en" | "ky" | "uz" | "tr" | "ar", CriticalPatch>;
