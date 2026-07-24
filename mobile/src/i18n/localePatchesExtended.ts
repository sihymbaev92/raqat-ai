/**
 * Қолмен аудит: баптаулар, намаз нұсқаулығы, намаз хабарламалары.
 * LOCALE_PATCHES-ке қосылады.
 */
import type { kk } from "./kk";

type LocalePatch<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends object
    ? { [K in keyof T]?: LocalePatch<T[K]> }
    : T;

type ExtendedPatch = LocalePatch<typeof kk>;

const namazGuideRu: ExtendedPatch["namazGuide"] = {
  shortTitle: "Намаз",
  screenTitle: "Учебник намаза",
  intro:
    "Изучайте намаз по шагам: сначала омовение, затем от намерения до саляма. Уточняйте фикх у знающего наставника.",
  scholarReviewBanner:
    "Материал подготовлен по ханафитскому фикху; до официального одобрения учёного используйте только как учебник.",
  hubTitle: "Центр намаза",
  hubSub: "Быстрые ссылки и прогресс обучения",
  quickPrayerTimes: "Время намаза",
  wuduHeroTitle: "Омовение",
  wuduHeroSub: "10 шагов: картинка, краткое пояснение и читаемые дуа.",
  wuduStepsIntro:
    "Ханафитский порядок омовения: на каждом шаге картинка, действие и текст для чтения. Нажмите на картинку для полного экрана.",
  wuduTheoryTitle: "Дополнительная теория",
  wuduTheorySubtitle: "Виды омовения, нарушение, заметки для мужчин и женщин",
  sectionNamazMovesTitle: "Движения намаза и салям (с картинками)",
  learningWuduHeading: "Омовение: пошаговое обучение (арабский, транскрипция)",
  learningCommonMistakes: "Частые ошибки",
  learningCheckpoint: "Проверьте себя",
  stepMarkDone: "Этот шаг выполнен",
  stepMarkedDone: "Шаг отмечен",
  stepMarkDoneA11y: "Отметить шаг как выполненный",
  stepMarkedDoneA11y: "Шаг отмечен как выполненный",
  quizHeading: "Короткий тест (6 вопросов)",
  quizIntro: "Ответьте на каждый вопрос один раз; пояснение появится сразу. Результат сохраняется на устройстве.",
  quizScore: (correct, total) => `Правильных ответов: ${correct} / ${total}`,
  unifiedNamazTitle: "Руководство по намазу (полное)",
  unifiedNamazSubtitle: "Картинка, краткое пояснение, арабский текст, чтение и значение.",
  unifiedNamazIntro:
    "Порядок: намерение и такbir → кiyam → ruku → sujud → последнее сидение → salam. Открывайте блоки и заучивайте читаемый текст.",
  imageTapHint: "Картинка ниже; нажмите для полного экрана. Можно увеличить двумя пальцами.",
  closeImageLightbox: "Закрыть",
  openImageA11y: "Открыть картинку",
  progressWudu: "Шаги омовения",
  progressSteps: (done, total) => `${done} / ${total}`,
  progressQuiz: "Тест",
  progressQuizEmpty: "ещё нет",
};

const namazGuideEn: ExtendedPatch["namazGuide"] = {
  shortTitle: "Prayer",
  screenTitle: "Prayer Guide",
  intro:
    "Learn prayer step by step: wudu first, then from intention to salam. Confirm fiqh details with a qualified teacher.",
  scholarReviewBanner:
    "Content follows Hanafi fiqh; until scholar sign-off, use as a study guide only.",
  hubTitle: "Prayer hub",
  hubSub: "Quick links and learning progress",
  quickPrayerTimes: "Prayer times",
  wuduHeroTitle: "Wudu",
  wuduHeroSub: "10 steps: image, short explanation and recitations.",
  wuduStepsIntro:
    "Hanafi wudu order: each step has an image, action and text to recite. Tap the image for full screen.",
  wuduTheoryTitle: "Additional theory",
  wuduTheorySubtitle: "Types of wudu, nullification, notes for men and women",
  sectionNamazMovesTitle: "Prayer movements and salam (with images)",
  learningWuduHeading: "Wudu: step-by-step learning (Arabic, transliteration)",
  learningCommonMistakes: "Common mistakes",
  learningCheckpoint: "Check yourself",
  stepMarkDone: "I completed this step",
  stepMarkedDone: "Step marked",
  stepMarkDoneA11y: "Mark step as done",
  stepMarkedDoneA11y: "Step marked as done",
  quizHeading: "Short quiz (6 questions)",
  quizIntro: "Answer each question once; explanation appears immediately. Result is saved on device.",
  quizScore: (correct, total) => `Correct answers: ${correct} / ${total}`,
  unifiedNamazTitle: "Prayer guide (full)",
  unifiedNamazSubtitle: "Image, short explanation, Arabic text, recitation and meaning.",
  unifiedNamazIntro:
    "Order: intention and takbir → qiyam → ruku → sujud → final sitting → salam. Open blocks and memorize recitations.",
  imageTapHint: "Image below; tap for full screen. Pinch to zoom.",
  closeImageLightbox: "Close",
  openImageA11y: "Open image",
  progressWudu: "Wudu steps",
  progressSteps: (done, total) => `${done} / ${total}`,
  progressQuiz: "Quiz",
  progressQuizEmpty: "none yet",
};

const namazGuideAr: ExtendedPatch["namazGuide"] = {
  shortTitle: "الصلاة",
  screenTitle: "دليل الصلاة",
  intro:
    "تعلّم الصلاة خطوة بخطوة: الوضوء أولاً، ثم من النية إلى السلام. راجع الأحكام الفقهية مع عالم مختص.",
  scholarReviewBanner:
    "المحتوى وفق الفقه الحنفي؛ إلى حين اعتماد عالم، استخدمه كدليل تعليمي فقط.",
  hubTitle: "مركز الصلاة",
  hubSub: "روابط سريعة وتقدم التعلم",
  quickPrayerTimes: "مواقيت الصلاة",
  wuduHeroTitle: "الوضوء",
  wuduHeroSub: "10 خطوات: صورة، شرح مختصر وأذكار.",
  wuduStepsIntro:
    "ترتيب الوضوء الحنفي: في كل خطوة صورة وعمل ونص للقراءة. اضغط على الصورة للملء الشاشة.",
  wuduTheoryTitle: "نظرية إضافية",
  wuduTheorySubtitle: "أنواع الوضوء، ما ينقضه، ملاحظات للرجال والنساء",
  sectionNamazMovesTitle: "حركات الصلاة والسلام (مع صور)",
  learningWuduHeading: "الوضوء: تعلّم خطوة بخطوة (عربي ونقحرة)",
  learningCommonMistakes: "أخطاء شائعة",
  learningCheckpoint: "تحقق من نفسك",
  stepMarkDone: "أتممت هذه الخطوة",
  stepMarkedDone: "تم تعليم الخطوة",
  stepMarkDoneA11y: "تعليم الخطوة كمكتملة",
  stepMarkedDoneA11y: "الخطوة مكتملة",
  quizHeading: "اختبار قصير (6 أسئلة)",
  quizIntro: "أجب مرة واحدة على كل سؤال؛ يظهر الشرح فوراً. يُحفظ النتيجة على الجهاز.",
  quizScore: (correct, total) => `إجابات صحيحة: ${correct} / ${total}`,
  unifiedNamazTitle: "دليل الصلاة (كامل)",
  unifiedNamazSubtitle: "صورة، شرح، نص عربي، تلاوة ومعنى.",
  unifiedNamazIntro:
    "الترتيب: النية والتكبير → القيام → الركوع → السجود → الجلسة الأخيرة → السلام. افتح كل قسم واحفظ التلاوة.",
  imageTapHint: "الصورة أدناه؛ اضغط للملء الشاشة.",
  closeImageLightbox: "إغلاق",
  openImageA11y: "فتح الصورة",
  progressWudu: "خطوات الوضوء",
  progressSteps: (done, total) => `${done} / ${total}`,
  progressQuiz: "اختبار",
  progressQuizEmpty: "لا يوجد بعد",
};

const prayerNotifRu: ExtendedPatch["prayer"] = {
  enableNotif: "Включить уведомления",
  notifHint:
    "Уведомления планируются системным календарём — должны приходить вовремя даже если приложение закрыто (проверьте разрешения и точный будильник). При азане открывается полноэкранная страница.",
  notifSoundSection: "Звук уведомления о намазе",
  notifSoundHint: "Выбор применяется к запланированным уведомлениям. Нажмите ▶ чтобы прослушать.",
  iftarExtra: "Уведомление об ифтаре (Магриб)",
  iftarHint: "Дополнительное напоминание в время ифтара",
  iftarSuffix: "Ифтар",
  enteredFajr: "Время фаджра",
  enteredDhuhr: "Время зухра",
  enteredAsr: "Время асра",
  enteredMaghrib: "Время магриба",
  enteredIsha: "Время иша",
  enteredFallbackBody: (label: string) => `Наступило время ${label}.`,
  azanToggleOn: "Азан включён",
  azanToggleOff: "Азан выключен",
  azanToggleDisabledBySettings: "Азан отключён в настройках",
  nativeAzanChannelName: "Азан",
  nativeAzanChannelDesc: "Автоматически показывать экран азана при наступлении намаза",
  nativeAzanNotifBodyNoTime: "Азан · нажмите, чтобы открыть",
  nativeAzanNotifBodyWithTime: (time: string) => `${time} · Азан`,
  mosqueShiftHint: "Сдвиг времени мечети применяется к расписанию.",
  presets: "Города Казахстана",
};

const prayerNotifEn: ExtendedPatch["prayer"] = {
  enableNotif: "Enable notifications",
  notifHint:
    "Notifications are scheduled by the system calendar — they should arrive on time even when the app is closed. With adhan enabled, a full-screen page opens at prayer time.",
  notifSoundSection: "Prayer notification sound",
  notifSoundHint: "Your choice applies to scheduled alerts. Tap ▶ to preview.",
  iftarExtra: "Iftar reminder (Maghrib)",
  iftarHint: "Extra reminder at iftar time",
  iftarSuffix: "Iftar",
  enteredFajr: "Fajr time has entered",
  enteredDhuhr: "Dhuhr time has entered",
  enteredAsr: "Asr time has entered",
  enteredMaghrib: "Maghrib time has entered",
  enteredIsha: "Isha time has entered",
  enteredFallbackBody: (label: string) => `${label} time has entered.`,
  azanToggleOn: "Adhan on",
  azanToggleOff: "Adhan off",
  azanToggleDisabledBySettings: "Adhan disabled in settings",
  nativeAzanChannelName: "Adhan",
  nativeAzanChannelDesc: "Automatically show the adhan screen when prayer time enters",
  nativeAzanNotifBodyNoTime: "Adhan · tap to open",
  nativeAzanNotifBodyWithTime: (time: string) => `${time} · Adhan`,
  mosqueShiftHint: "Mosque time shift applies to the schedule.",
  presets: "Kazakhstan cities",
};

const prayerNotifAr: ExtendedPatch["prayer"] = {
  enableNotif: "تفعيل الإشعارات",
  notifHint:
    "تُجدول الإشعارات في تقويم النظام — يجب أن تصل في وقتها حتى عند إغلاق التطبيق. مع الأذان يُفتح شاشة كاملة.",
  notifSoundSection: "صوت إشعار الصلاة",
  notifSoundHint: "يُطبَّق اختيارك على التنبيهات المجدولة. اضغط ▶ للاستماع.",
  iftarExtra: "تذكير الإفطار (المغرب)",
  iftarHint: "تذكير إضافي عند الإفطار",
  iftarSuffix: "إفطار",
  enteredFajr: "دخل وقت الفجر",
  enteredDhuhr: "دخل وقت الظهر",
  enteredAsr: "دخل وقت العصر",
  enteredMaghrib: "دخل وقت المغرب",
  enteredIsha: "دخل وقت العشاء",
  enteredFallbackBody: (label: string) => `دخل وقت ${label}.`,
  azanToggleOn: "الأذان مفعّل",
  azanToggleOff: "الأذان متوقّف",
  azanToggleDisabledBySettings: "الأذان معطّل في الإعدادات",
  nativeAzanChannelName: "أذان",
  nativeAzanChannelDesc: "إظهار شاشة الأذان تلقائياً عند دخول وقت الصلاة",
  nativeAzanNotifBodyNoTime: "أذان · اضغط للفتح",
  nativeAzanNotifBodyWithTime: (time: string) => `${time} · أذان`,
  mosqueShiftHint: "يُطبَّق فرق وقت المسجد على الجدول.",
  presets: "مدن كازاخستان",
};

const prayerNotifTr: ExtendedPatch["prayer"] = {
  enableNotif: "Bildirimleri aç",
  notifHint:
    "Bildirimler sistem takvimiyle planlanır — uygulama kapalıyken de zamanında gelmelidir. Ezan açıksa namaz vaktinde tam ekran sayfa açılır.",
  notifSoundSection: "Namaz bildirim sesi",
  notifSoundHint: "Seçiminiz planlı uyarılara uygulanır. Önizlemek için ▶ dokunun.",
  iftarExtra: "İftar hatırlatması (Akşam)",
  iftarHint: "İftar vaktinde ek hatırlatma",
  iftarSuffix: "İftar",
  enteredFajr: "Sabah namazı vakti girdi",
  enteredDhuhr: "Öğle namazı vakti girdi",
  enteredAsr: "İkindi namazı vakti girdi",
  enteredMaghrib: "Akşam namazı vakti girdi",
  enteredIsha: "Yatsı namazı vakti girdi",
  enteredFallbackBody: (label: string) => `${label} vakti girdi.`,
  azanToggleOn: "Ezan açık",
  azanToggleOff: "Ezan kapalı",
  azanToggleDisabledBySettings: "Ezan ayarlarda kapalı",
  nativeAzanChannelName: "Ezan",
  nativeAzanChannelDesc: "Namaz vakti girince ezan ekranını otomatik göster",
  nativeAzanNotifBodyNoTime: "Ezan · açmak için dokunun",
  nativeAzanNotifBodyWithTime: (time: string) => `${time} · Ezan`,
  mosqueShiftHint: "Cami saati kayması programa uygulanır.",
  presets: "Kazakistan şehirleri",
};

const settingsExtendedRu: ExtendedPatch["settings"] = {
  prayerSettingsTitle: "Настройки намаза",
  prayerSettingsSubtitle: "Город, источник времени, уведомления и звук азана.",
  quranSettingsTitle: "Настройки Корана",
  hadithSettingsTitle: "Настройки хадисов",
  sectionLocationPrayer: "Местоположение и намаз",
  sectionLocationPrayerSub: "Город, источник времени и расписание.",
  sectionNotifications: "Уведомления",
  sectionNotificationsSub: "Напоминания о намазе и звук.",
  sectionQibla: "Кибла",
  sectionQiblaSub: "Скорость отклика компаса (на всех экранах).",
  qiblaMotionBalanced: "Сбалансированный",
  qiblaMotionFast: "Быстрый",
  cityTitle: "Город",
  cityChange: "Сменить город",
  cityPickerTitle: "Выбор города",
  cityPickerSearch: "Поиск города…",
  cityPickerRecent: "Недавние",
  prayerAzanQaSchedule90s: "Locked-screen QA (90 сек)",
  prayerAzanQaScheduling: "Планирование…",
  prayerAzanQaFailed: "QA-азан не запланирован — проверьте разрешение exact alarm.",
  prayerAzanQaSuccess: (sec: number) =>
    `QA-азан через ${sec} сек. Заблокируйте экран и сверните приложение.`,
  prayerAzanQaSuccessExactAlarmOff: (sec: number) =>
    `QA-азан через ${sec} сек. Exact alarm выключен — включите в настройках.`,
  prayerAzanQaErrorNativeOnly: "QA работает только с Android native модулем азана.",
  prayerAzanQaErrorScheduleEmpty: "Тестовый азан не запланирован — расписание пусто.",
  prayerAzanQaErrorModuleMissing: "Native модуль азана не найден.",
  prayerNotifDiagnosticsRefresh: "Обновить диагностику",
  prayerNotifDiagnosticsNoData: "Диагностика ещё не загружена.",
  prayerNotifDiagnosticPermission: "Разрешение",
  prayerNotifDiagnosticScheduled: "Запланированные намазы",
  prayerNotifDiagnosticSound: "Звук",
  prayerNotifDiagnosticChannel: "Android channel",
  prayerNotifDiagnosticMuted: "Намазы без звука",
  prayerAzanBatteryTitle: "Батарея и фоновый азан",
  languageAr: "العربية",
  languageTr: "Türkçe",
  languageKy: "Кыргызча",
  languageUz: "O'zbekcha",
  languageSectionSub:
    "Меню и навигация на казахском, русском, английском, кыргызском, узбекском, турецком и арабском.",
  diagnosticsSectionTitle: "Состояние приложения",
  diagnosticsSectionSubtitle: "Версия, API и разрешения азана в одном месте.",
  diagnosticsStatusOk: "OK",
  diagnosticsStatusBlock: "Блок",
  diagnosticsStatusUnknown: "Неизвестно",
  diagnosticsStatusReady: "Готово",
  diagnosticsStatusIdle: "Ожидание",
  diagnosticsStatusUnavailable: "Нет",
  diagnosticsCheckedNever: "ещё нет",
  diagnosticsLoadFailed: "Не удалось загрузить диагностику",
  diagnosticsExactAlarmWarning:
    "Разрешение exact alarm выключено: перед QA Azan на заблокированном телефоне включите его в настройках системы.",
  diagnosticsDetailSchedule: (scheduled, azan) =>
    `Расписание намаза: ${scheduled} · Native azan: ${azan}`,
  diagnosticsDetailPermissions: (exact) => `Точный будильник: ${exact}`,
  diagnosticsApiBase: (base) => `API base: ${base}`,
  diagnosticsApiNotSet: "не задан",
  themeSchemeNoir: "Тёмный",
  themeSchemeForest: "Тёмно-зелёный",
  themeSchemeTeal: "Бирюзовый",
  themeSchemeOcean: "Синий",
  themeSchemeWine: "Бordo",
  themeSchemeMidnight: "Ночь",
  themeSchemeLight: "Светлый",
  themeSchemeMeadow: "Светло-зелёный",
  themeSchemeMintDay: "Светлая бирюза",
  themeSchemeSky: "Небо",
  themeSchemeSand: "Песок",
  themeSchemeBlush: "Розовый",
  themePaletteDefault: "По умолчанию",
  notifPermission: "Разрешите уведомления в настройках системы.",
  notifScheduleEmpty: "Расписание пусто — проверьте город и разрешения.",
  notifOpenSystemSettings: "Открыть системные настройки",
  prayerNotifDiagnosticsTitle: "Диагностика уведомлений",
  prayerNotifDiagnosticsHint: "Статус разрешений и запланированных намазов.",
  accountLoginCompactHint:
    "Войдите через Google или Apple. Хатым и закладки Корана синхронизируются при наличии сети.",
  accountSecurityBlocked:
    "Безопасность устройства нарушена (root/jailbreak или подозрительные инструменты). Вход в аккаунт отключён для защиты ваших данных.",
  accountAuthUnavailableHint:
    "В этой сборке вход недоступен. Данные остаются на этом устройстве.",
  accountLoginOk: "Вы вошли. Данные хатыма синхронизируются при подключении к сети.",
};

const settingsExtendedEn: ExtendedPatch["settings"] = {
  prayerSettingsTitle: "Prayer settings",
  prayerSettingsSubtitle: "City, time source, notifications and adhan sound.",
  quranSettingsTitle: "Quran settings",
  hadithSettingsTitle: "Hadith settings",
  sectionLocationPrayer: "Location and prayer",
  sectionLocationPrayerSub: "City, time source and schedule.",
  sectionNotifications: "Notifications",
  sectionNotificationsSub: "Prayer reminders and sound.",
  sectionQibla: "Qibla",
  sectionQiblaSub: "Compass response speed (all screens).",
  qiblaMotionBalanced: "Balanced",
  qiblaMotionFast: "Fast",
  cityTitle: "City",
  cityChange: "Change city",
  cityPickerTitle: "Choose city",
  cityPickerSearch: "Search city…",
  cityPickerRecent: "Recent",
  prayerAzanQaSchedule90s: "Locked-screen QA (90 sec)",
  prayerAzanQaScheduling: "Scheduling…",
  prayerAzanQaFailed: "QA adhan was not scheduled — check exact alarm permission.",
  prayerAzanQaSuccess: (sec: number) =>
    `QA adhan in ${sec}s. Lock the screen and send the app to the background.`,
  prayerAzanQaSuccessExactAlarmOff: (sec: number) =>
    `QA adhan in ${sec}s. Exact alarm is off — enable it in settings.`,
  prayerAzanQaErrorNativeOnly: "QA works only with the Android native adhan module.",
  prayerAzanQaErrorScheduleEmpty: "Test adhan was not scheduled — schedule is empty.",
  prayerAzanQaErrorModuleMissing: "Native adhan module not found.",
  prayerNotifDiagnosticsRefresh: "Refresh diagnostics",
  prayerNotifDiagnosticsNoData: "Diagnostics not loaded yet.",
  prayerNotifDiagnosticPermission: "Permission",
  prayerNotifDiagnosticScheduled: "Scheduled prayers",
  prayerNotifDiagnosticSound: "Sound",
  prayerNotifDiagnosticChannel: "Android channel",
  prayerNotifDiagnosticMuted: "Muted prayers",
  languageAr: "العربية",
  languageTr: "Türkçe",
  languageKy: "Кыргызча",
  languageUz: "O'zbekcha",
  languageSectionSub:
    "Menus and navigation in Kazakh, Russian, English, Kyrgyz, Uzbek, Turkish and Arabic.",
  diagnosticsSectionTitle: "App status",
  diagnosticsSectionSubtitle: "Version, API and adhan permissions in one place.",
  diagnosticsStatusOk: "OK",
  diagnosticsStatusBlock: "Blocked",
  diagnosticsStatusUnknown: "Unknown",
  diagnosticsStatusReady: "Ready",
  diagnosticsStatusIdle: "Idle",
  diagnosticsStatusUnavailable: "Unavailable",
  diagnosticsCheckedNever: "never yet",
  diagnosticsLoadFailed: "Failed to load diagnostics",
  diagnosticsExactAlarmWarning:
    "Exact alarm permission is off: enable it in system settings before locked-phone adhan QA.",
  diagnosticsDetailSchedule: (scheduled, azan) =>
    `Prayer schedule: ${scheduled} · Native adhan: ${azan}`,
  diagnosticsDetailPermissions: (exact) => `Exact alarm: ${exact}`,
  diagnosticsApiBase: (base) => `API base: ${base}`,
  diagnosticsApiNotSet: "not set",
  themeSchemeNoir: "Dark",
  themeSchemeForest: "Forest",
  themeSchemeTeal: "Teal",
  themeSchemeOcean: "Ocean",
  themeSchemeWine: "Wine",
  themeSchemeMidnight: "Midnight",
  themeSchemeLight: "Light",
  themeSchemeMeadow: "Meadow",
  themeSchemeMintDay: "Mint day",
  themeSchemeSky: "Sky",
  themeSchemeSand: "Sand",
  themeSchemeBlush: "Blush",
  themePaletteDefault: "Default",
  notifPermission: "Allow notifications in system settings.",
  notifScheduleEmpty: "Schedule is empty — check city and permissions.",
  notifOpenSystemSettings: "Open system settings",
  prayerNotifDiagnosticsTitle: "Notification diagnostics",
  prayerNotifDiagnosticsHint: "Permission status and scheduled prayers.",
  accountLoginCompactHint:
    "Sign in with Google or Apple. Hatim and Quran bookmarks sync when online.",
  accountSecurityBlocked:
    "This device looks compromised (root/jailbreak or suspicious tools). Account sign-in is disabled to protect your data.",
  accountAuthUnavailableHint:
    "Sign-in is not available in this build. Your data stays on this device.",
  accountLoginOk: "Signed in. Hatim data will sync when you are online.",
};

const hadithEnGap: ExtendedPatch["hadith"] = {
  letterIndexHint:
    "Hadiths are ordered within the book (№ 1, 2, 3…) and grouped by chapter. Chapter titles come from the export source.",
  corpusArabicOnlyBadge: "Arabic original",
  collectionBukhari: "Sahih al-Bukhari",
  collectionMuslim: "Sahih Muslim",
  kkSourceTitle: "Source",
  refLabel: "Reference:",
  reliabilityTitle: "Reliability",
  notFound: "Hadith not found",
  arabic: "Original (Arabic)",
  inAppSourceOnly: "Shown in-app only. You are not sent to an external site.",
  openHadithList: "Hadith list",
  fullCorpusTitle: "Full list",
  fullCorpusSub:
    "Bukhari and Muslim offline. Only texts in the selected language are shown; trusted sources, no machine translation.",
  gradeUnknown: "not specified",
  gradeSahih: "sahih",
  sourceBadge: (v: string) => `Source: ${v}`,
  gradeBadge: (v: string) => `Grade: ${v}`,
  translationEn: "Meaning (English)",
  translationRu: "Meaning (Russian)",
  translationTr: "Meaning (Turkish)",
  translationKy: "Meaning (Kyrgyz)",
  translationUz: "Meaning (Uzbek)",
  hub: {
    emptyLocalePending:
      "No trusted hadith text is available in this language yet. Choose another language or check again later.",
    listHint:
      "Only hadiths in the selected language are shown. Texts come from trusted sources — no machine translation.",
  },
  trustedEditionHint: (locale: string) => {
    if (locale === "en")
      return "Source: fawazahmed0/hadith-api (eng) — MIT. Not machine translation.";
    if (locale === "ru")
      return "Source: fawazahmed0/hadith-api (rus) and/or HadeethEnc.com. Not machine translation.";
    if (locale === "tr")
      return "Source: fawazahmed0/hadith-api (tur) — MIT. Not machine translation.";
    if (locale === "ky" || locale === "uz")
      return "Source: HadeethEnc.com — trusted encyclopedia. Text is not altered; not machine translation.";
    return "Source: trusted edition. Not machine translation.";
  },
};

const hadithRuGap: ExtendedPatch["hadith"] = {
  corpusArabicOnlyBadge: "Арабский оригинал",
  collectionBukhari: "Сахих аль-Бухари",
  collectionMuslim: "Сахих Муслим",
  kkSourceTitle: "Источник",
  refLabel: "Ссылка:",
  reliabilityTitle: "Достоверность",
  notFound: "Хадис не найден",
  arabic: "Оригинал (арабский)",
  inAppSourceOnly: "Только в приложении. На внешний сайт не перенаправляем.",
  openHadithList: "Список хадисов",
  fullCorpusTitle: "Полный список",
  fullCorpusSub:
    "Бухари и Муслим офлайн. Показываются только тексты на выбранном языке; надёжные источники, без машинного перевода.",
  gradeUnknown: "не указано",
  gradeSahih: "сахих",
  sourceBadge: (v: string) => `Источник: ${v}`,
  gradeBadge: (v: string) => `Степень: ${v}`,
  translationEn: "Смысл (английский)",
  translationRu: "Смысл (русский)",
  translationTr: "Смысл (турецкий)",
  translationKy: "Смысл (киргизский)",
  translationUz: "Смысл (узбекский)",
  hub: {
    emptyLocalePending:
      "В этом языке пока нет надёжного текста хадиса. Выберите другой язык или проверьте позже.",
    listHint:
      "Показываются только хадисы на выбранном языке. Тексты из надёжных источников — без машинного перевода.",
  },
  trustedEditionHint: (locale: string) => {
    if (locale === "en")
      return "Источник: fawazahmed0/hadith-api (eng) — MIT. Не машинный перевод.";
    if (locale === "ru")
      return "Источник: fawazahmed0/hadith-api (rus) и/или HadeethEnc.com. Не машинный перевод.";
    if (locale === "tr")
      return "Источник: fawazahmed0/hadith-api (tur) — MIT. Не машинный перевод.";
    if (locale === "ky" || locale === "uz")
      return "Источник: HadeethEnc.com — надёжная энциклопедия. Текст не изменяется; не машинный перевод.";
    return "Источник: надёжное издание. Не машинный перевод.";
  },
};

const hadithKyGap: ExtendedPatch["hadith"] = {
  corpusArabicOnlyBadge: "Араб түп нуска",
  collectionBukhari: "Сахих ал-Бухари",
  collectionMuslim: "Сахих Муслим",
  kkSourceTitle: "Булагы",
  refLabel: "Шилтеме:",
  reliabilityTitle: "Ишенимдуулук",
  notFound: "Хадис табылган жок",
  arabic: "Түпнуска (арабча)",
  inAppSourceOnly: "Колдонмо ичинде гана. Тышкы сайтка жөнөтүлбөйт.",
  openHadithList: "Хадис тизмеси",
  fullCorpusTitle: "Толук тизме",
  fullCorpusSub:
    "Бухари жана Муслим оффлайн. Тандалган тилдеги тексттер гана көрсөтүлөт; ишенимдүү булак, машиналык котормо жок.",
  gradeUnknown: "көрсөтүлгөн эмес",
  gradeSahih: "сахих",
  sourceBadge: (v: string) => `Булагы: ${v}`,
  gradeBadge: (v: string) => `Даражасы: ${v}`,
  translationEn: "Мааниси (англисче)",
  translationRu: "Мааниси (орусча)",
  translationTr: "Мааниси (түркчө)",
  translationKy: "Мааниси (кыргызча)",
  translationUz: "Мааниси (өзбекче)",
  hub: {
    emptyLocalePending:
      "Бул тилде ишенимдүү хадис тексти азырынча жок. Башка тилди тандаңыз же кийинчерээк кайра текшериңиз.",
    listHint:
      "Тандалган тилдеги хадистер гана көрсөтүлөт. Тексттер ишенимдүү булактан — машиналык котормо жок.",
  },
  trustedEditionHint: (locale: string) => {
    if (locale === "en")
      return "Булагы: fawazahmed0/hadith-api (eng) — MIT. Машиналык котормо эмес.";
    if (locale === "ru")
      return "Булагы: fawazahmed0/hadith-api (rus) жана/же HadeethEnc.com. Машиналык котормо эмес.";
    if (locale === "tr")
      return "Булагы: fawazahmed0/hadith-api (tur) — MIT. Машиналык котормо эмес.";
    if (locale === "ky" || locale === "uz")
      return "Булагы: HadeethEnc.com — ишенимдүү энциклопедия. Текст өзгөртүлбөйт; машиналык котормо эмес.";
    return "Булагы: ишенимдүү басылыш. Машиналык котормо эмес.";
  },
};

const hadithUzGap: ExtendedPatch["hadith"] = {
  corpusArabicOnlyBadge: "Arab asl nusxa",
  collectionBukhari: "Sahih al-Buxoriy",
  collectionMuslim: "Sahih Muslim",
  kkSourceTitle: "Manba",
  refLabel: "Havola:",
  reliabilityTitle: "Ishonchlilik",
  notFound: "Hadis topilmadi",
  arabic: "Asl (arabcha)",
  inAppSourceOnly: "Faqat ilova ichida. Tashqi saytga yuborilmaydi.",
  openHadithList: "Hadislar ro'yxati",
  fullCorpusTitle: "To'liq ro'yxat",
  fullCorpusSub:
    "Buxoriy va Muslim oflayn. Faqat tanlangan tildagi matnlar ko'rsatiladi; ishonchli manba, mashina tarjimasi yo'q.",
  gradeUnknown: "ko'rsatilmagan",
  gradeSahih: "sahih",
  sourceBadge: (v: string) => `Manba: ${v}`,
  gradeBadge: (v: string) => `Daraja: ${v}`,
  translationEn: "Ma'no (inglizcha)",
  translationRu: "Ma'no (ruscha)",
  translationTr: "Ma'no (turkcha)",
  translationKy: "Ma'no (qirg'izcha)",
  translationUz: "Ma'no (o'zbekcha)",
  hub: {
    emptyLocalePending:
      "Bu tilda hali ishonchli hadis matni yo'q. Boshqa tilni tanlang yoki keyinroq qayta tekshiring.",
    listHint:
      "Faqat tanlangan tildagi hadislar ko'rsatiladi. Matnlar ishonchli manbadan — mashina tarjimasi yo'q.",
  },
  trustedEditionHint: (locale: string) => {
    if (locale === "en")
      return "Manba: fawazahmed0/hadith-api (eng) — MIT. Mashina tarjimasi emas.";
    if (locale === "ru")
      return "Manba: fawazahmed0/hadith-api (rus) va/yoki HadeethEnc.com. Mashina tarjimasi emas.";
    if (locale === "tr")
      return "Manba: fawazahmed0/hadith-api (tur) — MIT. Mashina tarjimasi emas.";
    if (locale === "ky" || locale === "uz")
      return "Manba: HadeethEnc.com — ishonchli ensiklopediya. Matn o'zgartirilmaydi; mashina tarjimasi emas.";
    return "Manba: ishonchli nashr. Mashina tarjimasi emas.";
  },
};

const hadithTrGap: ExtendedPatch["hadith"] = {
  corpusArabicOnlyBadge: "Arapça asıl metin",
  collectionBukhari: "Sahih-i Buhari",
  collectionMuslim: "Sahih-i Müslim",
  kkSourceTitle: "Kaynak",
  refLabel: "Referans:",
  reliabilityTitle: "Güvenilirlik",
  notFound: "Hadis bulunamadı",
  arabic: "Asıl (Arapça)",
  inAppSourceOnly: "Yalnızca uygulama içinde. Dış siteye yönlendirilmezsiniz.",
  openHadithList: "Hadis listesi",
  fullCorpusTitle: "Tam liste",
  fullCorpusSub:
    "Buhari ve Müslim çevrimdışı. Yalnızca seçilen dildeki metinler gösterilir; güvenilir kaynak, makine çevirisi yok.",
  gradeUnknown: "belirtilmedi",
  gradeSahih: "sahih",
  sourceBadge: (v: string) => `Kaynak: ${v}`,
  gradeBadge: (v: string) => `Derece: ${v}`,
  translationEn: "Anlam (İngilizce)",
  translationRu: "Anlam (Rusça)",
  translationTr: "Anlam (Türkçe)",
  translationKy: "Anlam (Kırgızca)",
  translationUz: "Anlam (Özbekçe)",
  hub: {
    emptyLocalePending:
      "Bu dilde henüz güvenilir hadis metni yok. Başka bir dil seçin veya daha sonra tekrar kontrol edin.",
    listHint:
      "Yalnızca seçilen dildeki hadisler gösterilir. Metinler güvenilir kaynaktan — makine çevirisi yok.",
  },
  trustedEditionHint: (locale: string) => {
    if (locale === "en")
      return "Kaynak: fawazahmed0/hadith-api (eng) — MIT. Makine çevirisi değil.";
    if (locale === "ru")
      return "Kaynak: fawazahmed0/hadith-api (rus) ve/veya HadeethEnc.com. Makine çevirisi değil.";
    if (locale === "tr")
      return "Kaynak: fawazahmed0/hadith-api (tur) — MIT. Makine çevirisi değil.";
    if (locale === "ky" || locale === "uz")
      return "Kaynak: HadeethEnc.com — güvenilir ansiklopedi. Metin değiştirilmez; makine çevirisi değil.";
    return "Kaynak: güvenilir baskı. Makine çevirisi değil.";
  },
};

const hadithArGap: ExtendedPatch["hadith"] = {
  corpusArabicOnlyBadge: "النص العربي",
  collectionBukhari: "صحيح البخاري",
  collectionMuslim: "صحيح مسلم",
  kkSourceTitle: "المصدر",
  refLabel: "المرجع:",
  reliabilityTitle: "الموثوقية",
  notFound: "الحديث غير موجود",
  arabic: "الأصل (عربي)",
  inAppSourceOnly: "داخل التطبيق فقط. لا يتم إرسالك إلى موقع خارجي.",
  openHadithList: "قائمة الأحاديث",
  fullCorpusTitle: "القائمة الكاملة",
  fullCorpusSub:
    "البخاري ومسلم دون اتصال. تُعرض فقط نصوص اللغة المختارة؛ مصادر موثوقة بلا ترجمة آلية.",
  gradeUnknown: "غير محدد",
  gradeSahih: "صحيح",
  sourceBadge: (v: string) => `المصدر: ${v}`,
  gradeBadge: (v: string) => `الدرجة: ${v}`,
  translationEn: "المعنى (الإنجليزية)",
  translationRu: "المعنى (الروسية)",
  translationTr: "المعنى (التركية)",
  translationKy: "المعنى (القيرغيزية)",
  translationUz: "المعنى (الأوزبكية)",
  hub: {
    emptyLocalePending:
      "لا يتوفر بعد نص حديث موثوق بهذه اللغة. اختر لغة أخرى أو تحقق لاحقًا.",
    listHint:
      "تُعرض فقط أحاديث اللغة المختارة. النصوص من مصادر موثوقة — بلا ترجمة آلية.",
  },
  trustedEditionHint: (locale: string) => {
    if (locale === "en")
      return "المصدر: fawazahmed0/hadith-api (eng) — MIT. ليست ترجمة آلية.";
    if (locale === "ru")
      return "المصدر: fawazahmed0/hadith-api (rus) و/أو HadeethEnc.com. ليست ترجمة آلية.";
    if (locale === "tr")
      return "المصدر: fawazahmed0/hadith-api (tur) — MIT. ليست ترجمة آلية.";
    if (locale === "ky" || locale === "uz")
      return "المصدر: HadeethEnc.com — موسوعة موثوقة. لا يُعدَّل النص؛ ليست ترجمة آلية.";
    return "المصدر: طبعة موثوقة. ليست ترجمة آلية.";
  },
};

const uzGap: Partial<ExtendedPatch> = {
  namazGuide: { learningWuduHeading: "Tahorat: bosqichma-bosqich o'qitish (arabcha, o'qilish)" },
  aiChat: { apiMissingDetail: "Xizmatga ulanib bo'lmadi. Keyinroq qayta urinib ko'ring." },
  kmdbHub: {
    officialSitesLead:
      "Rasmiy matnni ochib o'qing, tushunmagan joyini AI orqali manbaga tayangan holda so'rang.",
    tabMosques: "Masjidlar",
    tileMosques: "Masjidlar",
  },
  features: {
    halalHeroTagRegistry: "Rasmiy reestr",
    halalHubStubBanner:
      "Xarita nuqtasidan vaqtinchalik kartochka. To'liq ma'lumot onlayn bo'lganda rasmiy katalogdan yuklanadi.",
    hajjScanCdnHint: "Skan sahifalar tarmoq orqali yuklanadi; matn oflayn mavjud.",
    halalCheckPhotoTitle: "Shtrixkod surat",
    traditionGuide: {
      traditionScreenMapBody:
        "① Asil so'zlar — donishmand mualliflar, Abay «Qora so'z».\n② Kitoblar — rasmiy kutubxona, kundalik vositalar va an'ana qo'llanmalari.\n③ Urf-odat mavzulari — qidiruv, sevimlilar (asosiy ikkitasi hubda alohida).\n④ Ayt to'plami — Ro'za hayit + Qurbon hayit (alohida blok).",
    },
  },
  prayer: {
    notifSoundHint:
      "Tanlov rejalashtirilgan bildirishnomalar va «vaqt kirdi» ekraniga qo'llaniladi. ▶ orqali azonni tinglab ko'ring.",
  },
  settings: {
    diagnosticsSectionTitle: "Ilova holati",
    diagnosticsApiNotSet: "o'rnatilmagan",
    prayerNotifDiagnosticsHint:
      "Fresh install qabulida ruxsat, channel va rejalashtirilgan namoz sonini shu yerdan tekshiring.",
  },
};

const trGap: Partial<ExtendedPatch> = {
  namazGuide: { learningWuduHeading: "Abdest: adım adım öğrenme (Arapça, okunuş)" },
  aiChat: { apiMissingDetail: "Hizmete bağlanılamadı. Daha sonra tekrar deneyin." },
  kmdbHub: {
    officialSitesLead:
      "Resmi metni açıp okuyun; anlamadığınız yeri AI'dan kaynağa dayanarak sorun.",
    tabMosques: "Camiler",
    tileMosques: "Camiler",
  },
  knowledgePortal: { bilimTitle: "Dini bilgi" },
  features: {
    halalHeroTagRegistry: "Resmi kayıt",
    halalHubStubBanner:
      "Harita işaretinden geçici kart. Tam bilgi çevrimiçi olduğunda resmi kayıttan yüklenir.",
    hajjScanCdnHint: "Tarama sayfaları ağ üzerinden yüklenir; metin çevrimdışı kalır.",
    halalCheckPhotoTitle: "Barkod fotoğrafı",
    traditionGuide: {
      traditionScreenMapBody:
        "① Güzel sözler — bilge yazarlar, Abay «Kara söz».\n② Kitaplar — resmi kütüphane, günlük araçlar ve gelenek rehberleri.\n③ Gelenek konuları — arama, favoriler (iki temel konu hubda ayrı).\n④ Bayram derlemesi — Ramazan bayramı + Kurban bayramı (ayrı blok).",
    },
  },
  quran: {
    quranAudioStreamingNotice:
      "Seçilen ses tam indirilmedi. Dinlemek için internet gerekir; çalınan ayetler önbelleğe kaydedilir.",
  },
  settings: {
    diagnosticsSectionTitle: "Uygulama durumu",
    diagnosticsApiNotSet: "ayarlanmadı",
    prayerNotifDiagnosticsHint:
      "Fresh install kabulünde izin, kanal ve planlanan namaz sayısını buradan kontrol edin.",
  },
};

const arGap: Partial<ExtendedPatch> = {
  aiChat: { apiMissingDetail: "تعذّر الاتصال بالخدمة. حاول مرة أخرى لاحقًا." },
  kmdbHub: {
    officialSitesLead:
      "افتح النص الرسمي واقرأه، واسأل الذكاء الاصطناعي عما لا تفهمه استنادًا إلى المصدر.",
    tabMosques: "المساجد",
    tileMosques: "المساجد",
  },
  features: {
    halalHeroTagRegistry: "السجل الرسمي",
    halalHubStubBanner:
      "بطاقة مؤقتة من علامة الخريطة. تُحمَّل التفاصيل الكاملة من السجل عند الاتصال بالإنترنت.",
    hajjScanCdnHint: "صفحات المسح تُحمَّل عبر الشبكة؛ النص متاح دون اتصال.",
    halalCheckPhotoTitle: "صورة الباركود",
    traditionGuide: {
      traditionScreenMapBody:
        "① كلمات نبيلة — مؤلفون حكماء، أبي «كلمات العظة».\n② كتب — مكتبة رسمية وأدوات يومية وأدلة التقاليد.\n③ مواضيع العادات — بحث ومفضلة (الأساسان منفصلان في المركز).\n④ مجموعة الأعياد — عيد الفطر + عيد الأضحى (قسم منفصل).",
    },
  },
  settings: {
    prayerNotifDiagnosticsHint:
      "في Fresh install تحقق هنا من الإذن والقناة وعدد الصلوات المجدولة.",
  },
};

const settingsExtendedAr: ExtendedPatch["settings"] = {
  prayerSettingsTitle: "إعدادات الصلاة",
  prayerSettingsSubtitle: "المدينة، مصدر الوقت، الإشعارات وصوت الأذان.",
  sectionLocationPrayer: "الموقع والصلاة",
  sectionLocationPrayerSub: "المدينة، مصدر الوقت والجدول.",
  sectionNotifications: "الإشعارات",
  sectionNotificationsSub: "تذكير الصلاة والصوت.",
  sectionQibla: "القبلة",
  sectionQiblaSub: "سرعة استجابة البوصلة.",
  qiblaMotionBalanced: "متوازن",
  qiblaMotionFast: "سريع",
  cityPickerTitle: "اختيار المدينة",
  cityPickerSearch: "بحث عن مدينة…",
  cityPickerRecent: "الأخيرة",
  prayerAzanQaSchedule90s: "اختبار شاشة القفل (90 ث)",
  prayerAzanQaScheduling: "جارٍ الجدولة…",
  prayerAzanQaFailed: "لم تُجدول أذان الاختبار — تحقق من إذن المنبه الدقيق.",
  prayerAzanQaSuccess: (sec: number) =>
    `أذان الاختبار بعد ${sec} ث. اقفل الشاشة وأرسل التطبيق للخلفية.`,
  prayerAzanQaSuccessExactAlarmOff: (sec: number) =>
    `أذان الاختبار بعد ${sec} ث. المنبه الدقيق مغلق — فعّله من الإعدادات.`,
  prayerAzanQaErrorNativeOnly: "يعمل الاختبار فقط مع وحدة الأذان الأصلية في Android.",
  prayerAzanQaErrorScheduleEmpty: "لم يُجدول أذان الاختبار — الجدول فارغ.",
  prayerAzanQaErrorModuleMissing: "وحدة الأذان الأصلية غير موجودة.",
  languageAr: "العربية",
  languageTr: "Türkçe",
  languageSectionSub: "القوائم والتنقل بالعربية والكازاخية والروسية والإنجليزية وغيرها.",
  diagnosticsSectionTitle: "حالة التطبيق",
  diagnosticsDetailSchedule: (scheduled, azan) =>
    `جدول الصلاة: ${scheduled} · أذان أصلي: ${azan}`,
  diagnosticsDetailPermissions: (exact) => `منبه دقيق: ${exact}`,
  diagnosticsApiBase: (base) => `API base: ${base}`,
  diagnosticsApiNotSet: "غير مضبوط",
  notifPermission: "اسمح بالإشعارات في إعدادات النظام.",
  notifOpenSystemSettings: "فتح إعدادات النظام",
  prayerNotifDiagnosticsTitle: "تشخيص الإشعارات",
  accountLoginCompactHint:
    "سجّل الدخول عبر Google أو Apple. تُزامَن بيانات الختم وعلامات القرآن عند الاتصال.",
  accountSecurityBlocked:
    "يبدو أن الجهاز مخترق (root/jailbreak أو أدوات مشبوهة). تم تعطيل تسجيل الدخول لحماية بياناتك.",
  accountAuthUnavailableHint: "تسجيل الدخول غير متاح في هذا الإصدار. تبقى بياناتك على هذا الجهاز.",
  accountLoginOk: "تم تسجيل الدخول. تُزامَن بيانات الختم عند الاتصال بالإنترنت.",
};

export const EXTENDED_LOCALE_PATCHES = {
  ru: {
    namazGuide: namazGuideRu,
    prayer: prayerNotifRu,
    settings: settingsExtendedRu,
    features: {
      halalHubStubBanner:
        "Временная карточка с карты. Полные данные загружаются из реестра при подключении к сети.",
      hajjScanCdnHint: "Скан-страницы загружаются по сети; текст доступен офлайн.",
      halalCheckPhotoTitle: "Фото штрихкода",
      halalCheckGalleryBtn: "Галерея",
      halalCheckPhotoScanBusy: "Поиск…",
      halalCheckPhotoNoBarcode: "Штрихкод не найден",
      mosqueConfidenceVerified: "Подтверждённые данные",
      mosqueConfidencePartial: "Частично подтверждено",
      mosqueConfidenceMapOnly: "Только данные карты",
      traditionGuide: {
        favoriteTypeTopic: "Традиция",
        favoriteTypeArticle: "Статья",
        traditionScreenMapBody:
          "① Мудрые слова — авторы, Абай «Слова назидания».\n② Книги — официальная библиотека, ежедневные пособия и гайды по традициям.\n③ Темы обычаев — поиск, избранное (две основы отдельно на хабе).\n④ Сборник айтов — Ураза-байрам + Курбан-байрам (отдельный блок).",
      },
    },
    hadith: {
      ...hadithRuGap,
      citationFallback: (collectionName: string, ref: string) =>
        `${collectionName}, хадис № ${ref}`,
    },
    knowledgePortal: {
      notifQuickActionSearchFatwa: "Искать фетву",
      feedSourceApi: "Индекс QMDb",
      feedSourceLive: "Официальный сайт",
      feedSourceCache: "Сохранённый список",
      feedSourceSeed: "Офлайн выдержка",
    },
    quran: {
      ayahInlineSuffix: (n: number) => `${n}-аят`,
      mushafAyahA11y: (n: number) => `Аят ${n}`,
      ayahMenuPlayUntilSurahHint: "До конца суры",
    },
    qibla: {
      accuracyKm: (km: string) => `±${km} км`,
      accuracyM: (m: number) => `±${m} м`,
    },
  },
  en: {
    namazGuide: namazGuideEn,
    prayer: prayerNotifEn,
    settings: settingsExtendedEn,
    hadith: {
      ...hadithEnGap,
      citationFallback: (collectionName: string, ref: string) =>
        `${collectionName}, hadith no. ${ref}`,
    },
    knowledgePortal: {
      notifQuickActionSearchFatwa: "Search fatwa",
      feedSourceApi: "QMDb index",
      feedSourceLive: "Official site",
      feedSourceCache: "Saved list",
      feedSourceSeed: "Offline excerpt",
    },
    quran: {
      ayahInlineSuffix: (n: number) => `Ayah ${n}`,
      mushafAyahA11y: (n: number) => `Ayah ${n}`,
      ayahMenuPlayUntilSurahHint: "Until end of surah",
    },
    qibla: {
      accuracyKm: (km: string) => `±${km} km`,
      accuracyM: (m: number) => `±${m} m`,
    },
    features: {
      halalHubStubBanner:
        "Temporary map marker card. Full details load from the registry when online.",
      hajjScanCdnHint: "Scan pages load over the network; text stays available offline.",
      halalCheckPhotoTitle: "Barcode photo",
      halalCheckGalleryBtn: "Gallery",
      halalCheckPhotoScanBusy: "Searching…",
      halalCheckPhotoNoBarcode: "Barcode not found",
      mosqueConfidenceVerified: "Verified data",
      mosqueConfidencePartial: "Partially verified",
      mosqueConfidenceMapOnly: "Map data only",
      traditionGuide: {
        favoriteTypeTopic: "Tradition",
        favoriteTypeArticle: "Article",
        traditionScreenMapBody:
          "① Wise words — authors, Abai “Words of Edification”.\n② Books — official library, daily tools and tradition guides.\n③ Custom topics — search, favorites (two foundation topics separate on the hub).\n④ Ait collection — Oraza ait + Qurban ait (separate block).",
      },
    },
  },
  ky: {
    namazGuide: {
      shortTitle: "Намаз",
      screenTitle: "Намаз окуу китеби",
      intro:
        "Намазды кадам сайын үйрөнүңүз: адегенде даарат, андан кийин нияттен саламга чейин. Фикх деталдарын билген устаздан тактаңыз.",
      scholarReviewBanner:
        "Мазмун ханафи фикхы боюнча даярдалган; расмий аалым ырастоосуна чейин окуу колдонмосу катары гана колдонуңуз.",
      wuduHeroTitle: "Даарат",
      quizHeading: "Кыска сынак (6 суроо)",
      learningWuduHeading: "Даарат: кадам сайын үйрөнүү (арабча, окулушу)",
    },
    prayer: {
      enableNotif: "Билдирүүлөрдү кошуу",
      notifHint:
        "Билдирүүлөр система календары менен планлаштырылат — колдонмо жабык болсо да өз убагында келиши керек. Азан ачык болсо, намаз убагында толук экран ачылат.",
      notifSoundSection: "Намаз билдирүүсүнүн үнү",
      notifSoundHint:
        "Тандоо пландык билдирүүлөргө жана «убакыт кирди» экранына колдонулат. ▶ аркылуу азанды угуп көрүңүз.",
      iftarSuffix: "Ифтар",
      enteredFajr: "Багым намазы кирди",
      enteredDhuhr: "Бешим намазы кирди",
      enteredAsr: "Аср намазы кирди",
      enteredMaghrib: "Акшам намазы кирди",
      enteredIsha: "Кечки намаз кирди",
      enteredFallbackBody: (label: string) => `${label} убагы кирди.`,
      azanToggleOn: "Азан күйүк",
      azanToggleOff: "Азан өчүк",
      azanToggleDisabledBySettings: "Азан баптауларда өчүк",
      nativeAzanChannelName: "Азан",
      nativeAzanChannelDesc: "Намаз убагы киргенде азан экранын автоматтык көрсөтүү",
      nativeAzanNotifBodyNoTime: "Азан · ачуу үчүн басыңыз",
      nativeAzanNotifBodyWithTime: (time: string) => `${time} · Азан`,
    },
    settings: {
      prayerAzanQaSchedule90s: "Locked-screen QA (90 сек)",
      prayerAzanQaScheduling: "Пландалууда…",
      prayerAzanQaFailed: "QA азан пландалган жок — exact alarm уруксатын текшериңиз.",
      prayerAzanQaSuccess: (sec: number) => `QA азан ${sec} сек кийин. Экранды кулпулап, колдонмону фонго жибериңиз.`,
      prayerAzanQaSuccessExactAlarmOff: (sec: number) => `QA азан ${sec} сек кийин. Exact alarm өчүк — жөндөөдөн күйгүзүңүз.`,
      prayerAzanQaErrorNativeOnly: "QA Android native азан модулунда гана иштейт.",
      prayerAzanQaErrorScheduleEmpty: "Тест азан пландалган жок — график бош.",
      prayerAzanQaErrorModuleMissing: "Native азан модулу табылган жок.",
      languageAr: "العربية",
      languageTr: "Türkçe",
      languageSectionSub:
        "Меню казак, орус, англис, кыргыз, өзбек, түрк жана араб тилдеринде.",
      diagnosticsSectionTitle: "Колдонмо абалы",
      diagnosticsStatusOk: "OK",
      diagnosticsStatusBlock: "Блок",
      diagnosticsStatusUnknown: "Белгисиз",
      diagnosticsStatusReady: "Даяр",
      diagnosticsStatusIdle: "Күтүү",
      diagnosticsStatusUnavailable: "Жок",
      diagnosticsCheckedNever: "азырынча жок",
      diagnosticsLoadFailed: "Диагностика жүктөлгөн жок",
      diagnosticsExactAlarmWarning:
        "Exact alarm уруксаты өчүк: Azan QA алдында система баптауынан уруксат бериңиз.",
      diagnosticsApiNotSet: "коюлган эмес",
      prayerNotifDiagnosticsHint:
        "Fresh install кабылдоодо уруксат, channel жана пландык намаз санын ушул жерден текшериңиз.",
      accountLoginCompactHint:
        "Google же Apple аркылуу кириңиз. Хатым жана Куран белгилери онлайнда синхрондолот.",
      accountSecurityBlocked:
        "Түзмөк коопсуздугу бузулган (root/jailbreak же шектүү куралдар). Аккаунт кирүү өчүрүлдү.",
      accountAuthUnavailableHint:
        "Бул чогултууда кирүү жок. Маалыматтарыңыз ушул түзмөктө калат.",
      accountLoginOk: "Кирдиңиз. Хатым маалыматтары онлайнда синхрондолот.",
    },
  knowledgePortal: {
    notifQuickActionSearchFatwa: "Фетва издөө",
    feedSourceApi: "КМДБ индекс",
    feedSourceLive: "Расмий сайт",
    feedSourceCache: "Сакталган тизме",
    feedSourceSeed: "Офлайн үзүндү",
  },
  features: {
    halalCheckPhotoTitle: "Штрихкод сүрөтү",
    halalCheckGalleryBtn: "Галерея",
    halalCheckPhotoScanBusy: "Издөө…",
    halalCheckPhotoNoBarcode: "Штрихкод табылган жок",
    mosqueConfidenceVerified: "Ырасталган маалымат",
    mosqueConfidencePartial: "Жарым-жартылай ырасталган",
    mosqueConfidenceMapOnly: "Карта маалыматы гана",
    halalHubStubBanner:
      "Карта белгисинен убактылуу карточка. Толук маалымат онлайн болгондо расмий каталогдон жүктөлөт.",
    traditionGuide: {
      favoriteTypeTopic: "Салт",
      favoriteTypeArticle: "Макала",
      traditionScreenMapBody:
        "① Асыл сөздөр — даанышман авторлор, Абай «Кара сөз».\n② Китептер — расмий китепкана, күндөлүк окуу.\n③ Салт-санаа — үй-бүлө, той, ырым чектери.\n④ Диний байланыш — кыска түшүндүрмө жана далил.",
    },
  },
  hadith: {
    ...hadithKyGap,
  },
  quran: {
    ayahInlineSuffix: (n: number) => `${n}-аят`,
    mushafAyahA11y: (n: number) => `${n}-аят`,
    ayahMenuPlayUntilSurahHint: "Сүрө аягына чейин",
  },
},
uz: {
    namazGuide: {
      shortTitle: "Namoz",
      screenTitle: "Namoz qo'llanmasi",
      intro: namazGuideEn?.intro,
      scholarReviewBanner:
        "Mazmun hanafiy fiqhiga ko'ra tayyorlangan; rasmiy olim tasdig'i olgunicha faqat o'quv qo'llanma sifatida foydalaning.",
      wuduHeroTitle: "Tahorat",
      quizHeading: "Qisqa test (6 savol)",
      learningWuduHeading: uzGap.namazGuide?.learningWuduHeading,
    },
    prayer: {
      enableNotif: "Bildirishnomalarni yoqish",
      notifHint: prayerNotifEn?.notifHint,
      notifSoundHint: uzGap.prayer?.notifSoundHint,
      iftarSuffix: "Iftar",
      enteredFajr: "Bomdod vaqti kirdi",
      enteredDhuhr: "Peshin vaqti kirdi",
      enteredAsr: "Asr vaqti kirdi",
      enteredMaghrib: "Shom vaqti kirdi",
      enteredIsha: "Xufton vaqti kirdi",
      enteredFallbackBody: (label: string) => `${label} vaqti kirdi.`,
      azanToggleOn: "Azon yoqilgan",
      azanToggleOff: "Azon o'chirilgan",
      azanToggleDisabledBySettings: "Azon sozlamalarda o'chirilgan",
      nativeAzanChannelName: "Azon",
      nativeAzanChannelDesc: "Namoz vaqti kirganda azon ekranini avtomatik ko'rsatish",
      nativeAzanNotifBodyNoTime: "Azon · ochish uchun bosing",
      nativeAzanNotifBodyWithTime: (time: string) => `${time} · Azon`,
    },
    settings: {
      prayerAzanQaSchedule90s: "Locked-screen QA (90 sek)",
      prayerAzanQaScheduling: "Rejalashtirilmoqda…",
      prayerAzanQaFailed: "QA azon rejalashtirilmadi — exact alarm ruxsatini tekshiring.",
      prayerAzanQaSuccess: (sec: number) =>
        `QA azon ${sec} soniyadan keyin. Ekranni qulflang va ilovani fonda qoldiring.`,
      prayerAzanQaSuccessExactAlarmOff: (sec: number) =>
        `QA azon ${sec} soniyadan keyin. Exact alarm o'chiq — sozlamadan yoqing.`,
      prayerAzanQaErrorNativeOnly: "QA faqat Android native azon modulida ishlaydi.",
      prayerAzanQaErrorScheduleEmpty: "Test azon rejalashtirilmadi — jadval bo'sh.",
      prayerAzanQaErrorModuleMissing: "Native azon moduli topilmadi.",
      languageAr: "العربية",
      languageTr: "Türkçe",
      languageSectionSub: "Menyu va navigatsiya tanlangan tilda.",
      diagnosticsSectionTitle: uzGap.settings?.diagnosticsSectionTitle,
      diagnosticsStatusOk: "OK",
      diagnosticsStatusBlock: "Blok",
      diagnosticsStatusUnknown: "Noma'lum",
      diagnosticsStatusReady: "Tayyor",
      diagnosticsStatusIdle: "Kutilmoqda",
      diagnosticsStatusUnavailable: "Yo'q",
      diagnosticsCheckedNever: "hali yo'q",
      diagnosticsLoadFailed: "Diagnostikani yuklab bo'lmadi",
      diagnosticsExactAlarmWarning:
        "Exact alarm ruxsati o'chiq: qulflangan telefonda Azan QA dan oldin tizim sozlamalaridan yoqing.",
      diagnosticsApiNotSet: uzGap.settings?.diagnosticsApiNotSet,
      prayerNotifDiagnosticsHint: uzGap.settings?.prayerNotifDiagnosticsHint,
      accountLoginCompactHint:
        "Google yoki Apple orqali kiring. Hatim va Qur'on xatcho'plari onlayn bo'lganda sinxronlanadi.",
      accountSecurityBlocked:
        "Qurilma xavfsizligi buzilgan (root/jailbreak yoki shubhali vositalar). Hisobga kirish o'chirildi.",
      accountAuthUnavailableHint:
        "Bu buildda kirish mavjud emas. Ma'lumotlaringiz shu qurilmada qoladi.",
      accountLoginOk: "Kirdingiz. Hatim ma'lumotlari onlayn bo'lganda sinxronlanadi.",
    },
    aiChat: uzGap.aiChat,
    kmdbHub: uzGap.kmdbHub,
    knowledgePortal: {
      notifQuickActionSearchFatwa: "Fatvo qidirish",
      feedSourceApi: "QMDb indeks",
      feedSourceLive: "Rasmiy sayt",
      feedSourceCache: "Saqlangan ro'yxat",
      feedSourceSeed: "Oflayn parcha",
    },
    features: {
      ...uzGap.features,
      halalCheckGalleryBtn: "Galereya",
      halalCheckPhotoScanBusy: "Qidiruv…",
      halalCheckPhotoNoBarcode: "Shtrixkod topilmadi",
      mosqueConfidenceVerified: "Tasdiqlangan ma'lumot",
      mosqueConfidencePartial: "Qisman tasdiqlangan",
      mosqueConfidenceMapOnly: "Faqat xarita ma'lumoti",
      traditionGuide: {
        ...uzGap.features?.traditionGuide,
        favoriteTypeTopic: "An'ana",
        favoriteTypeArticle: "Maqola",
      },
    },
    hadith: { ...hadithUzGap },
    quran: {
      ayahInlineSuffix: (n: number) => `${n}-oyat`,
      mushafAyahA11y: (n: number) => `${n}-oyat`,
      ayahMenuPlayUntilSurahHint: "Sura oxirigacha",
    },
  },
  tr: {
    namazGuide: {
      shortTitle: "Namaz",
      screenTitle: "Namaz rehberi",
      intro:
        "Namazı adım adım öğrenin: önce abdest, sonra niyetten selama kadar. Fıkhi detayları hocanıza sorun.",
      scholarReviewBanner:
        "İçerik Hanefi fıkhına göre hazırlanmıştır; alim onayı alınana kadar yalnızca öğrenme rehberi olarak kullanın.",
      wuduHeroTitle: "Abdest",
      quizHeading: "Kısa test (6 soru)",
      learningWuduHeading: trGap.namazGuide?.learningWuduHeading,
    },
    prayer: prayerNotifTr,
    settings: {
      prayerAzanQaSchedule90s: "Locked-screen QA (90 sn)",
      prayerAzanQaScheduling: "Planlanıyor…",
      prayerAzanQaFailed: "QA ezan planlanmadı — exact alarm iznini kontrol edin.",
      prayerAzanQaSuccess: (sec: number) => `QA ezan ${sec} sn sonra. Ekranı kilitleyip uygulamayı arka plana alın.`,
      prayerAzanQaSuccessExactAlarmOff: (sec: number) => `QA ezan ${sec} sn sonra. Exact alarm kapalı — ayarlardan açın.`,
      prayerAzanQaErrorNativeOnly: "QA yalnızca Android native ezan modülünde çalışır.",
      prayerAzanQaErrorScheduleEmpty: "Test ezanı planlanmadı — program boş.",
      prayerAzanQaErrorModuleMissing: "Native ezan modülü bulunamadı.",
      languageAr: "العربية",
      languageTr: "Türkçe",
      languageSectionSub: "Menü ve gezinme seçilen dilde çalışır.",
      sectionNotifications: "Bildirimler",
      sectionNotificationsSub: "Namaz hatırlatmaları ve ses.",
      diagnosticsSectionTitle: trGap.settings?.diagnosticsSectionTitle,
      diagnosticsStatusOk: "OK",
      diagnosticsStatusBlock: "Engelli",
      diagnosticsStatusUnknown: "Bilinmiyor",
      diagnosticsStatusReady: "Hazır",
      diagnosticsStatusIdle: "Beklemede",
      diagnosticsStatusUnavailable: "Yok",
      diagnosticsCheckedNever: "henüz yok",
      diagnosticsLoadFailed: "Tanılama yüklenemedi",
      diagnosticsExactAlarmWarning:
        "Exact alarm izni kapalı: kilitli telefonda Azan QA öncesi sistem ayarlarından açın.",
      diagnosticsApiNotSet: trGap.settings?.diagnosticsApiNotSet,
      prayerNotifDiagnosticsHint: trGap.settings?.prayerNotifDiagnosticsHint,
      accountLoginCompactHint:
        "Google veya Apple ile giriş yapın. Hatim ve Kur'an yer işaretleri çevrimiçiyken senkronlanır.",
      accountSecurityBlocked:
        "Cihaz güvenliği bozulmuş (root/jailbreak veya şüpheli araçlar). Hesap girişi kapatıldı.",
      accountAuthUnavailableHint:
        "Bu derlemede giriş yok. Verileriniz bu cihazda kalır.",
      accountLoginOk: "Giriş yapıldı. Hatim verileri çevrimiçiyken senkronlanır.",
    },
    aiChat: trGap.aiChat,
    kmdbHub: trGap.kmdbHub,
    knowledgePortal: {
      ...trGap.knowledgePortal,
      notifQuickActionSearchFatwa: "Fetva ara",
      feedSourceApi: "QMDb dizini",
      feedSourceLive: "Resmi site",
      feedSourceCache: "Kayıtlı liste",
      feedSourceSeed: "Çevrimdışı özet",
    },
    features: {
      ...trGap.features,
      halalCheckGalleryBtn: "Galeri",
      halalCheckPhotoScanBusy: "Aranıyor…",
      halalCheckPhotoNoBarcode: "Barkod bulunamadı",
      mosqueConfidenceVerified: "Doğrulanmış veri",
      mosqueConfidencePartial: "Kısmen doğrulanmış",
      mosqueConfidenceMapOnly: "Yalnızca harita verisi",
      traditionGuide: {
        ...trGap.features?.traditionGuide,
        favoriteTypeTopic: "Gelenek",
        favoriteTypeArticle: "Makale",
      },
    },
    quran: {
      ...trGap.quran,
      ayahInlineSuffix: (n: number) => `${n}. ayet`,
      mushafAyahA11y: (n: number) => `${n}. ayet`,
      ayahMenuPlayUntilSurahHint: "Sure sonuna kadar",
    },
    hadith: { ...hadithTrGap },
  },
  ar: {
    namazGuide: namazGuideAr,
    prayer: prayerNotifAr,
    settings: {
      ...settingsExtendedAr,
      prayerNotifDiagnosticsHint: arGap.settings?.prayerNotifDiagnosticsHint,
      diagnosticsStatusOk: "OK",
      diagnosticsStatusBlock: "محظور",
      diagnosticsStatusUnknown: "غير معروف",
      diagnosticsStatusReady: "جاهز",
      diagnosticsStatusIdle: "انتظار",
      diagnosticsStatusUnavailable: "غير متاح",
      diagnosticsCheckedNever: "ليس بعد",
      diagnosticsLoadFailed: "تعذّر تحميل التشخيص",
    },
    aiChat: arGap.aiChat,
    kmdbHub: arGap.kmdbHub,
    knowledgePortal: {
      notifQuickActionSearchFatwa: "البحث عن فتوى",
      feedSourceApi: "فهرس QMDb",
      feedSourceLive: "الموقع الرسمي",
      feedSourceCache: "القائمة المحفوظة",
      feedSourceSeed: "مقتطف دون اتصال",
    },
    features: {
      ...arGap.features,
      mosqueConfidenceVerified: "بيانات مؤكدة",
      mosqueConfidencePartial: "مؤكد جزئياً",
      mosqueConfidenceMapOnly: "بيانات الخريطة فقط",
      halalCheckGalleryBtn: "المعرض",
      halalCheckPhotoScanBusy: "جاري البحث…",
      halalCheckPhotoNoBarcode: "لم يُعثر على باركود",
    },
    hadith: { ...hadithArGap },
    quran: {
      ayahInlineSuffix: (n: number) => `آية ${n}`,
      mushafAyahA11y: (n: number) => `آية ${n}`,
      ayahMenuPlayUntilSurahHint: "حتى نهاية السورة",
    },
  },
} as const satisfies Record<Exclude<import("./runtime").AppLocale, "kk">, ExtendedPatch>;
