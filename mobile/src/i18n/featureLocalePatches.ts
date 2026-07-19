/** Hand-maintained UI copy for newer features (tajweed reader, BLE tasbih). */

type BleConnected = (name: string) => string;

export type QuranTajweedPatch = {
  readerOpenLegend: string;
  readerTajweedExplainShort: string;
  tajweedColorHintShort: string;
  tajweedPanelOn: string;
  tajweedPanelOff: string;
  tajweedModeLabel: string;
  tajweedModeHint: string;
  tajweedLoading: string;
  tajweedLoadFailedHint: string;
  tajweedLegendTitle: string;
  tajweedLegendIntro: string;
  tajweedLegendClose: string;
  tajweedOpenGuide: string;
  tajweedOpenGuideA11y: string;
  tajweedSourceNote: string;
};

export type TasbihBlePatch = {
  bleTitle: string;
  bleHint: string;
  bleConnected: BleConnected;
  bleScan: string;
  bleStopScan: string;
  bleDisconnect: string;
  bleScanning: string;
  bleUnsupported: string;
  bleError: string;
  bleAndroidFootnote: string;
  meaningLabel: string;
};

export type DashboardTilePatch = {
  homeTileTasbihSub: string;
  homeTileTajweedSub: string;
  tajweedCardSub: string;
};

export type SettingsQuranPatch = {
  quranSectionTajweed: string;
  quranSectionTajweedSub: string;
};

const tajweedRu: QuranTajweedPatch = {
  readerOpenLegend: "Справочник цветов таджвида",
  readerTajweedExplainShort:
    "#DD2C00 — мадд · #00C853 — гунна/ихфа/иклаб · #1A237E — калкала · #FFD600 — идгам. Полный список — «Справка».",
  tajweedColorHintShort:
    "#DD2C00 — мадд · #00C853 — гунна/ихфа/иклаб · #1A237E — калкала · #FFD600 — идгам",
  tajweedPanelOn: "Включить",
  tajweedPanelOff: "Выключить",
  tajweedModeLabel: "Цвета таджвида",
  tajweedModeHint:
    "Хатым (QCF4): King Fahd QCF V4 COLR — цветной таджвид внутри букв (Quran Foundation CDN). Чтение суры: теги Al Quran Cloud «quran-tajweed». Сначала офлайн seed в приложении, затем кеш и API.",
  tajweedLoading: "Загрузка текста таджвида…",
  tajweedLoadFailedHint:
    "Не удалось загрузить текст таджвида. Проверьте интернет и обновите экран. Если офлайн seed недоступен — обновите приложение.",
  tajweedLegendTitle: "Цвета таджвида (справка)",
  tajweedLegendIntro:
    "Al Quran Cloud «quran-tajweed» — 17 правил ([h[, [n[, [f[ …). Цвета собраны в 4 международные группы (палитра API HTML). Полная теория — раздел «Таджвид».",
  tajweedLegendClose: "Закрыть",
  tajweedOpenGuide: "Перейти к учебнику таджвида",
  tajweedOpenGuideA11y: "Раздел таджвида: правила и план",
  tajweedSourceNote:
    "Данные: api.alquran.cloud · quran-tajweed. При спорном прочтении сверьтесь с учителем.",
};

const tajweedEn: QuranTajweedPatch = {
  readerOpenLegend: "Tajweed color legend",
  readerTajweedExplainShort:
    "#DD2C00 — madd · #00C853 — ghunnah/ikhfa/iqlab · #1A237E — qalqalah · #FFD600 — idgham. Full list in «Legend».",
  tajweedColorHintShort:
    "#DD2C00 — madd · #00C853 — ghunnah/ikhfa/iqlab · #1A237E — qalqalah · #FFD600 — idgham",
  tajweedPanelOn: "On",
  tajweedPanelOff: "Off",
  tajweedModeLabel: "Tajweed colors",
  tajweedModeHint:
    "Khatm (QCF4): King Fahd QCF V4 COLR — in-glyph colored tajweed (Quran Foundation CDN). Surah reading: Al Quran Cloud «quran-tajweed» tags. Uses bundled offline seed first, then cache/API.",
  tajweedLoading: "Loading tajweed text…",
  tajweedLoadFailedHint:
    "Could not load tajweed text. Check your connection and refresh. If offline seed is missing, update the app.",
  tajweedLegendTitle: "Tajweed colors (legend)",
  tajweedLegendIntro:
    "Al Quran Cloud «quran-tajweed» — 17 rule tags ([h[, [n[, [f[ …). Colors are grouped into 4 international sets (API HTML palette). Full theory — «Tajweed» section.",
  tajweedLegendClose: "Close",
  tajweedOpenGuide: "Open tajweed guide",
  tajweedOpenGuideA11y: "Tajweed section: rules and plan",
  tajweedSourceNote:
    "Source: api.alquran.cloud · quran-tajweed. For disputed readings, confirm with a teacher.",
};

const tajweedKy: QuranTajweedPatch = {
  readerOpenLegend: "Тажвид түстөрүнүн аныктамасы",
  readerTajweedExplainShort:
    "#DD2C00 — медд · #00C853 — гунна/ихфа/иклаб · #1A237E — калкала · #FFD600 — идгам. Толук тизим — «Аныктама».",
  tajweedColorHintShort:
    "#DD2C00 — медд · #00C853 — гунна/ихфа/иклаб · #1A237E — калкала · #FFD600 — идгам",
  tajweedPanelOn: "Кошуу",
  tajweedPanelOff: "Өчүрүү",
  tajweedModeLabel: "Тажвид түстөрү",
  tajweedModeHint:
    "Хатым (QCF4): King Fahd QCF V4 COLR — Sajda сыяктуу тамга ичиндеги түстүү тажвид. Сүрө окуу: Al Quran Cloud «quran-tajweed» тегдери. Алды менен колдонмодогу офлайн seed, андан кийин кеш/API.",
  tajweedLoading: "Тажвид тексти жүктөлүүдө…",
  tajweedLoadFailedHint:
    "Тажвид тексти жүктөлбөдү. Интернетти текшерип, экранды жаңыртыңыз. Офлайн seed жок болсо — колдонмону жаңыртыңыз.",
  tajweedLegendTitle: "Тажвид түстөрү (аныктама)",
  tajweedLegendIntro:
    "Al Quran Cloud «quran-tajweed» — 17 эреже теги ([h[, [n[, [f[ …). Түстөр 4 эл аралык топко топтолот (API HTML палитрасы). Толук теория — «Тажвид» бөлүмү.",
  tajweedLegendClose: "Жабуу",
  tajweedOpenGuide: "Тажвид окуу китебине өтүү",
  tajweedOpenGuideA11y: "Тажвид бөлүмү: эрежелер жана план",
  tajweedSourceNote:
    "Дайындар: api.alquran.cloud · quran-tajweed. Талаштуу окуу үчүн устат менен ырастаңыз.",
};

const tajweedUz: QuranTajweedPatch = {
  readerOpenLegend: "Tajvid ranglari izohi",
  readerTajweedExplainShort:
    "#DD2C00 — medd · #00C853 — gunnah/ihfa/iqlab · #1A237E — qalqala · #FFD600 — idgam. To'liq ro'yxat — «Izoh».",
  tajweedColorHintShort:
    "#DD2C00 — medd · #00C853 — gunnah/ihfa/iqlab · #1A237E — qalqala · #FFD600 — idgam",
  tajweedPanelOn: "Yoqish",
  tajweedPanelOff: "O'chirish",
  tajweedModeLabel: "Tajvid ranglari",
  tajweedModeHint:
    "Xatm (QCF4): King Fahd QCF V4 COLR — harf ichidagi rangli tajvid (Quran Foundation CDN). Sura o'qish: Al Quran Cloud «quran-tajweed» teglari. Avvalo ilovadagi oflayn seed, keyin kesh/API.",
  tajweedLoading: "Tajvid matni yuklanmoqda…",
  tajweedLoadFailedHint:
    "Tajvid matni yuklanmadi. Internetni tekshiring va ekranni yangilang. Oflayn seed bo'lmasa — ilovani yangilang.",
  tajweedLegendTitle: "Tajvid ranglari (izoh)",
  tajweedLegendIntro:
    "Al Quran Cloud «quran-tajweed» — 17 qoida tegi ([h[, [n[, [f[ …). Ranglar 4 xalqaro guruhga yig'iladi (API HTML palitrasi). To'liq nazariya — «Tajvid» bo'limi.",
  tajweedLegendClose: "Yopish",
  tajweedOpenGuide: "Tajvid qo'llanmasiga o'tish",
  tajweedOpenGuideA11y: "Tajvid bo'limi: qoidalar va reja",
  tajweedSourceNote:
    "Manba: api.alquran.cloud · quran-tajweed. Bahsli o'qish uchun ustoz bilan tasdiqlang.",
};

const tajweedTr: QuranTajweedPatch = {
  readerOpenLegend: "Tecvid renk açıklaması",
  readerTajweedExplainShort:
    "#DD2C00 — medd · #00C853 — gunnah/ihfa/ikalab · #1A237E — kalkale · #FFD600 — idgam. Tam liste — «Açıklama».",
  tajweedColorHintShort:
    "#DD2C00 — medd · #00C853 — gunnah/ihfa/ikalab · #1A237E — kalkale · #FFD600 — idgam",
  tajweedPanelOn: "Aç",
  tajweedPanelOff: "Kapat",
  tajweedModeLabel: "Tecvid renkleri",
  tajweedModeHint:
    "Hatim (QCF4): King Fahd QCF V4 COLR — harf içi renkli tecvid (Quran Foundation CDN). Sure okuma: Al Quran Cloud «quran-tajweed» etiketleri. Önce uygulama içi çevrimdışı seed, sonra önbellek/API.",
  tajweedLoading: "Tecvid metni yükleniyor…",
  tajweedLoadFailedHint:
    "Tecvid metni yüklenemedi. İnterneti kontrol edin ve ekranı yenileyin. Çevrimdışı seed yoksa uygulamayı güncelleyin.",
  tajweedLegendTitle: "Tecvid renkleri (açıklama)",
  tajweedLegendIntro:
    "Al Quran Cloud «quran-tajweed» — 17 kural etiketi ([h[, [n[, [f[ …). Renkler 4 uluslararası gruba toplanır (API HTML paleti). Tam teori — «Tecvid» bölümü.",
  tajweedLegendClose: "Kapat",
  tajweedOpenGuide: "Tecvid rehberine git",
  tajweedOpenGuideA11y: "Tecvid bölümü: kurallar ve plan",
  tajweedSourceNote:
    "Kaynak: api.alquran.cloud · quran-tajweed. İhtilaflı okuma için hocanıza danışın.",
};

const tasbihRu: TasbihBlePatch = {
  bleTitle: "Электронный счётчик",
  bleHint: "Включите Bluetooth-кольцо или счётчик — нажатия отображаются на экране.",
  bleConnected: (name) => `${name} подключён`,
  bleScan: "Поиск",
  bleStopScan: "Стоп",
  bleDisconnect: "Отключить",
  bleScanning: "Поиск BLE-устройств…",
  bleUnsupported: "Bluetooth-счётчик доступен только в приложении Android/iOS.",
  bleError: "Не удалось подключиться. Включите счётчик, отключите его от приложения iQIBLA/Zikr и повторите.",
  bleAndroidFootnote: "Android 12+: разрешите Bluetooth. Некоторые модели работают только со своим приложением.",
  meaningLabel: "Значение",
};

const tasbihEn: TasbihBlePatch = {
  bleTitle: "Electronic tasbih",
  bleHint: "Turn on your Bluetooth ring or counter — taps sync to this screen.",
  bleConnected: (name) => `${name} connected`,
  bleScan: "Scan",
  bleStopScan: "Stop",
  bleDisconnect: "Disconnect",
  bleScanning: "Scanning for BLE devices…",
  bleUnsupported: "Bluetooth tasbih works only in the Android/iOS app.",
  bleError: "Could not connect. Power on the device, disconnect it from iQIBLA/Zikr app and try again.",
  bleAndroidFootnote: "Android 12+: grant Bluetooth permission. Some models work only with their own app.",
  meaningLabel: "Meaning",
};

const tasbihKy: TasbihBlePatch = {
  bleTitle: "Электрондук тespе",
  bleHint: "Bluetooth шакегин же санагычты күйгүзүңүз — басуу экранга түшөт.",
  bleConnected: (name) => `${name} туулган`,
  bleScan: "Издөө",
  bleStopScan: "Токтотуу",
  bleDisconnect: "Ажыратуу",
  bleScanning: "BLE түзмөктөр изделүүдө…",
  bleUnsupported: "Bluetooth тespе Android/iOS колдонмосунда гана.",
  bleError: "Туулган жок. Tespeni күйгүзүп, iQIBLA/Zikr appтан ажыратып кайра аракет кылыңыз.",
  bleAndroidFootnote: "Android 12+: Bluetooth уруксатын бериңиз. Кээ бир модельдер өз appы менен гана иштейт.",
  meaningLabel: "Мааниси",
};

const tasbihUz: TasbihBlePatch = {
  bleTitle: "Elektron tasbeh",
  bleHint: "Bluetooth uzuk yoki hisoblagichni yoqing — bosishlar ekranga tushadi.",
  bleConnected: (name) => `${name} ulangan`,
  bleScan: "Qidirish",
  bleStopScan: "To'xtatish",
  bleDisconnect: "Uzish",
  bleScanning: "BLE qurilmalar qidirilmoqda…",
  bleUnsupported: "Bluetooth tasbeh faqat Android/iOS ilovasida.",
  bleError: "Ulanmadi. Tasbehni yoqing, iQIBLA/Zikr ilovasidan uzib qayta urinib ko'ring.",
  bleAndroidFootnote: "Android 12+: Bluetooth ruxsatini bering. Ba'zi modellar faqat o'z ilovasi bilan ishlaydi.",
  meaningLabel: "Ma'nosi",
};

const tasbihTr: TasbihBlePatch = {
  bleTitle: "Elektronik tesbih",
  bleHint: "Bluetooth yüzük veya sayacı açın — basışlar ekrana yansır.",
  bleConnected: (name) => `${name} bağlı`,
  bleScan: "Tara",
  bleStopScan: "Durdur",
  bleDisconnect: "Bağlantıyı kes",
  bleScanning: "BLE cihazları taranıyor…",
  bleUnsupported: "Bluetooth tesbih yalnızca Android/iOS uygulamasında.",
  bleError: "Bağlanamadı. Cihazı açın, iQIBLA/Zikr uygulamasından ayırıp tekrar deneyin.",
  bleAndroidFootnote: "Android 12+: Bluetooth iznini verin. Bazı modeller yalnızca kendi uygulamalarıyla çalışır.",
  meaningLabel: "Anlamı",
};

const dashboardRu: DashboardTilePatch = {
  homeTileTasbihSub: "Счётчик зикров",
  homeTileTajweedSub: "Правила чтения Корана",
  tajweedCardSub: "ҚМДБ · правила таджвида",
};

const dashboardEn: DashboardTilePatch = {
  homeTileTasbihSub: "Dhikr counter",
  homeTileTajweedSub: "Quran recitation rules",
  tajweedCardSub: "QMDB · tajweed rules",
};

const dashboardKy: DashboardTilePatch = {
  homeTileTasbihSub: "Зикир санагычы",
  homeTileTajweedSub: "Куран окуу эрежелери",
  tajweedCardSub: "КМДБ · тажвид эрежелери",
};

const dashboardUz: DashboardTilePatch = {
  homeTileTasbihSub: "Zikr hisoblagichi",
  homeTileTajweedSub: "Qur'on o'qish qoidalari",
  tajweedCardSub: "QMDB · tajvid qoidalari",
};

const dashboardTr: DashboardTilePatch = {
  homeTileTasbihSub: "Zikir sayacı",
  homeTileTajweedSub: "Kur'an okuma kuralları",
  tajweedCardSub: "KMDB · tecvid kuralları",
};

const settingsQuranRu: SettingsQuranPatch = {
  quranSectionTajweed: "Таджвид",
  quranSectionTajweedSub: "Цветные знаки таджвида и учебник.",
};

const settingsQuranEn: SettingsQuranPatch = {
  quranSectionTajweed: "Tajweed",
  quranSectionTajweedSub: "Colored tajweed marks and guide.",
};

const settingsQuranKy: SettingsQuranPatch = {
  quranSectionTajweed: "Тажвид",
  quranSectionTajweedSub: "Түстүү тажвид белgilери жана окуу китеби.",
};

const settingsQuranUz: SettingsQuranPatch = {
  quranSectionTajweed: "Tajvid",
  quranSectionTajweedSub: "Rangli tajvid belgilari va qo'llanma.",
};

const settingsQuranTr: SettingsQuranPatch = {
  quranSectionTajweed: "Tecvid",
  quranSectionTajweedSub: "Renkli tecvid işaretleri ve rehber.",
};

const tajweedAr: QuranTajweedPatch = {
  readerOpenLegend: "دليل ألوان التجويد",
  readerTajweedExplainShort:
    "#DD2C00 — مد · #00C853 — غنّة/إخفاء/إقلاب · #1A237E — قلقلة · #FFD600 — إدغام. القائمة الكاملة في «الدليل».",
  tajweedColorHintShort:
    "#DD2C00 — مد · #00C853 — غنّة/إخفاء/إقلاب · #1A237E — قلقلة · #FFD600 — إدغام",
  tajweedPanelOn: "تشغيل",
  tajweedPanelOff: "إيقاف",
  tajweedModeLabel: "ألوان التجويد",
  tajweedModeHint:
    "الختمة (QCF4): King Fahd QCF V4 COLR — تجويد ملوّن داخل الحروف. قراءة السورة: وسوم Al Quran Cloud «quran-tajweed». أولاً البذرة دون اتصال، ثم الذاكرة المؤقتة/API.",
  tajweedLoading: "جارٍ تحميل نص التجويد…",
  tajweedLoadFailedHint:
    "تعذّر تحميل نص التجويد. تحقق من الإنترنت وحدّث الشاشة. إن لم تتوفر البذرة دون اتصال فحدّث التطبيق.",
  tajweedLegendTitle: "ألوان التجويد (دليل)",
  tajweedLegendIntro:
    "Al Quran Cloud «quran-tajweed» — 17 وسم قاعدة ([h[, [n[, [f[ …). تُجمَع الألوان في 4 مجموعات دولية (لوحة HTML لـ API). النظرية الكاملة — قسم «التجويد».",
  tajweedLegendClose: "إغلاق",
  tajweedOpenGuide: "فتح دليل التجويد",
  tajweedOpenGuideA11y: "قسم التجويد: القواعد والخطة",
  tajweedSourceNote:
    "المصدر: api.alquran.cloud · quran-tajweed. عند الاختلاف راجع معلّمًا مختصًا.",
};

const tasbihAr: TasbihBlePatch = {
  bleTitle: "عداد إلكتروني",
  bleHint: "فعّل حلقة أو عدّاد Bluetooth — تظهر الضغطات على الشاشة.",
  bleConnected: (name) => `${name} متصل`,
  bleScan: "بحث",
  bleStopScan: "إيقاف",
  bleDisconnect: "قطع الاتصال",
  bleScanning: "جارٍ البحث عن أجهزة BLE…",
  bleUnsupported: "العدّاد عبر Bluetooth متاح فقط في تطبيق Android/iOS.",
  bleError: "تعذّر الاتصال. شغّل العدّاد وافصله عن تطبيق iQIBLA/Zikr ثم أعد المحاولة.",
  bleAndroidFootnote: "Android 12+: امنح إذن Bluetooth. بعض الطرازات تعمل فقط مع تطبيقها.",
  meaningLabel: "المعنى",
};

const dashboardAr: DashboardTilePatch = {
  homeTileTasbihSub: "عدّاد الأذكار",
  homeTileTajweedSub: "قواعد تلاوة القرآن",
  tajweedCardSub: "QMDB · قواعد التجويد",
};

const settingsQuranAr: SettingsQuranPatch = {
  quranSectionTajweed: "التجويد",
  quranSectionTajweedSub: "علامات التجويد الملوّنة والدليل.",
};

export const FEATURE_LOCALE_PATCHES = {
  ru: {
    dashboard: dashboardRu,
    quran: tajweedRu,
    tasbih: tasbihRu,
    settings: settingsQuranRu,
    hadith: { meaningLabel: "Значение" },
  },
  en: {
    dashboard: dashboardEn,
    quran: tajweedEn,
    tasbih: tasbihEn,
    settings: settingsQuranEn,
    hadith: { meaningLabel: "Meaning" },
  },
  ky: {
    dashboard: dashboardKy,
    quran: tajweedKy,
    tasbih: tasbihKy,
    settings: settingsQuranKy,
    hadith: { meaningLabel: "Мааниси" },
  },
  uz: {
    dashboard: dashboardUz,
    quran: tajweedUz,
    tasbih: tasbihUz,
    settings: settingsQuranUz,
    hadith: { meaningLabel: "Ma'nosi" },
  },
  tr: {
    dashboard: dashboardTr,
    quran: tajweedTr,
    tasbih: tasbihTr,
    settings: settingsQuranTr,
    hadith: { meaningLabel: "Anlamı" },
  },
  ar: {
    dashboard: dashboardAr,
    quran: tajweedAr,
    tasbih: tasbihAr,
    settings: settingsQuranAr,
    hadith: { meaningLabel: "المعنى" },
  },
} as const;
