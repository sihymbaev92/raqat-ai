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
      dinDasturConnectionTitle: "Религия и традиция: связь",
      dinDasturRulesTitle: "5 правил",
      dinDasturFoundationBtn: "Основа + доказательства",
      dinDasturBataBtn: (n: number) => `100 текстов благословений (${n})`,
      bataCountLabel: (n: number) => `${n} бата`,
      topicNotFound: "Традиция не найдена",
      aboutTraditionTitle: "О традиции",
      originTitle: "Происхождение",
      religionLinkTitle: "Связь с религией",
      superstitionLimitTitle: "Граница суеверия / что неверно",
      howToHoldTitle: "Как правильно соблюдать",
      bataTextsTitle: "Тексты благословений",
      relatedArticlesTitle: "Связанные статьи",
      quickChewTitle: "Краткое объяснение",
      quickChewLead: "Основные 4 традиции — история, шариатское правило и связь с религией.",
      quickHistoryLabel: "🔍 История происхождения:",
      quickShariatLabel: "⚖️ Шариатское правило:",
      quickEvidenceLabel: "📖 Связь с религией (доказательство):",
      quickReadFull: "Читать полный текст",
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
      dinDasturConnectionTitle: "Faith and tradition: the link",
      dinDasturRulesTitle: "5 rules",
      dinDasturFoundationBtn: "Foundation + evidence",
      dinDasturBataBtn: (n: number) => `100 blessing texts (${n})`,
      bataCountLabel: (n: number) => `${n} blessings`,
      topicNotFound: "Tradition not found",
      aboutTraditionTitle: "About the tradition",
      originTitle: "Origins",
      religionLinkTitle: "Link to religion",
      superstitionLimitTitle: "Superstition limits / what is wrong",
      howToHoldTitle: "How to observe it",
      bataTextsTitle: "Blessing texts",
      relatedArticlesTitle: "Related articles",
      quickChewTitle: "Quick explainers",
      quickChewLead: "Four core traditions — history, sharia ruling and faith link.",
      quickHistoryLabel: "🔍 Origin history:",
      quickShariatLabel: "⚖️ Sharia ruling:",
      quickEvidenceLabel: "📖 Link to religion (evidence):",
      quickReadFull: "Read full content",
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
      dinDasturConnectionTitle: "Дин жана салт: байланыш",
      dinDasturRulesTitle: "5 эреже",
      dinDasturFoundationBtn: "Негиз тема + далилдер",
      dinDasturBataBtn: (n: number) => `100 бата тексти (${n})`,
      bataCountLabel: (n: number) => `${n} бата`,
      topicNotFound: "Салт табылган жок",
      aboutTraditionTitle: "Салт жөнүндө",
      originTitle: "Чыгуу теги",
      religionLinkTitle: "Дин менен байланышы",
      superstitionLimitTitle: "Ырым чеги / эмне туура эмес",
      howToHoldTitle: "Кантип кармоо керек",
      bataTextsTitle: "Бата тексттери",
      relatedArticlesTitle: "Байланыштуу макалалар",
      quickChewTitle: "Кыска түшүндүрүү",
      quickChewLead: "Негизги 4 салт — тарыхы, шариат өкүмү жана дин менен байланышы.",
      quickHistoryLabel: "🔍 Чыгуу тарыхы:",
      quickShariatLabel: "⚖️ Шариаттагы өкүмү:",
      quickEvidenceLabel: "📖 Дин менен байланышы (далил):",
      quickReadFull: "Толук мазмунду окуу",
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
      dinDasturConnectionTitle: "Din va an'ana: bog'liqligi",
      dinDasturRulesTitle: "5 qoida",
      dinDasturFoundationBtn: "Asosiy mavzu + dalillar",
      dinDasturBataBtn: (n: number) => `100 duo matni (${n})`,
      bataCountLabel: (n: number) => `${n} duo`,
      topicNotFound: "An'ana topilmadi",
      aboutTraditionTitle: "An'ana haqida",
      originTitle: "Kelib chiqishi",
      religionLinkTitle: "Din bilan bog'liqligi",
      superstitionLimitTitle: "E'tiqod chegarasi / nima noto'g'ri",
      howToHoldTitle: "Qanday tutish kerak",
      bataTextsTitle: "Duo matnlari",
      relatedArticlesTitle: "Bog'liq maqolalar",
      quickChewTitle: "Qisqa tushuntirish",
      quickChewLead: "Asosiy 4 an'ana — tarixi, shariat hukmi va din bilan bog'liqligi.",
      quickHistoryLabel: "🔍 Kelib chiqish tarixi:",
      quickShariatLabel: "⚖️ Shariatdagi hukmi:",
      quickEvidenceLabel: "📖 Din bilan bog'liqligi (dalil):",
      quickReadFull: "To'liq mazmunni o'qish",
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
      dinDasturConnectionTitle: "Din ve gelenek: bağlantı",
      dinDasturRulesTitle: "5 kural",
      dinDasturFoundationBtn: "Temel konu + deliller",
      dinDasturBataBtn: (n: number) => `100 dua metni (${n})`,
      bataCountLabel: (n: number) => `${n} dua`,
      topicNotFound: "Gelenek bulunamadı",
      aboutTraditionTitle: "Gelenek hakkında",
      originTitle: "Köken",
      religionLinkTitle: "Dinle bağlantısı",
      superstitionLimitTitle: "Batıl sınırı / ne yanlış",
      howToHoldTitle: "Nasıl tutulmalı",
      bataTextsTitle: "Dua metinleri",
      relatedArticlesTitle: "İlgili makaleler",
      quickChewTitle: "Kısa açıklama",
      quickChewLead: "Temel 4 gelenek — tarihi, şeriat hükmü ve dinle bağı.",
      quickHistoryLabel: "🔍 Köken tarihi:",
      quickShariatLabel: "⚖️ Şeriat hükmü:",
      quickEvidenceLabel: "📖 Dinle bağlantısı (delil):",
      quickReadFull: "Tam içeriği oku",
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
      dinDasturConnectionTitle: "الدين والتقليد: الصلة",
      dinDasturRulesTitle: "5 قواعد",
      dinDasturFoundationBtn: "الأساس + الأدلة",
      dinDasturBataBtn: (n: number) => `100 نص دعاء (${n})`,
      bataCountLabel: (n: number) => `${n} دعاء`,
      topicNotFound: "لم يُعثر على التقليد",
      aboutTraditionTitle: "عن التقليد",
      originTitle: "الأصل",
      religionLinkTitle: "الصلة بالدين",
      superstitionLimitTitle: "حد الخرافة / ما الخطأ",
      howToHoldTitle: "كيف يُراعى",
      bataTextsTitle: "نصوص الدعاء",
      relatedArticlesTitle: "مقالات ذات صلة",
      quickChewTitle: "شرح موجز",
      quickChewLead: "أربعة تقاليد أساسية — التاريخ وحكم الشرع والصلة بالدين.",
      quickHistoryLabel: "🔍 تاريخ الأصل:",
      quickShariatLabel: "⚖️ الحكم الشرعي:",
      quickEvidenceLabel: "📖 الصلة بالدين (دليل):",
      quickReadFull: "قراءة المحتوى الكامل",
      introDetail:
        "التقليد — تجربة المجتمع المجرّبة عبر الزمن؛ والشريعة — أمر الله وسنة النبي ﷺ. يمكن أن يسيرا معًا ما لم يضرا بالناس والأسرة والجيران.\n\n" +
        "أرقام الآيات في هذه الشاشة للإرشاد؛ أكّد خصوصيات المذهب بإرشاد الإدارة الدينية الوطنية.",
    },
  } as const;
  return map[locale];
}

export const CRITICAL_UI_LOCALE_PATCHES = {
  ru: {
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
            return "Қазақша";
        }
      },
      quranTranslitScriptTitle: "Письмо транскрипции",
      quranTranslitScriptHint: "Показывать чтение кириллицей или латиницей.",
      quranTranslitScriptOption: (id: string) => (id === "latin" ? "Латиница" : "Кириллица (қазақша)"),
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
      stripSub: "Чтение и «аминь» — вместе. Публикация новых текстов без модерации отключена.",
      listIntro:
        "Можно читать общинные дуа и говорить «Аминь». Публикация без модерации отключена.",
      postingDisabled:
        "Публикация временно закрыта: только чтение и «Аминь».",
      empty: "Пока записей нет.",
      emptyOffline: "Нужен интернет. Список появится при подключении.",
      placeholder: "Публикация отключена",
    },
    quran: {
      tajweedHelperLegendNote:
        "Шпаргалка: #DD2C00 — мадд · #00C853 — гунна/ихфа/иклаб · #1A237E — калькала · #FFD600 — идгам.",
      readerShowMeaningLabel: "Смысл (перевод)",
      meaningCaption: "Смысл (перевод)",
      translitCaption: "Чтение (транскрипция)",
      readerReadingThemeHint: "Белый — светлая страница; Чёрный — тёмный фон.",
      readerReciterHint:
        "Звук для каждого аята загружается из интернета. Смысл на экране — перевод Ерлана Алимулы; аудио «Перевод» — Халифа Алтай (казахский), Эльмир Кулиев (русский), Хакимов (кыргызский), Rowwad (узбекский) и другие языки; «Арабские чтецы» — оригинальный таджвид. Если одна версия не играет, выберите другого чтеца.",
    },
  },
  en: {
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
      stripSub: "Read and say Amen together. Unmoderated posting is disabled.",
      listIntro:
        "You can read community duas and say Amen. Unmoderated posting is disabled.",
      postingDisabled:
        "Posting is temporarily closed: read and Amen only.",
      empty: "No entries yet.",
      emptyOffline: "Internet required. The list appears when you are online.",
      placeholder: "Posting disabled",
    },
    quran: {
      tajweedHelperLegendNote:
        "Cheat sheet: #DD2C00 — madd · #00C853 — ghunnah/ikhfa/iqlab · #1A237E — qalqalah · #FFD600 — idgham.",
      readerShowMeaningLabel: "Meaning (translation)",
      meaningCaption: "Meaning (translation)",
      translitCaption: "Reading (transcription)",
      readerReadingThemeHint: "White — light page; Black — dark background.",
      readerReciterHint:
        "Ayah audio loads from the internet. On-screen Kazakh meaning is Erlan Alimuly’s translation; «Translation» audio covers Khalifa Altai (Kazakh), Elmir Kuliev (Russian), Khakimov (Kyrgyz), Rowwad (Uzbek) and other languages; «Arabic reciters» are original tajweed. If one version fails, try another reciter.",
    },
  },
  ky: {
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
      stripSub: "Окуу жана «аамийн» — чогуу. Модерациясыз жарыялоо өчүрүлгөн.",
      listIntro:
        "Жамаат дуаларын окуп, «Аамийн» десеңиз болот. Модерациясыз жарыялоо өчүрүлгөн.",
      postingDisabled:
        "Жарыялоо убактылуу жабык: окуу жана «Аамийн» гана.",
      empty: "Азырынча жазуу жок.",
      emptyOffline: "Интернет керек. Тизме онлайнда көрүнөт.",
      placeholder: "Жарыялоо өчүрүлгөн",
    },
    prayer: {
      sourceMuftyatLive: "Булагы: Muftyat.kz",
      sourceAladhanLive: "Булагы: Aladhan резерв (ISNA · Hanafi asr)",
    },
    quran: {
      tajweedHelperLegendNote:
        "Шпаргалка: #DD2C00 — мадд · #00C853 — гунна/ихфа/иклаб · #1A237E — калкала · #FFD600 — идгам.",
      readerShowMeaningLabel: "Маани (котормо)",
      meaningCaption: "Маани (котормо)",
      translitCaption: "Окулушу (транскрипция)",
      readerReadingThemeHint: "Ак — ачык бет; Кара — кара фон.",
      readerReciterHint:
        "Аят сайын ун интернеттен жуктолот. Экрандагы казакча маани — Ерлан Алимулы котормосу; «Котормо» аудиосу — Халифа Алтай (казак), Эльмир Кулиев (орус), Хакимов (кыргыз), Rowwad (озбек) жана башка тилдер; «Араб карылар» — тупнуска тажвид. Бир нуска ойнобосо, башка карыга отонуз.",
    },
  },
  uz: {
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
      stripSub: "O'qish va «omin» — birga. Moderatsiyasiz joylash o'chirilgan.",
      listIntro:
        "Jamoa duolarini o'qib, «Omin» desangiz bo'ladi. Moderatsiyasiz joylash o'chirilgan.",
      postingDisabled:
        "Joylash vaqtincha yopiq: faqat o'qish va «Omin».",
      empty: "Hozircha yozuv yo'q.",
      emptyOffline: "Internet kerak. Ro'yxat onlaynda ko'rinadi.",
      placeholder: "Joylash o'chirilgan",
    },
    prayer: {
      sourceMuftyatLive: "Manba: Muftyat.kz",
      sourceAladhanLive: "Manba: Aladhan zaxira (ISNA · Hanafi asr)",
    },
    quran: {
      tajweedHelperLegendNote:
        "Eslatma: #DD2C00 — madd · #00C853 — g'unna/ixfo/iqlob · #1A237E — qalqala · #FFD600 — idg'om.",
      readerShowMeaningLabel: "Ma'no (tarjima)",
      meaningCaption: "Ma'no (tarjima)",
      translitCaption: "O'qilishi (transkripsiya)",
      readerReadingThemeHint: "Oq — ochiq sahifa; Qora — qora fon.",
      readerReciterHint:
        "Oyat audiosi internetdan yuklanadi. Ekrandagi qozoqcha ma'no — Erlan Alimuly tarjimasi; «Tarjima» audiosi — Xalifa Altay (qozoq), Elmir Kuliev (rus), Xakimov (qirg'iz), Rowwad (o'zbek) va boshqa tillar; «Arab qorilar» — asl tajvid. Bir versiya o'ynamasa, boshqa qorini tanlang.",
    },
  },
  tr: {
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
      stripSub: "Okuma ve «amin» — birlikte. Moderasyonsuz paylaşım kapalı.",
      listIntro:
        "Topluluk dualarını okuyup «Amin» diyebilirsiniz. Moderasyonsuz paylaşım kapalı.",
      postingDisabled:
        "Paylaşım geçici olarak kapalı: yalnızca okuma ve «Amin».",
      empty: "Henüz kayıt yok.",
      emptyOffline: "İnternet gerekli. Liste çevrimiçiyken görünür.",
      placeholder: "Paylaşım kapalı",
    },
    prayer: {
      sourceMuftyatLive: "Kaynak: Muftyat.kz",
      sourceAladhanLive: "Kaynak: Aladhan yedek (ISNA · Hanafi asr)",
    },
    quran: {
      tajweedHelperLegendNote:
        "Kısa not: #DD2C00 — med · #00C853 — gunne/ihfa/iklab · #1A237E — kalkale · #FFD600 — idgam.",
      readerShowMeaningLabel: "Anlam (meal)",
      meaningCaption: "Anlam (meal)",
      translitCaption: "Okunuş (transkripsiyon)",
      readerReadingThemeHint: "Beyaz — açık sayfa; Siyah — koyu arka plan.",
      readerReciterHint:
        "Ayet sesi internetten yüklenir. Ekrandaki Kazakça anlam Erlan Alimuly mealidir; «Meal» sesi Halife Altay (Kazakça), Elmir Kuliev (Rusça), Hakimov (Kırgızca), Rowwad (Özbekçe) ve diğer dilleri kapsar; «Arap kâriler» orijinal tecviddir. Bir sürüm çalmazsa başka kâri deneyin.",
    },
  },
  ar: {
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
      stripSub: "القراءة و«آمين» معًا. النشر دون إشراف معطّل.",
      listIntro:
        "يمكن قراءة أدعية المجتمع وقول «آمين». النشر دون إشراف معطّل.",
      postingDisabled:
        "النشر مغلق مؤقتًا: قراءة و«آمين» فقط.",
      empty: "لا توجد إدخالات بعد.",
      emptyOffline: "يلزم الإنترنت. تظهر القائمة عند الاتصال.",
      placeholder: "النشر معطّل",
    },
    prayer: {
      sourceMuftyatLive: "المصدر: Muftyat.kz",
      sourceAladhanLive: "المصدر: احتياطي Aladhan (ISNA · Hanafi asr)",
    },
    quran: {
      tajweedHelperLegendNote:
        "ملخص: #DD2C00 — مد · #00C853 — غنة/إخفاء/إقلاب · #1A237E — قلقلة · #FFD600 — إدغام.",
      readerShowMeaningLabel: "المعنى (الترجمة)",
      meaningCaption: "المعنى (الترجمة)",
      translitCaption: "القراءة (النسخ الصوتي)",
      readerReadingThemeHint: "أبيض — صفحة فاتحة؛ أسود — خلفية داكنة.",
      readerReciterHint:
        "يُحمَّل صوت كل آية من الإنترنت. المعنى الظاهر على الشاشة ترجمة إرلان أليموي؛ صوت «الترجمة» يشمل خليفة ألتاي (كازاخية) وإلمير كولييف (روسية) وحكيموف (قرغيزية) وروات (أوزبكية) ولغات أخرى؛ «القرّاء العرب» تجويد أصلي. إن لم يعمل أحد الإصدارات فجرّب قارئًا آخر.",
    },
  },
} as const satisfies Record<"ru" | "en" | "ky" | "uz" | "tr" | "ar", CriticalPatch>;
