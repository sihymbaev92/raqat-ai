/**
 * Қолмен аудиттелген аудармалар: хатым, қыбыла, зікір, дұға, зекет.
 * LOCALE_PATCHES-ке қосылады (офлайн bundle-дан жоғары басымдық).
 */
import type { kk } from "./kk";

type LocalePatch<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends object
    ? { [K in keyof T]?: LocalePatch<T[K]> }
    : T;

type CorePatch = LocalePatch<typeof kk>;

const hatimRu: CorePatch["hatim"] = {
  progressTitle: "Прогресс хатма",
  progressCount: "{read} / {total} сур отмечено",
  resumeLine: "Последнее чтение: {surahTitle} · аят {ayah}",
  continueReading: "Продолжить",
  tapAyahHint:
    "Нажмите на аят — прогресс сохранится; после последнего аята сура отмечается прочитанной.",
  juzHeaderBtnA11y: "Перейти по джузу или странице",
  juzQuickAction: "Джуз",
  searchBtnA11y: "Поиск суры",
  searchQuickAction: "Поиск суры",
  markReadA11y: "Отметить суру «{title}» прочитанной",
  openSurahRowA11y: (title, meta) =>
    meta
      ? `Сура ${meta.surahNumber}, ${title}, ${meta.ayahCount} аятов. Открыть чтение`
      : `${title}. Открыть чтение`,
  settingsTitle: "Настройки хатма",
  settingsSubtitle: "Тема, мусхаф, аудио, напоминание и прогресс.",
  tajweedOfflineQuickAction: "Цвета таджвида",
  tajweedOfflineQuickActionA11y: "Цвета таджвида — 114 сур офлайн",
};

const hatimEn: CorePatch["hatim"] = {
  progressTitle: "Hatim progress",
  progressCount: "{read} / {total} surahs marked",
  resumeLine: "Last read: {surahTitle} · ayah {ayah}",
  continueReading: "Continue",
  tapAyahHint: "Tap an ayah to save progress; after the last ayah the surah is marked complete.",
  juzHeaderBtnA11y: "Go to juz or page",
  juzQuickAction: "Juz",
  searchBtnA11y: "Search surah",
  searchQuickAction: "Search surah",
  markReadA11y: "Mark surah «{title}» as read",
  openSurahRowA11y: (title, meta) =>
    meta
      ? `Surah ${meta.surahNumber}, ${title}, ${meta.ayahCount} ayahs. Open reader`
      : `${title}. Open reader`,
  settingsTitle: "Hatim settings",
  settingsSubtitle: "Theme, mushaf, audio, reminder and progress.",
  tajweedOfflineQuickAction: "Tajweed colors",
  tajweedOfflineQuickActionA11y: "Tajweed colors — 114 surahs offline",
};

const hatimKy: CorePatch["hatim"] = {
  progressTitle: "Хатм прогресси",
  progressCount: "{read} / {total} сүрө белгиленди",
  resumeLine: "Акыркы окуу: {surahTitle} · {ayah}-аят",
  continueReading: "Улантуу",
  tapAyahHint:
    "Аятка басыңыз — прогресс сакталат; акыркы аяттан кийин сүрө окуулду деп белгиленет.",
  juzHeaderBtnA11y: "Жүз же бет боюнча өтүү",
  juzQuickAction: "Жүз",
  searchBtnA11y: "Сүрө издөө",
  searchQuickAction: "Сүрө издөө",
  markReadA11y: "«{title}» сүрөсүн окуулду деп белгилөө",
  openSurahRowA11y: (title, meta) =>
    meta
      ? `Сүрө ${meta.surahNumber}, ${title}, ${meta.ayahCount} аят. Окууну ачуу`
      : `${title}. Окууну ачуу`,
  settingsTitle: "Хатм жөндөөлөрү",
  settingsSubtitle: "Тема, мусхаф, аудио, эскертүү жана прогресс.",
  tajweedOfflineQuickAction: "Тажвид түстөрү",
  tajweedOfflineQuickActionA11y: "Тажвид түстөрү — 114 сүрө офлайн",
};

const hatimUz: CorePatch["hatim"] = {
  progressTitle: "Xatm progressi",
  progressCount: "{read} / {total} sura belgilangan",
  resumeLine: "Oxirgi o'qish: {surahTitle} · oyat {ayah}",
  continueReading: "Davom etish",
  tapAyahHint:
    "Oyatga bosing — progress saqlanadi; oxirgi oyatdan keyin sura o'qilgan deb belgilanadi.",
  juzHeaderBtnA11y: "Juz yoki sahifa bo'yicha o'tish",
  juzQuickAction: "Juz",
  searchBtnA11y: "Sura qidirish",
  searchQuickAction: "Sura qidirish",
  markReadA11y: "«{title}» surasini o'qilgan deb belgilash",
  openSurahRowA11y: (title, meta) =>
    meta
      ? `Sura ${meta.surahNumber}, ${title}, ${meta.ayahCount} oyat. O'qishni ochish`
      : `${title}. O'qishni ochish`,
  settingsTitle: "Xatm sozlamalari",
  settingsSubtitle: "Mavzu, mushaf, audio, eslatma va progress.",
  tajweedOfflineQuickAction: "Tajvid ranglari",
  tajweedOfflineQuickActionA11y: "Tajvid ranglari — 114 sura oflayn",
};

const hatimTr: CorePatch["hatim"] = {
  progressTitle: "Hatim ilerlemesi",
  progressCount: "{read} / {total} sure işaretlendi",
  resumeLine: "Son okuma: {surahTitle} · ayet {ayah}",
  continueReading: "Devam et",
  tapAyahHint:
    "Bir ayete dokunun — ilerleme kaydedilir; son ayetten sonra sure okundu işaretlenir.",
  juzHeaderBtnA11y: "Cüz veya sayfaya git",
  juzQuickAction: "Cüz",
  searchBtnA11y: "Sure ara",
  searchQuickAction: "Sure ara",
  markReadA11y: "«{title}» suresini okundu işaretle",
  openSurahRowA11y: (title, meta) =>
    meta
      ? `Sure ${meta.surahNumber}, ${title}, ${meta.ayahCount} ayet. Okumayı aç`
      : `${title}. Okumayı aç`,
  settingsTitle: "Hatim ayarları",
  settingsSubtitle: "Tema, mushaf, ses, hatırlatma ve ilerleme.",
  tajweedOfflineQuickAction: "Tecvid renkleri",
  tajweedOfflineQuickActionA11y: "Tecvid renkleri — 114 sure çevrimdışı",
};

const hatimAr: CorePatch["hatim"] = {
  progressTitle: "تقدّم الختمة",
  progressCount: "{read} / {total} سورة مُعلَّمة",
  resumeLine: "آخر قراءة: {surahTitle} · آية {ayah}",
  continueReading: "متابعة",
  tapAyahHint:
    "اضغط على آية لحفظ التقدّم؛ بعد آخر آية تُعلَّم السورة مقروءة.",
  juzHeaderBtnA11y: "الانتقال حسب الجزء أو الصفحة",
  juzQuickAction: "جزء",
  searchBtnA11y: "بحث عن سورة",
  searchQuickAction: "بحث عن سورة",
  markReadA11y: "تعليم سورة «{title}» مقروءة",
  openSurahRowA11y: (title, meta) =>
    meta
      ? `سورة ${meta.surahNumber}، ${title}، ${meta.ayahCount} آية. فتح القراءة`
      : `${title}. فتح القراءة`,
  settingsTitle: "إعدادات الختمة",
  settingsSubtitle: "المظهر والمصحف والصوت والتذكير والتقدّم.",
  tajweedOfflineQuickAction: "ألوان التجويد",
  tajweedOfflineQuickActionA11y: "ألوان التجويد — 114 سورة دون اتصال",
};

const qiblaRu: CorePatch["qibla"] = {
  permLoading: "Разрешение на местоположение…",
  deniedTitle: "Нужна геолокация",
  deniedBody: "Включите доступ к местоположению в настройках приложения или нажмите «Открыть настройки».",
  servicesOffTitle: "Службы геолокации выключены",
  servicesOffBody: "Включите GPS в настройках телефона, затем вернитесь в приложение.",
  positionFailedTitle: "Местоположение не определено",
  positionFailedBody: "Попробуйте на открытом месте. Показано приблизительное направление по выбранному городу.",
  cityApproxHint: "Направление по центру выбранного города (без точного GPS).",
  openSettings: "Открыть настройки",
  retryLocation: "Повторить",
  hintPending: "Стрелка появится, когда будут готовы местоположение и компас.",
  hintAligned:
    "Стрелка направлена к Каабе. Держите телефон горизонтально или смотрите на экран и повернитесь лицом к Каабе. Металл и магнитные поля могут влиять на точность.",
  hintTurnCw: "Медленно поворачивайте телефон по часовой стрелке к Каабе.",
  hintTurnCcw: "Медленно поворачивайте телефон против часовой стрелки к Каабе.",
  modeCompass: "Компас",
  modeCamera: "Камера",
  magnetHint: "Металлические предметы могут снижать точность компаса.",
  calibrationTitle: "Калибровка компаса",
  calibrationStart: "Начать калибровку",
  calibrationStop: "Остановить",
};

const qiblaEn: CorePatch["qibla"] = {
  permLoading: "Location permission…",
  deniedTitle: "Location required",
  deniedBody: "Enable location access in app settings or tap «Open settings».",
  servicesOffTitle: "Location services off",
  servicesOffBody: "Turn on GPS in phone settings, then return to the app.",
  positionFailedTitle: "Location unavailable",
  positionFailedBody: "Try outdoors. Approximate direction uses your selected city when GPS is weak.",
  cityApproxHint: "Direction from selected city center (no precise GPS).",
  openSettings: "Open settings",
  retryLocation: "Retry",
  hintPending: "Arrow appears when location and compass are ready.",
  hintAligned:
    "Arrow points toward the Kaaba. Hold the phone flat or face the Kaaba while looking at the screen. Metal and magnetic fields may affect accuracy.",
  hintTurnCw: "Slowly rotate the phone clockwise toward the Kaaba.",
  hintTurnCcw: "Slowly rotate the phone counter-clockwise toward the Kaaba.",
  modeCompass: "Compass",
  modeCamera: "Camera",
  magnetHint: "Metal objects may reduce compass accuracy.",
  calibrationTitle: "Compass calibration",
  calibrationStart: "Start calibration",
  calibrationStop: "Stop",
};

const qiblaKy: CorePatch["qibla"] = {
  permLoading: "Жайгашуу уруксаты…",
  deniedTitle: "Геолокация керек",
  deniedBody: "Колдонмо жөндөөлөрүнөн жайгашуу уруксатын күйгүзүңүз же «Жөндөөлөрдү ачуу» баскычын басыңыз.",
  servicesOffTitle: "Жайгашуу кызматы өчүрүлгөн",
  servicesOffBody: "Телефондо GPS күйгүзүп, колдонмого кайра кириңиз.",
  positionFailedTitle: "Жайгашуу аныкталган жок",
  positionFailedBody: "Ачык жерде кайра көрүңүз. Тандалган шаар боюнча болжолдуу багыт көрсөтүлүшү мүмкүн.",
  cityApproxHint: "Тандалган шаардын борбору боюнча багыт (так GPS жок).",
  openSettings: "Жөндөөлөрдү ачуу",
  retryLocation: "Кайталоо",
  hintPending: "Жайгашуу жана компас даяр болгондо көрсөткүч пайда болот.",
  hintAligned: "Көрсөткүч Каабага карайт. Металл жана магнит тактыкты өзгөртүшү мүмкүн.",
  hintTurnCw: "Телефонду саат жебеси боюнча баяу буруңуз — Каабага чейин.",
  hintTurnCcw: "Телефонду саат жебесине каршы баяу буруңуз — Каабага чейин.",
  modeCompass: "Компас",
  modeCamera: "Камера",
  magnetHint: "Металл заттар компастын тактыгына таасир кылышы мүмкүн.",
  calibrationTitle: "Компасты калибрлөө",
  calibrationStart: "Калибрлөөнү баштоо",
  calibrationStop: "Токтотуу",
};

const qiblaUz: CorePatch["qibla"] = {
  permLoading: "Joylashuv ruxsati…",
  deniedTitle: "Geolokatsiya kerak",
  deniedBody: "Ilova sozlamalarida joylashuv ruxsatini yoqing yoki «Sozlamalarni ochish» tugmasini bosing.",
  servicesOffTitle: "Joylashuv xizmati o'chirilgan",
  servicesOffBody: "Telefonda GPS ni yoqing va ilovaga qayting.",
  positionFailedTitle: "Joylashuv aniqlanmadi",
  positionFailedBody: "Ochiq joyda qayta urinib ko'ring. Tanlangan shahar bo'yicha taxminiy yo'nalish ko'rsatilishi mumkin.",
  cityApproxHint: "Tanlangan shahar markazi bo'yicha yo'nalish (aniq GPS yo'q).",
  openSettings: "Sozlamalarni ochish",
  retryLocation: "Qayta urinish",
  hintPending: "Joylashuv va kompas tayyor bo'lganda ko'rsatkich paydo bo'ladi.",
  hintAligned: "Ko'rsatkich Kaabaga qarab turadi. Metall va magnit maydonlar aniqlikka ta'sir qilishi mumkin.",
  hintTurnCw: "Telefonni soat strelkasi bo'yicha sekin aylantiring — Kaabaga qadar.",
  hintTurnCcw: "Telefonni soat strelkasiga qarshi sekin aylantiring — Kaabaga qadar.",
  modeCompass: "Kompas",
  modeCamera: "Kamera",
  magnetHint: "Metall buyumlar kompas aniqligini pasaytirishi mumkin.",
  calibrationTitle: "Kompasni kalibrlash",
  calibrationStart: "Kalibrlashni boshlash",
  calibrationStop: "To'xtatish",
};

const qiblaTr: CorePatch["qibla"] = {
  permLoading: "Konum izni…",
  deniedTitle: "Konum gerekli",
  deniedBody: "Uygulama ayarlarından konumu açın veya «Ayarları aç»a dokunun.",
  servicesOffTitle: "Konum servisleri kapalı",
  servicesOffBody: "Telefonda GPS'i açıp uygulamaya dönün.",
  positionFailedTitle: "Konum alınamadı",
  positionFailedBody: "Açık alanda tekrar deneyin. Seçili şehre göre yaklaşık yön gösterilebilir.",
  cityApproxHint: "Seçili şehir merkezine göre yön (kesin GPS yok).",
  openSettings: "Ayarları aç",
  retryLocation: "Tekrar dene",
  hintPending: "Konum ve pusula hazır olunca ok görünür.",
  hintAligned: "Ok Kâbe'ye bakıyor. Metal ve manyetik alanlar doğruluğu etkileyebilir.",
  hintTurnCw: "Telefonu yavaşça saat yönünde Kâbe'ye doğru çevirin.",
  hintTurnCcw: "Telefonu yavaşça saat yönünün tersine Kâbe'ye doğru çevirin.",
  modeCompass: "Pusula",
  modeCamera: "Kamera",
  magnetHint: "Metal nesneler pusula doğruluğunu düşürebilir.",
  calibrationTitle: "Pusula kalibrasyonu",
  calibrationStart: "Kalibrasyonu başlat",
  calibrationStop: "Durdur",
};

const qiblaAr: CorePatch["qibla"] = {
  permLoading: "إذن الموقع…",
  deniedTitle: "يلزم الموقع",
  deniedBody: "فعّل إذن الموقع في إعدادات التطبيق أو اضغط «فتح الإعدادات».",
  servicesOffTitle: "خدمات الموقع متوقفة",
  servicesOffBody: "فعّل GPS في إعدادات الهاتف ثم عد إلى التطبيق.",
  positionFailedTitle: "تعذّر تحديد الموقع",
  positionFailedBody: "جرّب في مكان مكشوف. قد يُعرض اتجاه تقريبي حسب المدينة المختارة.",
  cityApproxHint: "الاتجاه حسب مركز المدينة المختارة (بدون GPS دقيق).",
  openSettings: "فتح الإعدادات",
  retryLocation: "إعادة المحاولة",
  hintPending: "يظهر السهم عندما يكون الموقع والبوصلة جاهزين.",
  hintAligned: "السهم نحو الكعبة. المعادن والحقول المغناطيسية قد تؤثر على الدقة.",
  hintTurnCw: "أدِر الهاتف ببطء مع عقارب الساعة نحو الكعبة.",
  hintTurnCcw: "أدِر الهاتف ببطء عكس عقارب الساعة نحو الكعبة.",
  modeCompass: "بوصلة",
  modeCamera: "كاميرا",
  magnetHint: "قد تقلل الأجسام المعدنية دقة البوصلة.",
  calibrationTitle: "معايرة البوصلة",
  calibrationStart: "بدء المعايرة",
  calibrationStop: "إيقاف",
};

const tasbihRu: CorePatch["tasbih"] = {
  screenTitle: "Зикры",
  openCounterA11y: "Открыть экран тасбиха",
  loadFailedHint: "Не удалось загрузить зикры. Проверьте подключение и повторите.",
};

const tasbihEn: CorePatch["tasbih"] = {
  screenTitle: "Dhikr",
  openCounterA11y: "Open tasbih screen",
  loadFailedHint: "Could not load dhikr list. Check connection and try again.",
};

const tasbihKy: CorePatch["tasbih"] = {
  screenTitle: "Зикирлер",
  openCounterA11y: "Тасбих экранын ачуу",
  loadFailedHint: "Зикирлер жүктөлбөй калды. Туташууну текшерип, кайра аракет кылыңыз.",
};

const tasbihUz: CorePatch["tasbih"] = {
  screenTitle: "Zikrlar",
  openCounterA11y: "Tasbeh ekranini ochish",
  loadFailedHint: "Zikrlar yuklanmadi. Ulanishni tekshirib, qayta urinib ko'ring.",
};

const tasbihTr: CorePatch["tasbih"] = {
  screenTitle: "Zikirler",
  openCounterA11y: "Tesbih ekranını aç",
  loadFailedHint: "Zikirler yüklenemedi. Bağlantıyı kontrol edip tekrar deneyin.",
};

const tasbihAr: CorePatch["tasbih"] = {
  screenTitle: "الأذكار",
  openCounterA11y: "فتح شاشة التسبيح",
  loadFailedHint: "تعذّر تحميل الأذكار. تحقق من الاتصال وحاول مجددًا.",
};

const duasRu: CorePatch["duas"] = {
  menzikirTitle: "Разделы (8)",
  searchPlaceholder: "Поиск: название, арабский, транскрипция или значение…",
  noSearchResults: "Дуа не найдена — попробуйте другой запрос.",
};

const duasEn: CorePatch["duas"] = {
  menzikirTitle: "Sections (8)",
  searchPlaceholder: "Search: title, Arabic, transliteration or meaning…",
  noSearchResults: "No duas found — try a different query.",
};

const duasKy: CorePatch["duas"] = {
  menzikirTitle: "Бөлүмдөр (8)",
  searchPlaceholder: "Издөө: аталыш, арабча, транскрипция же мааниси…",
  noSearchResults: "Дуба табылган жок — башка суроо колдонуңуз.",
};

const duasUz: CorePatch["duas"] = {
  menzikirTitle: "Bo'limlar (8)",
  searchPlaceholder: "Qidiruv: sarlavha, arabcha, transkripsiya yoki ma'nosi…",
  noSearchResults: "Dua topilmadi — boshqa so'rov kiriting.",
};

const duasTr: CorePatch["duas"] = {
  menzikirTitle: "Bölümler (8)",
  searchPlaceholder: "Ara: başlık, Arapça, okunuş veya anlam…",
  noSearchResults: "Dua bulunamadı — başka bir arama deneyin.",
};

const duasAr: CorePatch["duas"] = {
  menzikirTitle: "الأقسام (8)",
  searchPlaceholder: "بحث: العنوان أو العربي أو النطق أو المعنى…",
  noSearchResults: "لم يُعثر على دعاء — جرّب طلبًا آخر.",
};

const zakatRu: CorePatch["zakatCalculator"] = {
  title: "Калькулятор закята",
  eyebrow: "Расчёт закята (ханафи)",
  lead: "Введите имущество: деньги, золото/серебро, товары, дебиторку и краткосрочные долги. При достижении нисаба рассчитывается 2,5%.",
  resultTitle: "Примерная сумма закята",
  askAi: "Спросить о закяте",
  clear: "Очистить",
};

const zakatEn: CorePatch["zakatCalculator"] = {
  title: "Zakat calculator",
  eyebrow: "Hanafi zakat estimate",
  lead: "Enter assets: cash, gold/silver, trade goods, receivables and short-term debts. At nisab, 2.5% is calculated.",
  resultTitle: "Estimated zakat",
  askAi: "Ask about zakat",
  clear: "Clear",
};

const zakatKy: CorePatch["zakatCalculator"] = {
  title: "Зекет калькулятору",
  eyebrow: "Ханафи зекет эсеби",
  lead: "Мүлктү киргизиңиз: акча, алтын-күмүш, соода тауары, карыздар. Нисабга жетсе 2,5% эсептелет.",
  resultTitle: "Болжолдуу зекет суммасы",
  askAi: "Зекет жөнүндө суроо",
  clear: "Тазалоо",
};

const zakatUz: CorePatch["zakatCalculator"] = {
  title: "Zakat kalkulyatori",
  eyebrow: "Hanafiy zakat hisobi",
  lead: "Mulkni kiriting: pul, oltin/kumush, savdo tovarlari, qarzlar. Nisobga yetganda 2,5% hisoblanadi.",
  resultTitle: "Taxminiy zakat summasi",
  askAi: "Zakat haqida so'rash",
  clear: "Tozalash",
};

const zakatTr: CorePatch["zakatCalculator"] = {
  title: "Zekât hesaplayıcı",
  eyebrow: "Hanefi zekât tahmini",
  lead: "Malı girin: nakit, altın/gümüş, ticaret malları, alacaklar ve kısa vadeli borçlar. Nisaba ulaşınca %2,5 hesaplanır.",
  resultTitle: "Tahmini zekât",
  askAi: "Zekât hakkında sor",
  clear: "Temizle",
};

const zakatAr: CorePatch["zakatCalculator"] = {
  title: "حاسبة الزكاة",
  eyebrow: "تقدير زكاة حنفي",
  lead: "أدخل المال: نقدًا، ذهبًا/فضة، بضائع تجارة، مستحقات وديون قصيرة. عند بلوغ النصاب يُحسب 2.5٪.",
  resultTitle: "الزكاة التقديرية",
  askAi: "اسأل عن الزكاة",
  clear: "مسح",
};

function mergeCore(locale: CorePatch): CorePatch {
  return {
    hatim: locale.hatim,
    qibla: locale.qibla,
    tasbih: locale.tasbih,
    duas: locale.duas,
    zakatCalculator: locale.zakatCalculator,
  };
}

export const CORE_SCREEN_LOCALE_PATCHES = {
  ru: mergeCore({
    hatim: hatimRu,
    qibla: qiblaRu,
    tasbih: tasbihRu,
    duas: duasRu,
    zakatCalculator: zakatRu,
  }),
  en: mergeCore({
    hatim: hatimEn,
    qibla: qiblaEn,
    tasbih: tasbihEn,
    duas: duasEn,
    zakatCalculator: zakatEn,
  }),
  ky: mergeCore({
    hatim: hatimKy,
    qibla: qiblaKy,
    tasbih: tasbihKy,
    duas: duasKy,
    zakatCalculator: zakatKy,
  }),
  uz: mergeCore({
    hatim: hatimUz,
    qibla: qiblaUz,
    tasbih: tasbihUz,
    duas: duasUz,
    zakatCalculator: zakatUz,
  }),
  tr: mergeCore({
    hatim: hatimTr,
    qibla: qiblaTr,
    tasbih: tasbihTr,
    duas: duasTr,
    zakatCalculator: zakatTr,
  }),
  ar: mergeCore({
    hatim: hatimAr,
    qibla: qiblaAr,
    tasbih: tasbihAr,
    duas: duasAr,
    zakatCalculator: zakatAr,
  }),
} as const satisfies Record<"ru" | "en" | "ky" | "uz" | "tr" | "ar", CorePatch>;
