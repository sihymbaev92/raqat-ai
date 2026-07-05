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
};

const hatimUz: CorePatch["hatim"] = hatimKy;

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
  hintAligned: "Стрелка направлена к Каабе. Металл и магнитные поля могут влиять на точность.",
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
  hintAligned: "Arrow points toward the Kaaba. Metal and magnetic fields may affect accuracy.",
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
} as const satisfies Record<"ru" | "en" | "ky" | "uz", CorePatch>;
