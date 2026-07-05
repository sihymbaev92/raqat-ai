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
  learningWuduHeading: "الوضوء: تعلم خطوة بخطوة (عربي، транскription)",
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
    "الترتيب: النية والتكbir → القيام → الركوع → السجود → الجلسة الأخيرة → السلام. افتح كل قسم واحفظ التلاوة.",
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
  mosqueShiftHint: "يُطبَّق فرق وقت المسجد على الجدول.",
  presets: "مدن كازاخستان",
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
  languageAr: "العربية",
  languageTr: "Türkçe",
  languageKy: "Кыргызча",
  languageUz: "O'zbekcha",
  languageSectionSub:
    "Меню и навигация на казахском, русском, английском, кыргызском, узбекском, турецком и арабском.",
  diagnosticsSectionTitle: "Состояние приложения",
  diagnosticsSectionSubtitle: "Версия, API и разрешения азана в одном месте.",
  diagnosticsDetailSchedule: (scheduled, azan) =>
    `Расписание намаза: ${scheduled} · Native azan: ${azan}`,
  diagnosticsDetailPermissions: (exact, fullscreen) =>
    `Точный будильник: ${exact} · Полный экран: ${fullscreen}`,
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
  accountLoginCompactHint: "Gmail, Apple или телефон — синхронизация хатма и AI.",
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
  languageAr: "العربية",
  languageTr: "Türkçe",
  languageKy: "Кыргызча",
  languageUz: "O'zbekcha",
  languageSectionSub:
    "Menus and navigation in Kazakh, Russian, English, Kyrgyz, Uzbek, Turkish and Arabic.",
  diagnosticsSectionTitle: "App status",
  diagnosticsSectionSubtitle: "Version, API and adhan permissions in one place.",
  diagnosticsDetailSchedule: (scheduled, azan) =>
    `Prayer schedule: ${scheduled} · Native adhan: ${azan}`,
  diagnosticsDetailPermissions: (exact, fullscreen) =>
    `Exact alarm: ${exact} · Full screen: ${fullscreen}`,
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
  accountLoginCompactHint: "Gmail, Apple or phone — syncs hatim and AI history.",
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
  languageAr: "العربية",
  languageTr: "Türkçe",
  languageSectionSub: "القوائم والتنقل بالعربية والكازاخية والروسية والإنجليزية وغيرها.",
  diagnosticsSectionTitle: "حالة التطبيق",
  diagnosticsDetailSchedule: (scheduled, azan) =>
    `جدول الصلاة: ${scheduled} · أذان أصلي: ${azan}`,
  diagnosticsDetailPermissions: (exact, fullscreen) =>
    `منبه دقيق: ${exact} · ملء الشاشة: ${fullscreen}`,
  diagnosticsApiBase: (base) => `API base: ${base}`,
  diagnosticsApiNotSet: "غير مضبوط",
  notifPermission: "اسمح بالإشعارات في إعدادات النظام.",
  notifOpenSystemSettings: "فتح إعدادات النظام",
  prayerNotifDiagnosticsTitle: "تشخيص الإشعارات",
};

export const EXTENDED_LOCALE_PATCHES = {
  ru: {
    namazGuide: namazGuideRu,
    prayer: prayerNotifRu,
    settings: settingsExtendedRu,
  },
  en: {
    namazGuide: namazGuideEn,
    prayer: prayerNotifEn,
    settings: settingsExtendedEn,
  },
  ky: {
    namazGuide: {
      shortTitle: "Намаз",
      screenTitle: "Намaz окуу китеби",
      intro: namazGuideRu?.intro,
      wuduHeroTitle: "Дарет",
      quizHeading: "Кыска сынак (6 суроo)",
    },
    prayer: {
      enableNotif: "Билдирүүлөрдү кошуу",
      notifHint: prayerNotifRu?.notifHint,
    },
    settings: {
      languageAr: "العربية",
      languageTr: "Türkçe",
      languageSectionSub: "Меню казак, орус, англис, кыргыз, узбек, турк жана араб тилдерinde.",
    },
  },
  uz: {
    namazGuide: {
      shortTitle: "Namoz",
      screenTitle: "Namoz qo'llanmasi",
      intro: namazGuideEn?.intro,
      wuduHeroTitle: "Tahorat",
      quizHeading: "Qisqa test (6 savol)",
    },
    prayer: {
      enableNotif: "Bildirishnomalarni yoqish",
      notifHint: prayerNotifEn?.notifHint,
    },
    settings: {
      languageAr: "العربية",
      languageTr: "Türkçe",
      languageSectionSub: "Menyu va navigatsiya tanlangan tilda.",
    },
  },
  tr: {
    namazGuide: {
      shortTitle: "Namaz",
      screenTitle: "Namaz rehberi",
      intro:
        "Namazı adım adım öğrenin: önce abdest, sonra niyetten selama kadar. Fıkhi detayları hocanıza sorun.",
      wuduHeroTitle: "Abdest",
      quizHeading: "Kısa test (6 soru)",
    },
    prayer: prayerNotifRu,
    settings: {
      languageAr: "العربية",
      languageTr: "Türkçe",
      languageSectionSub: "Menü ve gezinme seçilen dilde çalışır.",
      sectionNotifications: "Bildirimler",
      sectionNotificationsSub: "Namaz hatırlatmaları ve ses.",
    },
  },
  ar: {
    namazGuide: namazGuideAr,
    prayer: prayerNotifAr,
    settings: settingsExtendedAr,
  },
  zh: {},
  fa: {},
  id: {},
  ms: {},
  hi: {},
  ku: {},
} as const satisfies Record<Exclude<import("./runtime").AppLocale, "kk">, ExtendedPatch>;
