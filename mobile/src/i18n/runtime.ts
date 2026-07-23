import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { I18nManager, Platform } from "react-native";
import { kk } from "./kk";
import {
  PRAYER_AZAN_PATCH_AR,
  PRAYER_AZAN_PATCH_KY,
  PRAYER_AZAN_PATCH_TR,
  PRAYER_AZAN_PATCH_UZ,
} from "./azanLocalePatches";
import { CRITICAL_UI_LOCALE_PATCHES } from "./criticalUiLocalePatches";
import { FEATURE_LOCALE_PATCHES } from "./featureLocalePatches";
import { collectKkStringLeaves, findKyLocaleLeaks } from "./localeLeakScan";
import { CORE_SCREEN_LOCALE_PATCHES } from "./localePatchesCoreScreens";
import { EXTENDED_LOCALE_PATCHES } from "./localePatchesExtended";
import { RU_RESIDUAL_CHROME_PATCH } from "./ruResidualChromePatch";
import {
  areOfflineAutoTranslationsReady,
  ensureOfflineAutoTranslationsLoaded,
  getOfflineAutoTranslation,
  hasOfflineAutoTranslationLocale,
  pruneOfflineAutoTranslationsToLocale,
  seedApkOfflineTranslationsSync,
  type OfflineAutoTranslateTarget,
} from "../services/offlineAutoTranslations";

const LOCALE_KEY = "raqat_app_locale_v1";

export type AppLocale =
  | "kk"
  | "ru"
  | "en"
  | "ky"
  | "uz"
  | "tr"
  | "ar";

/** Ағымдағы UI тіліндегі тіл атауы (nativeLabel емес — ru-да «Казахский»). */
export function appLocaleDisplayLabel(id: AppLocale): string {
  switch (id) {
    case "kk":
      return kk.settings.languageKk;
    case "ru":
      return kk.settings.languageRu;
    case "en":
      return kk.settings.languageEn;
    case "ky":
      return kk.settings.languageKy;
    case "uz":
      return kk.settings.languageUz;
    case "tr":
      return kk.settings.languageTr;
    case "ar":
      return kk.settings.languageAr;
    default:
      return id;
  }
}

export type AppLocaleOption = {
  id: AppLocale;
  label: string;
  nativeLabel: string;
  flagIso: string;
  subtitle?: string;
};

export const APP_LOCALE_OPTIONS: readonly AppLocaleOption[] = [
  { id: "kk", label: "Қазақша", nativeLabel: "Қазақша", flagIso: "KZ" },
  { id: "ru", label: "Русский", nativeLabel: "Русский", flagIso: "RU" },
  { id: "en", label: "English", nativeLabel: "English", flagIso: "GB" },
  { id: "ky", label: "Кыргызча", nativeLabel: "Кыргызча", flagIso: "KG" },
  { id: "uz", label: "Oʻzbekcha", nativeLabel: "Oʻzbekcha", flagIso: "UZ" },
  { id: "tr", label: "Türkçe", nativeLabel: "Türkçe", flagIso: "TR" },
  { id: "ar", label: "العربية", nativeLabel: "العربية", flagIso: "SA" },
];

const APP_LOCALE_IDS = new Set<AppLocale>(APP_LOCALE_OPTIONS.map((opt) => opt.id));

type LocalePatch<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends object
    ? { [K in keyof T]?: LocalePatch<T[K]> }
    : T;

const LOCALE_PATCHES: Record<Exclude<AppLocale, "kk">, LocalePatch<typeof kk>> = {
  ru: {
    common: {
      loading: "Загрузка…",
      error: "Ошибка",
      retry: "Повторить",
      save: "Сохранить",
      cancel: "Отмена",
      close: "Закрыть",
      next: "Далее",
      skip: "Позже",
      done: "Готово",
      back: "Назад",
      filterAll: "Все",
      offlineBadge: "Офлайн данные",
      autoTranslateNotice: "Автоматический перевод — возможны неточности. Оригинал на казахском.",
    },
    onboarding: {
      title: "Добро пожаловать в RAHAT OMIR",
      step1:
        "В приложении есть время намаза, Коран, хатм, дуа, кибла, хадисы и религиозные учебники. Для корректной работы киблы и времени намаза может потребоваться доступ к местоположению. Город, уведомления и другие настройки можно изменить позже в разделе «Настройки».",
      start: "Понятно",
      languageTitle: "Язык приложения",
      languageHint: "Выберите язык приложения. Изменить можно позже в настройках.",
    },
    tabs: {
      homeTabA11y: "Главный экран",
      home: "Главная",
      times: "Время",
      qibla: "Кибла",
      asma: "99 имен Аллаха",
      asmaSub: "99 имен",
      tasbih: "Зикры",
      more: "Еще",
    },
    navigation: {
      duasTitle: "Дуа",
      surahTitle: "Сура",
      telegramTitle: "Telegram",
      tabHome: "Главная",
      tabArticles: "Статьи",
      tabPrayerTimes: "Намаз",
      tabSaved: "Сохраненные",
      tabProfile: "Профиль",
      openDashboard: "Главная",
      pressBackAgainToExit: "Нажмите «Назад» еще раз для выхода",
      contentHubTitle: "Меню",
      contentHubSub:
        "Главный экран держит ежедневное ядро: намаз, Коран и халал. Здесь собраны дополнительные знания и инструменты.",
      contentHubSectionWorship: "Поклонение",
      contentHubSectionKnowledge: "Знания и источники",
      contentHubSectionCommunity: "Дополнительные инструменты",
    },
    dashboard: {
      greeting: "Ассаляму алейкум",
      heroTagline: "Намаз, Коран, дуа и знания — в одном приложении",
      today: "сегодня",
      nextPrayer: "Следующий намаз",
      scheduleTable: "Расписание на сегодня",
      qiblaStrip: "Направление киблы",
      morePrayerLink: "Подробнее",
      morePrayerLinkTarget: "время намаза",
      servicesHeading: "Разделы",
      articlesSeeAll: "Смотреть все",
      articleBadge: "Статья",
      heroQuranTitle: "Коран",
      heroHadithTitle: "Достоверные хадисы",
      heroDuaTitle: "Дуа сообщества",
      heroDuaSub: "Поделиться · амин",
      heroAiStripTitle: "Центр источников",
      dailyAiLabel: "Центр источников",
      promoAiHeadline: "Центр источников",
      promoHalalHeadline: "ХАЛАЛ ДАМУ",
      promoHolidayKurbanTitle: "Курбан-байрам",
      quickMenu: "Еще",
      duasShort: "Дуа",
      settingsShort: "Настройки",
      telegramShort: "Telegram",
      quranShort: "Коран",
      tileSeerah: "Сира",
      tileHadith: "Хадисы",
      arabicLettersTile: "Алфавит",
      traditionTileShort: "Религия и традиции",
      traditionDinHubLabel: "Религия и традиции",
      radialLauncherMenuA11y: "Основные разделы",
      radialLauncherFabLabel: "Меню",
    },
    prayer: {
      title: "Время намаза",
      city: "Город",
      country: "Страна",
      refresh: "Обновить",
      fajr: "Фаджр",
      sunrise: "Восход",
      dhuhr: "Зухр",
      asr: "Аср",
      maghrib: "Магриб",
      isha: "Иша",
      fajrShort: "Фаджр",
      sunriseShort: "Восход",
      dhuhrShort: "Зухр",
      asrShort: "Аср",
      maghribShort: "Магриб",
      ishaShort: "Иша",
      notifications: "Уведомления",
      azanScreenKicker: "Время намаза наступило",
      azanScreenDefaultLabel: "Намаз",
      azanScreenBody:
        "Азан будет прочитан полностью. При необходимости остановите его кнопкой ниже.",
      azanTextPanelTitle: "Текст азана",
      azanScreenStop: "Остановить азан",
      azanScreenStopped: "Азан остановлен",
      azanTextBlocks: [
        {
          id: "takbir-open",
          arabic: "اللَّهُ أَكْبَرُ",
          translit: "Аллаху акбар",
          meaning: "Аллах Велик.",
          repeat: "4 раза",
        },
        {
          id: "shahada-tawhid",
          arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ",
          translit: "Ашхаду алля иляха илля-Ллах",
          meaning: "Свидетельствую, что нет божества, достойного поклонения, кроме Аллаха.",
          repeat: "2 раза",
        },
        {
          id: "shahada-risala",
          arabic: "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
          translit: "Ашхаду анна Мухаммадан расулю-Ллах",
          meaning: "Свидетельствую, что Мухаммад — Посланник Аллаха.",
          repeat: "2 раза",
        },
        {
          id: "hayya-salah",
          arabic: "حَيَّ عَلَى الصَّلَاةِ",
          translit: "Хайя 'аля-с-салях",
          meaning: "Спешите на намаз.",
          repeat: "2 раза",
        },
        {
          id: "hayya-falah",
          arabic: "حَيَّ عَلَى الْفَلَاحِ",
          translit: "Хайя 'аля-ль-фалях",
          meaning: "Спешите к спасению и успеху.",
          repeat: "2 раза",
        },
        {
          id: "takbir-close",
          arabic: "اللَّهُ أَكْبَرُ",
          translit: "Аллаху акбар",
          meaning: "Аллах Велик.",
          repeat: "2 раза",
        },
        {
          id: "tahlil",
          arabic: "لَا إِلٰهَ إِلَّا اللَّهُ",
          translit: "Ля иляха илля-Ллах",
          meaning: "Нет божества, достойного поклонения, кроме Аллаха.",
        },
      ],
      fajrAzanTextBlock: {
        id: "fajr-extra",
        arabic: "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ",
        translit: "Ас-саляту хайрум-минан-наум",
        meaning: "Намаз лучше сна.",
        repeat: "2 раза",
      },
      azanDuaTextBlock: {
        id: "azan-dua",
        arabic:
          "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَالدَّرَجَةَ الرَّفِيعَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
        translit:
          "Аллахумма рабба хазихи-д-да'вати-т-таммати ва-с-саляти-ль-ка'имати, ати Мухаммадан аль-василата ва-ль-фадилата вад-даражатар-рафи'а. Ваб'асху макамам-махмуданил-лязи ва'адтах. Иннака ля тухлифул-ми'ад.",
        meaning:
          "О Аллах, Господь этого полного азана и совершаемой молитвы! Даруй Мухаммаду василя, достоинство и высокую степень! Возведи его на обещанное Тобой «восхваляемое место». Ты не нарушаешь Своего обещания.",
      },
      enteredFajr: "Наступило время фаджра",
      enteredDhuhr: "Наступило время зухра",
      enteredAsr: "Наступило время аср",
      enteredMaghrib: "Наступило время магриба",
      enteredIsha: "Наступило время иша",
      enteredDefault: "Наступило время намаза",
      enteredGeneric: (label: string) => `Наступило время: ${label}`,
    },
    aiChat: {
      kbShelfSourceLabel: "Источник",
      kbShelfTopicLabel: "Тема",
      kbShelfExcerptLabel: "Фрагмент",
      sourceFallbackLabel: "Источник",
      apiMissingDetail:
        "Сервис временно недоступен. Проверьте интернет и попробуйте позже.",
    },
    kmdbHub: {
      officialSitesLead:
        "Откройте официальный текст, прочитайте его и спросите AI о непонятном месте с опорой на источник.",
      fatuaDescription: "Фетвы, вопросы-ответы и уточнение личных религиозных вопросов по официальному тексту.",
      fatuaChipFatwa: "Фетва",
      fatuaChipQa: "Вопрос-ответ",
      fatuaChipPersonal: "Личный вопрос",
      muftyatDescription: "Новости ҚМДБ, статьи, книги и религиозно-просветительские материалы.",
      muftyatChipArticle: "Статья",
      muftyatChipBook: "Книга",
      muftyatChipNews: "Новость",
      tabMuftyat: "Muftyat.kz",
      tabFatua: "Fatua.kz",
      tabMosques: "Мечети",
      tileMosques: "Мечети",
      tileMosquesSub: "Найдите ближайшие мечети через каталог 2GIS.",
    },
    namazGuide: {
      shortTitle: "Намаз",
      screenTitle: "Учебник намаза",
    },
    asma: {
      screenTitle: "99 имен Аллаха",
      heroSubtitle: "99 имен",
      chTafsir: "Пояснение",
      chMeaning: "Значение",
      chQuran: "Источник",
      chNote: "Примечание",
    },
    duas: {
      intro:
        "Дуа собраны в 8 разделах: повседневные, омовение, здоровье, путешествие, зикр, хадж, знание/ризык и 10 коротких зикров. Дуа внутри намаза здесь нет — смотрите раздел «Зикры».\n\nНиже можно перейти к разделам. Нажмите название раздела — откроется список. В карточке виден арабский текст; повторное нажатие показывает чтение и смысл.",
      communityDuaHint: "Чтение, «Амин» и публикация",
      menzikirTitle: "Разделы (8)",
      menzikirTotal: (sections: number, duas: number) => `${sections} раздел · всего ${duas} дуа`,
      menzikirJumpHint: "Нажмите строку, чтобы перейти к разделу",
      duaCount: (n: number) => `${n} дуа`,
      categoryExpandHint: "Показать дуа в разделе",
      categoryCollapseHint: "Скрыть список дуа",
      translitCaption: "Чтение (транскрипция)",
      meaningCaption: "Смысл (перевод)",
      expandTapHint: "Нажмите, чтобы открыть чтение и смысл",
      collapseTapHint: "Нажмите ещё раз, чтобы свернуть — останется только текст дуа",
      searchPlaceholder: "Поиск: тема, арабский, транскрипция или смысл…",
      searchHint:
        "При вводе подходящие разделы откроются сами. Чтобы очистить — оставьте поле пустым.",
      noSearchResults: "Дуа с таким словом не найдены — попробуйте другое ключевое слово.",
      expandAllCategories: "Открыть все разделы",
      collapseAllCategories: "Закрыть все разделы",
    },
    tasbih: {
      screenTitle: "Зикры",
      zikirSection: "Зикры",
      listSubtitle:
        "В каждом разделе — арабский текст зикра, название и прогресс на чётках.",
      openCounterA11y: "Открыть счётчик",
      collapseDhikrA11y: "Скрыть зикр",
      backToList: "К списку",
      zikirToggleOpen: "Скрыть зикры",
      zikirToggleClosed: "Показать зикры",
      zikirHeaderClosedHint: "Другой зикр · открыть список",
      zikirHeaderA11y: "Открыть или скрыть список зикров",
      pickDhikr: "Выберите зикр",
      goalLabel: "Цель (повторы)",
      goalInfiniteA11y: "Без лимита",
      tapHint: "Считайте, нажимая на круг ниже.",
      tapA11y: "Нажмите чётки, чтобы считать",
      meaningLabel: "Смысл",
    },
    quran: {
      listTitle: "Суры Корана",
      readerSettingsTitle: "Настройки чтения",
      readerReciterTitle: "Чтец Корана",
      modeSurah: "Сура",
      modeJuz: "Джуз",
      translitCaption: "Чтение (транскрипция)",
      meaningKk: "Значение",
      ayahTranslationSheetTitle: (surah: number, ayah: number) => `Перевод / тафсир · ${surah}:${ayah}`,
      ayahTranslationArabic: "Арабский аят",
      ayahTranslationReading: "Чтение",
      ayahTranslationMeaning: "Значение",
      ayahTranslationTafsir: "Краткий тафсир",
      ayahTranslationMissing: "Перевод этого аята пока отсутствует в базе.",
      ayahTranslationTafsirBody:
        "Этот раздел показывает значение аята для самостоятельного чтения. Для фетвы или углубленного тафсира обращайтесь к трудам ҚМДБ/Муфтията и к наставнику.",
    },
    features: {
      hatimTitle: "Хатым",
      hajjTitle: "Хадж",
      halalTitle: "ХАЛАЛ ДАМУ",
      traditionTitle: "Религия и традиции",
      kurbanAitTitle: "Курбан-байрам",
      halalHeroTagRegistry: "Официальный реестр",
      halalHeroTagVerify: "Проверка продукта",
      halalCheckNoBarcodeTitle: "Штрихкод не найден в базе",
      halalCheckNoBarcodeBody:
        "Официальный API продуктов Halal Damu пока пуст, а в справочнике RAQAT этого штрихкода нет. Найдите производителя во вкладке «Учреждения» или проверьте на halaldamu.kz.",
      halalCheckOpenInstitutionsHint: "Ищите производителя во вкладке «Учреждения»",
      halalVerifyLead:
        "Введите E‑код (напр. E471), название продукта или штрихкод. Можно сканировать камерой. Результат — справочный; не официальная фетва.",
      halalCheckTryEcodeHint: "Введите E‑код с упаковки (напр. E471) или название продукта в поиск выше.",
      halalAdditiveRiskHaram: "Вероятно харам",
      halalAdditiveRiskMushkil: "Сомнительно — проверьте происхождение",
      halalAdditiveRiskReference: "Справка",
      halalVerifyQuickCodesHint: "Частые коды",
      halalVerifyPasteIngredientsHint:
        "Можно вставить полный состав с упаковки (E471, желатин…) и разобрать.",
      halalVerifySummaryHaramAdditiveTitle: "Добавка, вероятно харам",
      halalVerifySummaryHaramAdditiveBody: (count: number) =>
        `${count} добавка(и) отмечены как вероятно харам. Это не фетва — перепроверьте состав и сертификат.`,
      halalVerifySummaryMushkilAdditiveTitle: "Найдена сомнительная добавка",
      halalVerifySummaryMushkilAdditiveBody: (count: number) =>
        `${count} добавка(и) сомнительны. Проверьте происхождение (животное/растительное) и халяль-сертификат.`,
      halalCheckPasteIngredientsCta: "Вставить состав и разобрать",
      halalCheckPasteEmpty: "В буфере нет текста состава. Скопируйте состав с упаковки и нажмите снова.",
      halalProductNoIngredients: "В этой записи нет текста состава. Введите E‑код или состав с упаковки в поиск.",
    },
    seerah: {
      title: "Сира",
    },
    hadith: {
      menuTitle: "Хадисы",
      hub: {
        screenTitle: "Хадисы",
        leadUnified:
          "Хадис — слова, действия и одобрения Пророка Мухаммада ﷺ. Они учат применять Коран в жизни, исправлять нрав и держаться верного пути в семье, обществе и поклонении.",
        offlineSectionTitle: "Чтение офлайн",
        sahihTab: "Сахих корпус",
        kmdmbTab: "Выдержки ҚМДБ",
        sourcesTitle: "Надежные источники",
      },
    },
    ecosystem: {
      cardTitle: "Экосистема",
    },
    tajweedGuide: {
      screenTitle: "Арабский алфавит",
      shortTitle: "Алфавит",
      alphabetHeading: "Арабский алфавит",
      alphabetExampleLabel: "Пример",
      alphabetLegendHeavy: "Твёрдый",
      alphabetLegendLight: "Мягкий",
      alphabetSpeechError: "Звук не воспроизвёлся. Проверьте, что звук на телефоне включён.",
      listenLetterA11y: (nameKk: string, ar: string) => `${nameKk}, ${ar} — слушать`,
      sectionBookSub: (_pages: number) => "Алфавит и правила · переход к главе",
      tocGroupPreface: "Предисловие и введение",
      tocJumpHint: "Нажмите строку, чтобы перейти к разделу",
    },
    knowledgePortal: {
      screenTitle: "Статьи",
    },
    settings: {
      title: "Настройки",
      subtitle: "Внешний вид, язык, кибла, вход и поддержка.",
      languageSection: "Язык",
      languageSectionSub: "Меню и навигация работают на 7 языках: казахский, русский, английский, киргизский, узбекский, турецкий и арабский.",
      languageKk: "Казахский",
      languageRu: "Русский",
      languageEn: "Английский",
      languageKy: "Киргизский",
      languageUz: "Узбекский",
      languageTr: "Турецкий",
      languageAr: "Арабский",
      sectionAppearance: "Внешний вид",
      themeBackgroundTitle: "Фон",
      themeBackgroundCompactHint: "Светлые и темные темы",
      colorPaletteTitle: "Акцентный цвет",
      colorPaletteHint: "Цвет кнопок и значков.",
      accountSection: "Аккаунт",
      accountSectionSub: "Вход синхронизирует хатм, закладки Корана и прогресс.",
      sectionLinks: "Разделы",
      sectionSupport: "Поддержка",
      headerSettingsA11y: "Настройки",
      prayerSettingsTitle: "Настройки намаза",
      quranSettingsTitle: "Настройки Корана",
      hadithSettingsTitle: "Настройки хадисов",
      openPrayerTimes: "Время намаза",
      openQuranList: "Суры Корана",
      supportProjectTitle: "Поддержать проект",
      supportProjectOpen: "Открыть ссылку поддержки",
      supportAccountCopy: "Копировать",
      supportAccountCopied: "Скопировано",
    },
  },
  en: {
    common: {
      loading: "Loading…",
      error: "Error",
      retry: "Retry",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      next: "Next",
      skip: "Later",
      done: "Done",
      back: "Back",
      filterAll: "All",
      offlineBadge: "Offline data",
      autoTranslateNotice: "Automatic translation — may be inaccurate. Original is in Kazakh.",
    },
    onboarding: {
      title: "Welcome to RAHAT OMIR",
      step1:
        "The app includes prayer times, the Quran, khatm, duas, qibla, hadiths and religious guides. Location access may be needed for the qibla and prayer times to work correctly. You can change city, notifications and other options later in Settings.",
      start: "Got it",
      languageTitle: "App language",
      languageHint: "Choose the app language. You can change it later in Settings.",
    },
    tabs: {
      homeTabA11y: "Home screen",
      home: "Home",
      times: "Times",
      qibla: "Qibla",
      asma: "99 Names of Allah",
      asmaSub: "99 Names",
      tasbih: "Dhikr",
      more: "More",
    },
    navigation: {
      duasTitle: "Duas",
      surahTitle: "Surah",
      telegramTitle: "Telegram",
      tabHome: "Home",
      tabArticles: "Articles",
      tabPrayerTimes: "Prayer",
      tabSaved: "Saved",
      tabProfile: "Profile",
      openDashboard: "Home",
      pressBackAgainToExit: "Press Back again to exit",
      contentHubTitle: "Menu",
      contentHubSub:
        "The home screen keeps the daily core: prayer, Quran and halal. Extra knowledge and tools live here.",
      contentHubSectionWorship: "Worship",
      contentHubSectionKnowledge: "Knowledge and sources",
      contentHubSectionCommunity: "Additional tools",
    },
    dashboard: {
      greeting: "Assalamu alaikum",
      heroTagline: "Prayer times, Quran, duas and learning in one app",
      today: "today",
      nextPrayer: "Next prayer",
      scheduleTable: "Today's schedule",
      qiblaStrip: "Qibla direction",
      morePrayerLink: "More",
      morePrayerLinkTarget: "prayer times",
      servicesHeading: "Services",
      articlesSeeAll: "See all",
      articleBadge: "Article",
      heroQuranTitle: "Quran",
      heroHadithTitle: "Authentic Hadiths",
      heroDuaTitle: "Community Dua",
      heroDuaSub: "Share · amin",
      heroAiStripTitle: "Source hub",
      promoHalalHeadline: "HALAL DAMU",
      promoHolidayKurbanTitle: "Eid al-Adha",
      quickMenu: "More",
      duasShort: "Duas",
      settingsShort: "Settings",
      telegramShort: "Telegram",
      quranShort: "Quran",
      tileSeerah: "Seerah",
      tileHadith: "Hadiths",
      arabicLettersTile: "Alphabet",
      traditionTileShort: "Faith and tradition",
      traditionDinHubLabel: "Faith and tradition",
      radialLauncherMenuA11y: "Main services",
      radialLauncherFabLabel: "Menu",
    },
    prayer: {
      title: "Prayer Times",
      city: "City",
      country: "Country",
      refresh: "Refresh",
      fajr: "Fajr",
      sunrise: "Sunrise",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
      fajrShort: "Fajr",
      sunriseShort: "Sun",
      dhuhrShort: "Dhuhr",
      asrShort: "Asr",
      maghribShort: "Maghrib",
      ishaShort: "Isha",
      notifications: "Notifications",
      azanScreenKicker: "Prayer time has begun",
      azanScreenDefaultLabel: "Prayer",
      azanScreenBody:
        "The adhan will be recited in full. If needed, stop it with the button below.",
      azanTextPanelTitle: "Adhan Text",
      azanScreenStop: "Stop Adhan",
      azanScreenStopped: "Adhan stopped",
      azanTextBlocks: [
        {
          id: "takbir-open",
          arabic: "اللَّهُ أَكْبَرُ",
          translit: "Allahu akbar",
          meaning: "Allah is the Greatest.",
          repeat: "4 times",
        },
        {
          id: "shahada-tawhid",
          arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ",
          translit: "Ashhadu alla ilaha illa Allah",
          meaning: "I bear witness that there is no deity worthy of worship except Allah.",
          repeat: "2 times",
        },
        {
          id: "shahada-risala",
          arabic: "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
          translit: "Ashhadu anna Muhammadan rasul Allah",
          meaning: "I bear witness that Muhammad is the Messenger of Allah.",
          repeat: "2 times",
        },
        {
          id: "hayya-salah",
          arabic: "حَيَّ عَلَى الصَّلَاةِ",
          translit: "Hayya 'ala-s-salah",
          meaning: "Come to prayer.",
          repeat: "2 times",
        },
        {
          id: "hayya-falah",
          arabic: "حَيَّ عَلَى الْفَلَاحِ",
          translit: "Hayya 'ala-l-falah",
          meaning: "Come to success and salvation.",
          repeat: "2 times",
        },
        {
          id: "takbir-close",
          arabic: "اللَّهُ أَكْبَرُ",
          translit: "Allahu akbar",
          meaning: "Allah is the Greatest.",
          repeat: "2 times",
        },
        {
          id: "tahlil",
          arabic: "لَا إِلٰهَ إِلَّا اللَّهُ",
          translit: "La ilaha illa Allah",
          meaning: "There is no deity worthy of worship except Allah.",
        },
      ],
      fajrAzanTextBlock: {
        id: "fajr-extra",
        arabic: "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ",
        translit: "As-salatu khayrum minan-nawm",
        meaning: "Prayer is better than sleep.",
        repeat: "2 times",
      },
      azanDuaTextBlock: {
        id: "azan-dua",
        arabic:
          "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَالدَّرَجَةَ الرَّفِيعَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
        translit:
          "Allahumma rabba hadhihi-d-da'watit-tammati was-salatil-qa'imah, ati Muhammadan al-wasilata wal-fadilah wad-darajatar-rafi'ah. Wab'athhu maqamam mahmudan alladhi wa'adtah. Innaka la tukhliful-mi'ad.",
        meaning:
          "O Allah, Lord of this complete adhan and the prayer being established! Grant Muhammad the wasilah, virtue and the high rank. Raise him to the praised station You promised. You never break Your promise.",
      },
      enteredFajr: "Fajr time has entered",
      enteredDhuhr: "Dhuhr time has entered",
      enteredAsr: "Asr time has entered",
      enteredMaghrib: "Maghrib time has entered",
      enteredIsha: "Isha time has entered",
      enteredDefault: "Prayer time has entered",
      enteredGeneric: (label: string) => `${label} time has entered`,
    },
    aiChat: {
      kbShelfSourceLabel: "Source",
      kbShelfTopicLabel: "Topic",
      kbShelfExcerptLabel: "Excerpt",
      sourceFallbackLabel: "Source",
      apiMissingDetail:
        "The service is temporarily unavailable. Check your internet connection and try again later.",
    },
    kmdbHub: {
      officialSitesLead:
        "Open and read the official text, then ask AI about unclear parts with the source attached.",
      fatuaDescription: "Fatwas, Q&A and clarification of personal religious matters through official texts.",
      fatuaChipFatwa: "Fatwa",
      fatuaChipQa: "Q&A",
      fatuaChipPersonal: "Personal issue",
      muftyatDescription: "QMDB news, articles, books and religious education materials.",
      muftyatChipArticle: "Article",
      muftyatChipBook: "Book",
      muftyatChipNews: "News",
      tabMuftyat: "Muftyat.kz",
      tabFatua: "Fatua.kz",
      tabMosques: "Mosques",
      tileMosques: "Mosques",
      tileMosquesSub: "Find nearby mosques via the 2GIS catalog.",
    },
    namazGuide: {
      shortTitle: "Prayer",
      screenTitle: "Prayer Guide",
    },
    asma: {
      screenTitle: "99 Names of Allah",
      heroSubtitle: "99 Names",
      chTafsir: "Explanation",
      chMeaning: "Meaning",
      chQuran: "Source",
      chNote: "Note",
    },
    quran: {
      listTitle: "Quran Surahs",
      readerSettingsTitle: "Reading Settings",
      readerReciterTitle: "Quran Reciter",
      modeSurah: "Surah",
      modeJuz: "Juz",
      translitCaption: "Reading (transliteration)",
      meaningKk: "Meaning",
      ayahTranslationSheetTitle: (surah: number, ayah: number) => `Translation / tafsir · ${surah}:${ayah}`,
      ayahTranslationArabic: "Arabic ayah",
      ayahTranslationReading: "Reading",
      ayahTranslationMeaning: "Meaning",
      ayahTranslationTafsir: "Short tafsir",
      ayahTranslationMissing: "A translation of this ayah is not yet in the database.",
      ayahTranslationTafsirBody:
        "This section shows the ayah meaning for personal reading. For a fatwa or in-depth tafsir, rely on the works of QMDB/Muftiyat and a qualified teacher.",
    },
    features: {
      hatimTitle: "Khatm",
      hajjTitle: "Hajj",
      halalTitle: "HALAL DAMU",
      traditionTitle: "Faith and tradition",
      kurbanAitTitle: "Eid al-Adha",
      halalHeroTagRegistry: "Official registry",
      halalHeroTagVerify: "Product check",
      halalCheckNoBarcodeTitle: "Barcode not in the database",
      halalCheckNoBarcodeBody:
        "The official Halal Damu products API is still empty, and this barcode is not in the RAQAT reference list. Search for the producer under Institutions or check on halaldamu.kz.",
      halalCheckOpenInstitutionsHint: "Search for the producer under the Institutions tab",
      halalVerifyLead:
        "Enter an E‑code (e.g. E471), product name, or barcode. You can also scan with the camera. Result is reference only — not an official fatwa.",
      halalCheckTryEcodeHint: "Enter the E‑code from the pack (e.g. E471) or the product name in the search above.",
      halalAdditiveRiskHaram: "Likely haram",
      halalAdditiveRiskMushkil: "Doubtful — check the source",
      halalAdditiveRiskReference: "Reference",
      halalVerifyQuickCodesHint: "Common codes",
      halalVerifyPasteIngredientsHint:
        "You can paste the full ingredients list from the pack (E471, gelatin…) for analysis.",
      halalVerifySummaryHaramAdditiveTitle: "Additive likely haram",
      halalVerifySummaryHaramAdditiveBody: (count: number) =>
        `${count} additive(s) flagged as likely haram. Not a fatwa — recheck the ingredients and certificate.`,
      halalVerifySummaryMushkilAdditiveTitle: "Doubtful additive found",
      halalVerifySummaryMushkilAdditiveBody: (count: number) =>
        `${count} additive(s) are doubtful. Check origin (animal/plant) and the halal certificate.`,
      halalCheckPasteIngredientsCta: "Paste ingredients to analyze",
      halalCheckPasteEmpty: "Clipboard has no ingredients text. Copy the pack list and try again.",
      halalProductNoIngredients: "No ingredients text in this record. Enter an E‑code or paste the pack list.",
    },
    seerah: {
      title: "Seerah",
    },
    hadith: {
      menuTitle: "Hadiths",
      hub: {
        screenTitle: "Hadiths",
        leadUnified:
          "A hadith is the saying, action or approval of the Prophet Muhammad ﷺ. They teach how to apply the Quran in life, refine character and follow the right path in family, society and worship.",
        offlineSectionTitle: "Offline reading",
        sahihTab: "Sahih corpus",
        kmdmbTab: "ҚМДБ excerpts",
        sourcesTitle: "Trusted sources",
      },
    },
    ecosystem: {
      cardTitle: "Ecosystem",
    },
    tajweedGuide: {
      screenTitle: "Alphabet",
    },
    knowledgePortal: {
      screenTitle: "Articles",
    },
    settings: {
      title: "Settings",
      subtitle: "Appearance, language, qibla, sign-in and support.",
      languageSection: "Language",
      languageSectionSub: "Menus and navigation work in seven languages: Kazakh, Russian, English, Kyrgyz, Uzbek, Turkish and Arabic.",
      languageKk: "Kazakh",
      languageRu: "Russian",
      languageEn: "English",
      languageKy: "Kyrgyz",
      languageUz: "Uzbek",
      languageTr: "Turkish",
      languageAr: "Arabic",
      sectionAppearance: "Appearance",
      themeBackgroundTitle: "Background",
      themeBackgroundCompactHint: "Light and dark themes",
      colorPaletteTitle: "Accent color",
      colorPaletteHint: "Color for buttons and badges.",
      accountSection: "Account",
      accountSectionSub: "Sign in to sync hatim, Quran bookmarks and progress.",
      sectionLinks: "Sections",
      sectionSupport: "Support",
      headerSettingsA11y: "Settings",
      prayerSettingsTitle: "Prayer Settings",
      quranSettingsTitle: "Quran Settings",
      hadithSettingsTitle: "Hadith Settings",
      openPrayerTimes: "Prayer Times",
      openQuranList: "Quran Surahs",
      supportProjectTitle: "Support the project",
      supportProjectOpen: "Open support link",
      supportAccountCopy: "Copy",
      supportAccountCopied: "Copied",
    },
  },
  ky: {
    common: {
      loading: "Жүктөлүүдө…", error: "Ката", retry: "Кайталоо", save: "Сактоо", cancel: "Жокко чыгаруу",
      close: "Жабуу", next: "Кийинки", skip: "Кийинчерээк", done: "Даяр", back: "Артка", filterAll: "Баары",
      offlineBadge: "Оффлайн дайындар",
      autoTranslateNotice: "Автоматтык котормо — так эмес болушу мүмкүн. Түп нускасы казакча.",
    },
    onboarding: {
      title: "RAHAT OMIR'ге кош келиңиз",
      step1:
        "Колдонмодо намаз убактысы, Куран, хатым, дуба, кыбыла, хадистер жана диний окуу китептери бар. Кыбыла менен намаз убактысы туура иштеши үчүн жайгашуу уруксаты керек болушу мүмкүн. Шаар, билдирүүлөр жана башка жөндөөлөрдү кийин «Жөндөөлөр» бөлүмүнөн өзгөртө аласыз.",
      start: "Түшүндүм", languageTitle: "Колдонмо тили",
      languageHint: "Колдонмо тилин тандаңыз. Кийин жөндөөлөрдөн өзгөртсө болот.",
    },
    tabs: {
      homeTabA11y: "Башкы экран", home: "Башкы", times: "Убакыт", qibla: "Кыбыла",
      asma: "Алланын 99 ысымы", asmaSub: "99 ысым", tasbih: "Зикирлер", more: "Дагы",
    },
    navigation: {
      duasTitle: "Дубалар", surahTitle: "Сүрө", telegramTitle: "Telegram", tabHome: "Башкы",
      tabArticles: "Макалалар", tabPrayerTimes: "Намаз", tabSaved: "Сакталгандар", tabProfile: "Жеке бет",
      openDashboard: "Башкы", pressBackAgainToExit: "Чыгуу үчүн «Артка» баскычын дагы бир жолу басыңыз",
      contentHubTitle: "Меню",
      contentHubSub: "Башкы бет күнүмдүк өзөктү кармайт: намаз, Куран жана халал. Кошумча билим жана куралдар ушул жерде.",
      contentHubSectionWorship: "Ибадат", contentHubSectionKnowledge: "Билим жана булактар",
      contentHubSectionCommunity: "Кошумча куралдар",
    },
    dashboard: {
      greeting: "Ассалаому алейкум", heroTagline: "Намаз убактысы, Куран, дуба жана билим — бир колдонмодо",
      today: "бүгүн", nextPrayer: "Кийинки намаз", scheduleTable: "Бүгүнкү жадыбал",
      qiblaStrip: "Кыбыла багыты", morePrayerLink: "Толугураак", morePrayerLinkTarget: "намаз убактысы",
      servicesHeading: "Бөлүмдөр", articlesSeeAll: "Баарын көрүү", articleBadge: "Макала",
      heroQuranTitle: "Куран", heroHadithTitle: "Сахих хадистер", heroDuaTitle: "Коом дубасы",
      heroDuaSub: "Бөлүшүү · аамийн", heroAiStripTitle: "Дереккөз хаб", promoHalalHeadline: "ХАЛАЛ ДАМУ",
      promoHolidayKurbanTitle: "Курман айт", quickMenu: "Дагы", duasShort: "Дубалар", settingsShort: "Жөндөөлөр",
      telegramShort: "Telegram", quranShort: "Куран", tileSeerah: "Сира", tileHadith: "Хадистер", arabicLettersTile: "Алфавит", traditionTileShort: "Дин жана салт",
      traditionDinHubLabel: "Дин жана салт", radialLauncherMenuA11y: "Негизги бөлүмдөр", radialLauncherFabLabel: "Меню",
    },
    prayer: {
      title: "Намаз убактысы", city: "Шаар", country: "Өлкө", refresh: "Жаңылоо", fajr: "Багымдат",
      sunrise: "Күн чыгуу", dhuhr: "Бешим", asr: "Аср", maghrib: "Шам", isha: "Куптан",
      fajrShort: "Багымдат", sunriseShort: "Күн", dhuhrShort: "Бешим", asrShort: "Аср",
      maghribShort: "Шам", ishaShort: "Куптан",       notifications: "Билдирүүлөр",
      ...PRAYER_AZAN_PATCH_KY,
      azanTextBlocks: PRAYER_AZAN_PATCH_KY.azanTextBlocks.map((b) => ({ ...b })),
    },
    aiChat: {
      kbShelfSourceLabel: "Булак",
      kbShelfTopicLabel: "Тема",
      kbShelfExcerptLabel: "Үзүндү",
      sourceFallbackLabel: "Булак",
      apiMissingDetail:
        "Кызмат убактылуу жеткиликсиз. Интернетти текшерип, кийинчерээк кайра аракет кылыңыз.",
    },
    kmdbHub: {
      officialSitesLead:
        "Расмий текстти ачып окуңуз, түшүнүксүз жерин AI'дан булакка таянып сураңыз.",
      fatuaDescription: "Фатва, суроо-жооп жана жеке диний маселени расмий текст менен тактоо.",
      fatuaChipFatwa: "Фатва",
      fatuaChipQa: "Суроо-жооп",
      fatuaChipPersonal: "Жеке маселе",
      muftyatDescription: "КМДБ жаңылыктары, макалалар, китептер жана диний-агартуу материалдары.",
      muftyatChipArticle: "Макала",
      muftyatChipBook: "Китеп",
      muftyatChipNews: "Жаңылык",
      tabMuftyat: "Muftyat.kz",
      tabFatua: "Fatua.kz",
      tabMosques: "Мечиттер",
      tileMosques: "Мечиттер",
      tileMosquesSub: "Жакынкы мечиттерди 2GIS каталогу аркылуу табыңыз.",
    },
    namazGuide: { shortTitle: "Намаз", screenTitle: "Намаз окуу китеби" },
    asma: {
      screenTitle: "Алланын 99 ысымы", heroSubtitle: "99 ысым", chTafsir: "Түшүндүрмө",
      chMeaning: "Мааниси", chQuran: "Булак", chNote: "Эскертүү",
    },
    quran: {
      listTitle: "Куран сүрөлөрү", readerSettingsTitle: "Окуу жөндөөлөрү", readerReciterTitle: "Куран кариы",
      modeSurah: "Сүрө", modeJuz: "Жуз", translitCaption: "Окулушу (транскрипция)", meaningKk: "Мааниси",
      ayahTranslationSheetTitle: (surah: number, ayah: number) => `Котормо / тафсир · ${surah}:${ayah}`,
      ayahTranslationArabic: "Арабча аят", ayahTranslationReading: "Окулушу", ayahTranslationMeaning: "Мааниси",
      ayahTranslationTafsir: "Кыскача тафсир", ayahTranslationMissing: "Бул аяттын котормосу азырынча базада жок.",
      ayahTranslationTafsirBody:
        "Бул бөлүм аяттын маанисин өз алдынча окуу үчүн көрсөтөт. Фатва же терең тафсир үчүн КМДБ/Муфтият эмгектерине жана устатка кайрылыңыз.",
    },
    features: {
      hatimTitle: "Хатым", hajjTitle: "Ажылык", halalTitle: "ХАЛАЛ ДАМУ", traditionTitle: "Дин жана салт",
      kurbanAitTitle: "Курман айт",
      halalHeroTagRegistry: "Расмий тизмек",
      halalHeroTagVerify: "Өнүм текшерүү",
      halalVerifyLead:
        "E-код (мис. E471), өнүм аты же штрихкод киргизиңиз. Камера менен да сканерлесе болот. Жыйынтык — маалымат; расмий фатва эмес.",
      halalCheckTryEcodeHint: "Таңгактагы E-кодду (мис. E471) же өнүм атын жогорудагы издөөгө киргизиңиз.",
      halalAdditiveRiskHaram: "Харам болушу мүмкүн",
      halalAdditiveRiskMushkil: "Шүбөлүү — текшериңиз",
      halalAdditiveRiskReference: "Маалымат",
      halalVerifyQuickCodesHint: "Көп кездешкен коддор",
      halalVerifyPasteIngredientsHint: "Таңгактагы курамды толук коюп талдоого болот (E471, желатин…).",
      halalVerifySummaryHaramAdditiveTitle: "Харам болушу мүмкүн кошумча",
      halalVerifySummaryHaramAdditiveBody: (count: number) =>
        `${count} кошумча харам болушу мүмкүн деп белгиленген. Расмий фатва эмес — курам менен сертификатты кайра текшериңиз.`,
      halalVerifySummaryMushkilAdditiveTitle: "Шүбөлүү кошумча табылды",
      halalVerifySummaryMushkilAdditiveBody: (count: number) =>
        `${count} кошумча шүбөлүү. Тегин (жаныбар/өсүмдүк) жана халал сертификатты текшериңиз.`,
      halalCheckPasteIngredientsCta: "Курамды коюп талдоо",
      halalCheckPasteEmpty: "Буферде курам тексти жок. Таңгактагы курамды көчүрүп, кайра басыңыз.",
      halalProductNoIngredients: "Бул жазууда курам тексти жок. E-кодду же таңгактагы курамды издөөгө коюңуз.",
      halalCheckNoBarcodeTitle: "Штрихкод базадан табылган жок",
      halalCheckNoBarcodeBody:
        "Halal Damu өнүм API бош, RAQAT аныктамасында да бул штрихкод жок. Өндүрүүчүнү «Мекемелер» өтмөгүнөн издеңиз же halaldamu.kz текшериңиз.",
      halalCheckOpenInstitutionsHint: "Өндүрүүчүнү «Мекемелер» өтмөгүнөн издеңиз",
    },
    seerah: { title: "Сира" },
    hadith: {
      menuTitle: "Хадистер",
      hub: {
        screenTitle: "Хадистер",
        leadUnified:
          "Хадис — Пайгамбар Мухаммаддын ﷺ сөзү, иши жана жактыруусу. Алар Куранды турмушта колдонууну, мүнөздү оңдоону жана үй-бүлөдө, коомдо, ибадатта туура жолду үйрөтөт.",
        offlineSectionTitle: "Оффлайн окуу", sahihTab: "Сахих корпус", kmdmbTab: "КМДБ үзүндүлөрү",
        sourcesTitle: "Ишеничтүү булактар",
      },
    },
    ecosystem: { cardTitle: "Экосистема" },
    tajweedGuide: { screenTitle: "Алфавит" },
    knowledgePortal: { screenTitle: "Макалалар" },
    settings: {
      title: "Жөндөөлөр", subtitle: "Көрүнүш, тил, кыбыла, кирүү жана колдоо.",
      languageSection: "Тил", languageSectionSub: "Меню жана навигация тандалган тилде иштейт.",
      languageKk: "Qazaqsha", languageRu: "Русский", languageEn: "English",
      sectionAppearance: "Көрүнүш", themeBackgroundTitle: "Фон", themeBackgroundCompactHint: "Жарык жана караңгы темалар",
      colorPaletteTitle: "Акцент түсү", colorPaletteHint: "Баскычтар менен белгилердин түсү.",
      accountSection: "Аккаунт", accountSectionSub: "Кирүү тарых менен прогрессти синхрондойт.",
      sectionLinks: "Бөлүмдөр", sectionSupport: "Колдоо", headerSettingsA11y: "Жөндөөлөр",
      prayerSettingsTitle: "Намаз жөндөөлөрү", quranSettingsTitle: "Куран жөндөөлөрү", hadithSettingsTitle: "Хадис жөндөөлөрү",
      openPrayerTimes: "Намаз убактысы", openQuranList: "Куран сүрөлөрү", supportProjectTitle: "Долбоорго колдоо",
      supportProjectOpen: "Колдоо шилтемесин ачуу", supportAccountCopy: "Көчүрүү", supportAccountCopied: "Көчүрүлдү",
    },
  },
  uz: {
    common: {
      loading: "Yuklanmoqda…", error: "Xato", retry: "Qayta urinish", save: "Saqlash", cancel: "Bekor qilish",
      close: "Yopish", next: "Keyingi", skip: "Keyinroq", done: "Tayyor", back: "Orqaga", filterAll: "Barchasi",
      offlineBadge: "Oflayn ma'lumot",
      autoTranslateNotice: "Avtomatik tarjima — noaniq bo'lishi mumkin. Asl matn qozoqcha.",
    },
    onboarding: {
      title: "RAHAT OMIR'ga xush kelibsiz",
      step1:
        "Ilovada namoz vaqti, Qur'on, xatm, duolar, qibla, hadislar va diniy darsliklar bor. Qibla va namoz vaqti to'g'ri ishlashi uchun joylashuv ruxsati kerak bo'lishi mumkin. Shahar, bildirishnomalar va boshqa sozlamalarni keyinroq «Sozlamalar» bo'limida o'zgartirishingiz mumkin.",
      start: "Tushundim", languageTitle: "Ilova tili",
      languageHint: "Ilova tilini tanlang. Keyin sozlamalarda o'zgartirish mumkin.",
    },
    tabs: {
      homeTabA11y: "Bosh ekran", home: "Bosh", times: "Vaqt", qibla: "Qibla",
      asma: "Allohning 99 ismi", asmaSub: "99 ism", tasbih: "Zikrlar", more: "Yana",
    },
    navigation: {
      duasTitle: "Duolar", surahTitle: "Sura", telegramTitle: "Telegram", tabHome: "Bosh",
      tabArticles: "Maqolalar", tabPrayerTimes: "Namoz", tabSaved: "Saqlanganlar", tabProfile: "Profil",
      openDashboard: "Bosh", pressBackAgainToExit: "Chiqish uchun «Orqaga» tugmasini yana bosing",
      contentHubTitle: "Menyu",
      contentHubSub: "Bosh ekran kundalik asosni saqlaydi: namoz, Qur'on va halol. Qo'shimcha bilim va vositalar shu yerda.",
      contentHubSectionWorship: "Ibodat", contentHubSectionKnowledge: "Bilim va manbalar",
      contentHubSectionCommunity: "Qo'shimcha vositalar",
    },
    dashboard: {
      greeting: "Assalomu alaykum", heroTagline: "Namoz vaqti, Qur'on, duolar va bilim — bitta ilovada",
      today: "bugun", nextPrayer: "Keyingi namoz", scheduleTable: "Bugungi jadval",
      qiblaStrip: "Qibla yo'nalishi", morePrayerLink: "Batafsil", morePrayerLinkTarget: "namoz vaqti",
      servicesHeading: "Bo'limlar", articlesSeeAll: "Barchasini ko'rish", articleBadge: "Maqola",
      heroQuranTitle: "Qur'on", heroHadithTitle: "Sahih hadislar", heroDuaTitle: "Jamoa duosi",
      heroDuaSub: "Ulashish · omin", heroAiStripTitle: "Source hub", promoHalalHeadline: "HALAL DAMU",
      promoHolidayKurbanTitle: "Qurbon hayit", quickMenu: "Yana", duasShort: "Duolar", settingsShort: "Sozlamalar",
      telegramShort: "Telegram", quranShort: "Qur'on", tileSeerah: "Siyra", tileHadith: "Hadislar", arabicLettersTile: "Alifbo", traditionTileShort: "Din va urf-odat",
      traditionDinHubLabel: "Din va urf-odat", radialLauncherMenuA11y: "Asosiy bo'limlar", radialLauncherFabLabel: "Menyu",
    },
    prayer: {
      title: "Namoz vaqti", city: "Shahar", country: "Davlat", refresh: "Yangilash", fajr: "Bomdod",
      sunrise: "Quyosh chiqishi", dhuhr: "Peshin", asr: "Asr", maghrib: "Shom", isha: "Xufton", notifications: "Bildirishnomalar",
      ...PRAYER_AZAN_PATCH_UZ,
      azanTextBlocks: PRAYER_AZAN_PATCH_UZ.azanTextBlocks.map((b) => ({ ...b })),
    },
    namazGuide: { shortTitle: "Namoz", screenTitle: "Namoz darsligi" },
    asma: {
      screenTitle: "Allohning 99 ismi", heroSubtitle: "99 ism", chTafsir: "Izoh",
      chMeaning: "Ma'nosi", chQuran: "Manba", chNote: "Eslatma",
    },
    quran: {
      listTitle: "Qur'on suralari", readerSettingsTitle: "O'qish sozlamalari", readerReciterTitle: "Qur'on qorisi",
      modeSurah: "Sura", modeJuz: "Juz", translitCaption: "O'qilishi (transkripsiya)", meaningKk: "Ma'nosi",
      ayahTranslationSheetTitle: (surah: number, ayah: number) => `Tarjima / tafsir · ${surah}:${ayah}`,
      ayahTranslationArabic: "Arabcha oyat", ayahTranslationReading: "O'qilishi", ayahTranslationMeaning: "Ma'nosi",
      ayahTranslationTafsir: "Qisqa tafsir", ayahTranslationMissing: "Bu oyatning tarjimasi hozircha bazada yo'q.",
      ayahTranslationTafsirBody:
        "Bu bo'lim oyat ma'nosini mustaqil o'qish uchun ko'rsatadi. Fatvo yoki chuqur tafsir uchun QMDB/Muftiyat asarlari va ustozga murojaat qiling.",
    },
    features: {
      hatimTitle: "Xatm", hajjTitle: "Haj", halalTitle: "HALAL DAMU", traditionTitle: "Din va urf-odat",
      kurbanAitTitle: "Qurbon hayit",
      halalHeroTagRegistry: "Rasmiy reestr",
      halalHeroTagVerify: "Mahsulot tekshiruvi",
      halalVerifyLead:
        "E-kod (masalan E471), mahsulot nomi yoki shtrixkod kiriting. Kamerada ham skanerlash mumkin. Natija — ma'lumotnoma; rasmiy fatvo emas.",
      halalCheckTryEcodeHint: "Qadoqdagi E-kodni (masalan E471) yoki mahsulot nomini yuqoridagi qidiruvga kiriting.",
      halalAdditiveRiskHaram: "Harom bo'lishi mumkin",
      halalAdditiveRiskMushkil: "Shubhali — manbani tekshiring",
      halalAdditiveRiskReference: "Ma'lumotnoma",
      halalVerifyQuickCodesHint: "Tez-tez uchraydigan kodlar",
      halalVerifyPasteIngredientsHint: "Qadoqdagi tarkibni to'liq qo'yib tahlil qilish mumkin (E471, jelatin…).",
      halalVerifySummaryHaramAdditiveTitle: "Harom bo'lishi mumkin qo'shimcha",
      halalVerifySummaryHaramAdditiveBody: (count: number) =>
        `${count} qo'shimcha harom bo'lishi mumkin deb belgilangan. Rasmiy fatvo emas — tarkib va sertifikatni qayta tekshiring.`,
      halalVerifySummaryMushkilAdditiveTitle: "Shubhali qo'shimcha topildi",
      halalVerifySummaryMushkilAdditiveBody: (count: number) =>
        `${count} qo'shimcha shubhali. Kelib chiqishi (hayvon/o'simlik) va halal sertifikatni tekshiring.`,
      halalCheckPasteIngredientsCta: "Tarkibni qo'yib tahlil qilish",
      halalCheckPasteEmpty: "Buferda tarkib matni yo'q. Qadoqdagi tarkibni nusxalang va qayta bosing.",
      halalProductNoIngredients: "Bu yozuvda tarkib matni yo'q. E-kod yoki qadoqdagi tarkibni qidiruvga qo'ying.",
      halalCheckNoBarcodeTitle: "Shtrixkod bazada yo'q",
      halalCheckNoBarcodeBody:
        "Halal Damu mahsulot API bo'sh, RAQAT ma'lumotnomasida ham bu shtrixkod yo'q. Ishlab chiqaruvchini «Muassasalar» bo'limidan qidiring yoki halaldamu.kz tekshiring.",
      halalCheckOpenInstitutionsHint: "Ishlab chiqaruvchini «Muassasalar» bo'limidan qidiring",
    },
    seerah: { title: "Siyra" },
    hadith: {
      menuTitle: "Hadislar",
      hub: {
        screenTitle: "Hadislar",
        leadUnified:
          "Hadis — Payg'ambar Muhammad ﷺ ning so'zi, ishi va ma'qullashidir. Ular Qur'onni hayotda qo'llashni, axloqni to'g'rilashni va oilada, jamiyatda, ibodatda to'g'ri yo'l tutishni o'rgatadi.",
        offlineSectionTitle: "Oflayn o'qish", sahihTab: "Sahih korpus", kmdmbTab: "QMDB parchalari",
        sourcesTitle: "Ishonchli manbalar",
      },
    },
    ecosystem: { cardTitle: "Ekotizim" },
    tajweedGuide: { screenTitle: "Alifbo" },
    knowledgePortal: { screenTitle: "Maqolalar" },
    settings: {
      title: "Sozlamalar", subtitle: "Ko'rinish, til, qibla, kirish va qo'llab-quvvatlash.",
      languageSection: "Til", languageSectionSub: "Menyu va navigatsiya tanlangan tilda ishlaydi.",
      languageKk: "Qazaqsha", languageRu: "Русский", languageEn: "English",
      sectionAppearance: "Ko'rinish", themeBackgroundTitle: "Fon", themeBackgroundCompactHint: "Yorug' va qorong'i mavzular",
      colorPaletteTitle: "Urg'u rangi", colorPaletteHint: "Tugma va belgilar rangi.",
      accountSection: "Hisob", accountSectionSub: "Kirish tarix va progressni sinxronlaydi.",
      sectionLinks: "Bo'limlar", sectionSupport: "Qo'llab-quvvatlash", headerSettingsA11y: "Sozlamalar",
      prayerSettingsTitle: "Namoz sozlamalari", quranSettingsTitle: "Qur'on sozlamalari", hadithSettingsTitle: "Hadis sozlamalari",
      openPrayerTimes: "Namoz vaqti", openQuranList: "Qur'on suralari", supportProjectTitle: "Loyihani qo'llab-quvvatlash",
      supportProjectOpen: "Qo'llab-quvvatlash havolasini ochish", supportAccountCopy: "Nusxalash", supportAccountCopied: "Nusxalandi",
    },
  },
  tr: {
    common: {
      loading: "Yükleniyor…", error: "Hata", retry: "Tekrar dene", save: "Kaydet", cancel: "İptal",
      close: "Kapat", next: "İleri", skip: "Sonra", done: "Tamam", back: "Geri", filterAll: "Tümü",
      offlineBadge: "Çevrimdışı veri",
      autoTranslateNotice: "Otomatik çeviri — hatalı olabilir. Orijinal Kazakça.",
    },
    onboarding: {
      title: "RAHAT OMIR'e hoş geldiniz",
      step1:
        "Uygulamada namaz vakitleri, Kur'an, hatim, dualar, kıble, hadisler ve dini rehberler bulunur. Kıble ve namaz vakitlerinin doğru çalışması için konum izni gerekebilir. Şehir, bildirimler ve diğer ayarları daha sonra «Ayarlar» bölümünden değiştirebilirsiniz.",
      start: "Anladım", languageTitle: "Uygulama dili",
      languageHint: "Uygulama dilini seçin. Daha sonra ayarlardan değiştirebilirsiniz.",
    },
    tabs: {
      homeTabA11y: "Ana ekran", home: "Ana sayfa", times: "Vakitler", qibla: "Kıble",
      asma: "Allah'ın 99 ismi", asmaSub: "99 isim", tasbih: "Zikirler", more: "Daha",
    },
    navigation: {
      duasTitle: "Dualar", surahTitle: "Sure", telegramTitle: "Telegram", tabHome: "Ana sayfa",
      tabArticles: "Makaleler", tabPrayerTimes: "Namaz", tabSaved: "Kaydedilenler", tabProfile: "Profil",
      openDashboard: "Ana sayfa", pressBackAgainToExit: "Çıkmak için «Geri»ye tekrar basın",
      contentHubTitle: "Menü",
      contentHubSub: "Ana ekran günlük çekirdeği tutar: namaz, Kur'an ve helal. Ek bilgi ve araçlar burada.",
      contentHubSectionWorship: "İbadet", contentHubSectionKnowledge: "Bilgi ve kaynaklar",
      contentHubSectionCommunity: "Ek araçlar",
    },
    dashboard: {
      greeting: "Esselamü aleyküm", heroTagline: "Namaz vakitleri, Kur'an, dualar ve bilgi — tek uygulamada",
      today: "bugün", nextPrayer: "Sonraki namaz", scheduleTable: "Bugünün vakitleri",
      qiblaStrip: "Kıble yönü", morePrayerLink: "Daha fazla", morePrayerLinkTarget: "namaz vakitleri",
      servicesHeading: "Bölümler", articlesSeeAll: "Tümünü gör", articleBadge: "Makale",
      heroQuranTitle: "Kur'an", heroHadithTitle: "Sahih hadisler", heroDuaTitle: "Topluluk duası",
      heroDuaSub: "Paylaş · amin", heroAiStripTitle: "Kaynak merkezi", promoHalalHeadline: "HALAL DAMU",
      promoHolidayKurbanTitle: "Kurban Bayramı", quickMenu: "Daha", duasShort: "Dualar", settingsShort: "Ayarlar",
      telegramShort: "Telegram", quranShort: "Kur'an", tileSeerah: "Siyer", tileHadith: "Hadisler", arabicLettersTile: "Alfabe", traditionTileShort: "Din ve gelenek",
      traditionDinHubLabel: "Din ve gelenek", radialLauncherMenuA11y: "Ana bölümler", radialLauncherFabLabel: "Menü",
    },
    prayer: {
      title: "Namaz vakitleri", city: "Şehir", country: "Ülke", refresh: "Yenile", fajr: "İmsak",
      sunrise: "Güneş", dhuhr: "Öğle", asr: "İkindi", maghrib: "Akşam", isha: "Yatsı", notifications: "Bildirimler",
      ...PRAYER_AZAN_PATCH_TR,
      azanTextBlocks: PRAYER_AZAN_PATCH_TR.azanTextBlocks.map((b) => ({ ...b })),
    },
    namazGuide: { shortTitle: "Namaz", screenTitle: "Namaz rehberi" },
    asma: {
      screenTitle: "Allah'ın 99 ismi", heroSubtitle: "99 isim", chTafsir: "Açıklama",
      chMeaning: "Anlamı", chQuran: "Kaynak", chNote: "Not",
    },
    quran: {
      listTitle: "Kur'an sureleri", readerSettingsTitle: "Okuma ayarları", readerReciterTitle: "Kur'an kârisi",
      modeSurah: "Sure", modeJuz: "Cüz", translitCaption: "Okunuşu (transkripsiyon)", meaningKk: "Anlamı",
      ayahTranslationSheetTitle: (surah: number, ayah: number) => `Çeviri / tefsir · ${surah}:${ayah}`,
      ayahTranslationArabic: "Arapça ayet", ayahTranslationReading: "Okunuşu", ayahTranslationMeaning: "Anlamı",
      ayahTranslationTafsir: "Kısa tefsir", ayahTranslationMissing: "Bu ayetin çevirisi henüz veritabanında yok.",
      ayahTranslationTafsirBody:
        "Bu bölüm ayetin anlamını bireysel okuma için gösterir. Fetva veya derin tefsir için KMDB/Müftülük eserlerine ve bir hocaya başvurun.",
    },
    features: {
      hatimTitle: "Hatim", hajjTitle: "Hac", halalTitle: "HALAL DAMU", traditionTitle: "Din ve gelenek",
      kurbanAitTitle: "Kurban Bayramı",
      halalHeroTagRegistry: "Resmi kayıt",
      halalHeroTagVerify: "Ürün kontrolü",
      halalVerifyLead:
        "E-kod (örn. E471), ürün adı veya barkod girin. Kamerayla da tarayabilirsiniz. Sonuç bilgilendirme amaçlıdır; resmi fetva değildir.",
      halalCheckTryEcodeHint: "Ambalajdaki E-kodu (örn. E471) veya ürün adını yukarıdaki aramaya girin.",
      halalAdditiveRiskHaram: "Muhtemelen haram",
      halalAdditiveRiskMushkil: "Şüpheli — kaynağı kontrol edin",
      halalAdditiveRiskReference: "Bilgi",
      halalVerifyQuickCodesHint: "Sık kodlar",
      halalVerifyPasteIngredientsHint: "Ambalajdaki içeriği yapıştırıp analiz edebilirsiniz (E471, jelatin…).",
      halalVerifySummaryHaramAdditiveTitle: "Muhtemelen haram katkı",
      halalVerifySummaryHaramAdditiveBody: (count: number) =>
        `${count} katkı muhtemelen haram olarak işaretlendi. Resmi fetva değil — içeriği ve sertifikayı yeniden kontrol edin.`,
      halalVerifySummaryMushkilAdditiveTitle: "Şüpheli katkı bulundu",
      halalVerifySummaryMushkilAdditiveBody: (count: number) =>
        `${count} katkı şüpheli. Kaynağı (hayvansal/bitkisel) ve halal sertifikayı kontrol edin.`,
      halalCheckPasteIngredientsCta: "İçeriği yapıştırıp analiz et",
      halalCheckPasteEmpty: "Panoda içerik metni yok. Ambalajdaki içeriği kopyalayıp tekrar deneyin.",
      halalProductNoIngredients: "Bu kayıtta içerik metni yok. E-kod veya ambalaj içeriğini aramaya girin.",
      halalCheckNoBarcodeTitle: "Barkod veritabanında yok",
      halalCheckNoBarcodeBody:
        "Halal Damu ürün API'si boş ve RAQAT referansında da bu barkod yok. Üreticiyi «Kurumlar» sekmesinde arayın veya halaldamu.kz kontrol edin.",
      halalCheckOpenInstitutionsHint: "Üreticiyi «Kurumlar» sekmesinde arayın",
    },
    seerah: { title: "Siyer" },
    hadith: {
      menuTitle: "Hadisler",
      hub: {
        screenTitle: "Hadisler",
        leadUnified:
          "Hadis — Peygamber Muhammed'in ﷺ sözü, fiili ve onayıdır. Kur'an'ı hayatta uygulamayı, ahlakı düzeltmeyi ve ailede, toplumda, ibadette doğru yolu öğretir.",
        offlineSectionTitle: "Çevrimdışı okuma", sahihTab: "Sahih külliyat", kmdmbTab: "KMDB alıntıları",
        sourcesTitle: "Güvenilir kaynaklar",
      },
    },
    ecosystem: { cardTitle: "Ekosistem" },
    tajweedGuide: { screenTitle: "Alfabe" },
    knowledgePortal: { screenTitle: "Makaleler" },
    settings: {
      title: "Ayarlar", subtitle: "Görünüm, dil, kıble, giriş ve destek.",
      languageSection: "Dil", languageSectionSub: "Menü ve gezinme seçilen dilde çalışır.",
      languageKk: "Qazaqsha", languageRu: "Русский", languageEn: "English",
      sectionAppearance: "Görünüm", themeBackgroundTitle: "Arka plan", themeBackgroundCompactHint: "Açık ve koyu temalar",
      colorPaletteTitle: "Vurgu rengi", colorPaletteHint: "Düğme ve simge rengi.",
      accountSection: "Hesap", accountSectionSub: "Giriş geçmişi ve ilerlemeyi senkronlar.",
      sectionLinks: "Bölümler", sectionSupport: "Destek", headerSettingsA11y: "Ayarlar",
      prayerSettingsTitle: "Namaz ayarları", quranSettingsTitle: "Kur'an ayarları", hadithSettingsTitle: "Hadis ayarları",
      openPrayerTimes: "Namaz vakitleri", openQuranList: "Kur'an sureleri", supportProjectTitle: "Projeye destek",
      supportProjectOpen: "Destek bağlantısını aç", supportAccountCopy: "Kopyala", supportAccountCopied: "Kopyalandı",
    },
  },
  ar: {
    common: {
      loading: "جارٍ التحميل…", error: "خطأ", retry: "إعادة المحاولة", save: "حفظ", cancel: "إلغاء",
      close: "إغلاق", next: "التالي", skip: "لاحقًا", done: "تم", back: "رجوع", filterAll: "الكل",
      offlineBadge: "بيانات دون اتصال",
      autoTranslateNotice: "ترجمة آلية — قد تكون غير دقيقة. النص الأصلي بالكازاخية.",
    },
    onboarding: {
      title: "مرحبًا بك في RAHAT OMIR",
      step1:
        "يحتوي التطبيق على مواقيت الصلاة والقرآن والختمة والأدعية والقبلة والأحاديث والكتب الدينية. قد يلزم إذن الموقع لكي تعمل القبلة ومواقيت الصلاة بشكل صحيح. يمكنك تغيير المدينة والإشعارات والإعدادات الأخرى لاحقًا في «الإعدادات».",
      start: "فهمت", languageTitle: "لغة التطبيق",
      languageHint: "اختر لغة التطبيق. يمكنك تغييرها لاحقًا في الإعدادات.",
    },
    tabs: {
      homeTabA11y: "الشاشة الرئيسية", home: "الرئيسية", times: "المواقيت", qibla: "القبلة",
      asma: "أسماء الله الحسنى", asmaSub: "99 اسمًا", tasbih: "الأذكار", more: "المزيد",
    },
    navigation: {
      duasTitle: "الأدعية", surahTitle: "سورة", telegramTitle: "Telegram", tabHome: "الرئيسية",
      tabArticles: "المقالات", tabPrayerTimes: "الصلاة", tabSaved: "المحفوظات", tabProfile: "الملف",
      openDashboard: "الرئيسية", pressBackAgainToExit: "اضغط «رجوع» مرة أخرى للخروج",
      contentHubTitle: "القائمة",
      contentHubSub: "تبقى الشاشة الرئيسية للجوهر اليومي: الصلاة والقرآن والحلال. المعرفة والأدوات الإضافية هنا.",
      contentHubSectionWorship: "العبادة", contentHubSectionKnowledge: "المعرفة والمصادر",
      contentHubSectionCommunity: "أدوات إضافية",
    },
    dashboard: {
      greeting: "السلام عليكم", heroTagline: "مواقيت الصلاة والقرآن والأدعية والعلم في تطبيق واحد",
      today: "اليوم", nextPrayer: "الصلاة التالية", scheduleTable: "جدول اليوم",
      qiblaStrip: "اتجاه القبلة", morePrayerLink: "المزيد", morePrayerLinkTarget: "مواقيت الصلاة",
      servicesHeading: "الأقسام", articlesSeeAll: "عرض الكل", articleBadge: "مقال",
      heroQuranTitle: "القرآن", heroHadithTitle: "أحاديث صحيحة", heroDuaTitle: "دعاء الجماعة",
      heroDuaSub: "مشاركة · آمين", heroAiStripTitle: "Source hub", promoHalalHeadline: "HALAL DAMU",
      promoHolidayKurbanTitle: "عيد الأضحى", quickMenu: "المزيد", duasShort: "الأدعية", settingsShort: "الإعدادات",
      telegramShort: "Telegram", quranShort: "القرآن", tileSeerah: "السيرة", tileHadith: "الأحاديث", arabicLettersTile: "الألفباء", traditionTileShort: "الدين والتقاليد",
      traditionDinHubLabel: "الدين والتقاليد", radialLauncherMenuA11y: "الأقسام الرئيسية", radialLauncherFabLabel: "القائمة",
    },
    prayer: {
      title: "مواقيت الصلاة", city: "المدينة", country: "الدولة", refresh: "تحديث", fajr: "الفجر",
      sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء", notifications: "الإشعارات",
      ...PRAYER_AZAN_PATCH_AR,
      azanTextBlocks: PRAYER_AZAN_PATCH_AR.azanTextBlocks.map((b) => ({ ...b })),
    },
    namazGuide: { shortTitle: "الصلاة", screenTitle: "دليل الصلاة" },
    asma: {
      screenTitle: "أسماء الله الحسنى", heroSubtitle: "99 اسمًا", chTafsir: "بيان",
      chMeaning: "المعنى", chQuran: "المصدر", chNote: "ملاحظة",
    },
    quran: {
      listTitle: "سور القرآن", readerSettingsTitle: "إعدادات القراءة", readerReciterTitle: "قارئ القرآن",
      modeSurah: "سورة", modeJuz: "جزء", translitCaption: "النطق (نقحرة)", meaningKk: "المعنى",
      ayahTranslationSheetTitle: (surah: number, ayah: number) => `ترجمة / تفسير · ${surah}:${ayah}`,
      ayahTranslationArabic: "الآية بالعربية", ayahTranslationReading: "النطق", ayahTranslationMeaning: "المعنى",
      ayahTranslationTafsir: "تفسير موجز", ayahTranslationMissing: "ترجمة هذه الآية غير متوفرة في قاعدة البيانات بعد.",
      ayahTranslationTafsirBody:
        "يعرض هذا القسم معنى الآية للقراءة الفردية. للفتوى أو التفسير المعمق، ارجع إلى أعمال الإدارة الدينية/المفتي وإلى معلم مختص.",
    },
    features: {
      hatimTitle: "ختمة", hajjTitle: "الحج", halalTitle: "HALAL DAMU", traditionTitle: "الدين والتقاليد",
      kurbanAitTitle: "عيد الأضحى",
      halalHeroTagRegistry: "السجل الرسمي",
      halalHeroTagVerify: "فحص المنتج",
      halalVerifyLead:
        "أدخل رمز E (مثل E471) أو اسم المنتج أو الباركود. يمكن أيضاً المسح بالكاميرا. النتيجة مرجعية وليست فتوى رسمية.",
      halalCheckTryEcodeHint: "أدخل رمز E من العبوة (مثل E471) أو اسم المنتج في البحث أعلاه.",
      halalAdditiveRiskHaram: "محتمل الحرام",
      halalAdditiveRiskMushkil: "مشكوك — تحقق من المصدر",
      halalAdditiveRiskReference: "مرجع",
      halalVerifyQuickCodesHint: "رموز شائعة",
      halalVerifyPasteIngredientsHint: "يمكن لصق قائمة المكونات كاملة من العبوة (E471، جيلاتين…) للتحليل.",
      halalVerifySummaryHaramAdditiveTitle: "مكون محتمل الحرام",
      halalVerifySummaryHaramAdditiveBody: (count: number) =>
        `${count} مكوّن(ات) موسومة كمحتملة الحرام. ليست فتوى رسمية — أعد التحقق من المكونات والشهادة.`,
      halalVerifySummaryMushkilAdditiveTitle: "وُجد مكوّن مشكوك فيه",
      halalVerifySummaryMushkilAdditiveBody: (count: number) =>
        `${count} مكوّن(ات) مشكوك فيها. تحقق من المصدر (حيواني/نباتي) وشهادة الحلال.`,
      halalCheckPasteIngredientsCta: "الصق المكونات للتحليل",
      halalCheckPasteEmpty: "لا يوجد نص مكونات في الحافظة. انسخ قائمة العبوة وحاول مجدداً.",
      halalProductNoIngredients: "لا يوجد نص مكونات في هذا السجل. أدخل رمز E أو الصق قائمة العبوة.",
      halalCheckNoBarcodeTitle: "الباركود غير موجود في القاعدة",
      halalCheckNoBarcodeBody:
        "واجهة منتجات Halal Damu فارغة، وهذا الباركود غير موجود في مرجع RAQAT. ابحث عن المنتج في تبويب «المؤسسات» أو تحقق على halaldamu.kz.",
      halalCheckOpenInstitutionsHint: "ابحث عن المنتج في تبويب «المؤسسات»",
    },
    seerah: { title: "السيرة" },
    hadith: {
      menuTitle: "الأحاديث",
      hub: {
        screenTitle: "الأحاديث",
        leadUnified:
          "الحديث هو قول النبي محمد ﷺ وفعله وإقراره. يعلّم تطبيق القرآن في الحياة، وتقويم الأخلاق، واتباع الطريق الصحيح في الأسرة والمجتمع والعبادة.",
        offlineSectionTitle: "قراءة دون اتصال", sahihTab: "المجموعة الصحيحة", kmdmbTab: "مقتطفات QMDB",
        sourcesTitle: "مصادر موثوقة",
      },
    },
    ecosystem: { cardTitle: "المنظومة" },
    tajweedGuide: { screenTitle: "الألفباء" },
    knowledgePortal: { screenTitle: "المقالات" },
    settings: {
      title: "الإعدادات", subtitle: "المظهر واللغة والقبلة وتسجيل الدخول والدعم.",
      languageSection: "اللغة", languageSectionSub: "تعمل القائمة والتنقل باللغة المختارة.",
      languageKk: "Qazaqsha", languageRu: "Русский", languageEn: "English",
      sectionAppearance: "المظهر", themeBackgroundTitle: "الخلفية", themeBackgroundCompactHint: "سمات فاتحة وداكنة",
      colorPaletteTitle: "لون التمييز", colorPaletteHint: "لون الأزرار والرموز.",
      accountSection: "الحساب", accountSectionSub: "تسجيل الدخول يزامن السجل والتقدم.",
      sectionLinks: "الأقسام", sectionSupport: "الدعم", headerSettingsA11y: "الإعدادات",
      prayerSettingsTitle: "إعدادات الصلاة", quranSettingsTitle: "إعدادات القرآن", hadithSettingsTitle: "إعدادات الأحاديث",
      openPrayerTimes: "مواقيت الصلاة", openQuranList: "سور القرآن", supportProjectTitle: "ادعم المشروع",
      supportProjectOpen: "فتح رابط الدعم", supportAccountCopy: "نسخ", supportAccountCopied: "تم النسخ",
    },
  },
};

let currentLocale: AppLocale = "kk";
/** applyLocale сайын өседі — бір тілде reapply кезінде де UI remount болады. */
let localeRevision = 0;
const localeListeners = new Set<() => void>();

function deepCloneLocaleTree(obj: unknown): unknown {
  if (typeof obj === "function") return obj;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepCloneLocaleTree);
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    o[k] = deepCloneLocaleTree(v);
  }
  return o;
}

const KK_BASELINE = deepCloneLocaleTree(kk) as typeof kk;
const offlineLocaleTreeCache: Partial<Record<Exclude<AppLocale, "kk">, unknown>> = {};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v != null && !Array.isArray(v);
}

function applyIntoTarget(target: Record<string, unknown>, src: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(src)) {
    const curr = target[k];
    if (isPlainObject(v) && isPlainObject(curr)) {
      applyIntoTarget(curr, v);
      continue;
    }
    target[k] = v;
  }
}

function buildOfflineLocaleTree(obj: unknown, target: OfflineAutoTranslateTarget): unknown {
  if (typeof obj === "string") return getOfflineAutoTranslation(obj, target) ?? obj;
  if (typeof obj === "function") return obj;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => buildOfflineLocaleTree(item, target));
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    out[key] = buildOfflineLocaleTree(value, target);
  }
  return out;
}

/** Сөздік кейін жүктелсе — бос/қазақша ағашты қайта құру үшін. */
export function invalidateOfflineLocaleTreeCache(target?: Exclude<AppLocale, "kk">): void {
  if (target) {
    delete offlineLocaleTreeCache[target];
    return;
  }
  for (const key of Object.keys(offlineLocaleTreeCache) as Array<Exclude<AppLocale, "kk">>) {
    delete offlineLocaleTreeCache[key];
  }
}

function getOfflineLocalePatch(target: Exclude<AppLocale, "kk">): Record<string, unknown> {
  if (!hasOfflineAutoTranslationLocale(target as OfflineAutoTranslateTarget)) {
    /** Сөздік жоқ/басқа тілге қысқарған — толық ағашты араламау. */
    return {};
  }
  const cached = offlineLocaleTreeCache[target];
  if (cached) {
    return cached as Record<string, unknown>;
  }
  const tree = buildOfflineLocaleTree(KK_BASELINE, target as OfflineAutoTranslateTarget);
  offlineLocaleTreeCache[target] = tree;
  return tree as Record<string, unknown>;
}

function normalizeLocale(raw: string | null | undefined): AppLocale {
  return raw && APP_LOCALE_IDS.has(raw as AppLocale) ? (raw as AppLocale) : "kk";
}

function syncAppLayoutDirection(locale: AppLocale): void {
  const wantRtl = locale === "ar";
  try {
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL !== wantRtl) {
      I18nManager.forceRTL(wantRtl);
    }
  } catch {
    /* ignore — web / test */
  }
}

function mergeManualLocalePatches(target: Exclude<AppLocale, "kk">): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const core = (CORE_SCREEN_LOCALE_PATCHES as Record<string, unknown>)[target];
  const extended = (EXTENDED_LOCALE_PATCHES as Record<string, unknown>)[target];
  const feature = (FEATURE_LOCALE_PATCHES as Record<string, unknown>)[target];
  const critical = (CRITICAL_UI_LOCALE_PATCHES as Record<string, unknown>)[target];
  if (core) applyIntoTarget(merged, core as Record<string, unknown>);
  if (extended) applyIntoTarget(merged, extended as Record<string, unknown>);
  if (feature) applyIntoTarget(merged, feature as Record<string, unknown>);
  if (critical) applyIntoTarget(merged, critical as Record<string, unknown>);
  applyIntoTarget(merged, LOCALE_PATCHES[target] as Record<string, unknown>);
  if (target === "ru") {
    applyIntoTarget(merged, RU_RESIDUAL_CHROME_PATCH as unknown as Record<string, unknown>);
  }
  return merged;
}

/** Қалған қазақ әріпті chrome жолдарын сөздіктен немесе «…»-пен жабу (allowlist өткізбейді). */
function scrubRemainingKazakhLetters(target: OfflineAutoTranslateTarget): void {
  const KK_SPECIFIC = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;
  const leaks =
    target === "ky"
      ? findKyLocaleLeaks(kk)
      : collectKkStringLeaves(kk).filter(
          ({ path, value }) =>
            KK_SPECIFIC.test(value) &&
            !path.includes("languageKk") &&
            path !== "settings.languageKk" &&
            value.trim() !== "ҚМДБ"
        );
  if (!leaks.length) return;
  const root = kk as unknown as Record<string, unknown>;
  for (const { path, value } of leaks) {
    const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
    let cur: unknown = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur == null || typeof cur !== "object") {
        cur = null;
        break;
      }
      cur = (cur as Record<string, unknown>)[parts[i]!];
    }
    if (cur == null || typeof cur !== "object") continue;
    const leaf = parts[parts.length - 1]!;
    const parent = cur as Record<string, unknown>;
    if (typeof parent[leaf] !== "string") continue;
    parent[leaf] = getOfflineAutoTranslation(value, target) ?? "…";
  }
}

const KK_LETTER_RE = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

function localizeReturnedString(text: string, target: OfflineAutoTranslateTarget): string {
  if (!KK_LETTER_RE.test(text)) return text;
  if (text.trim() === "ҚМДБ") return text;
  /** Тек ҚМДБ қысқартуындағы Қ — рұқсат. */
  if (text.includes("ҚМДБ") && !KK_LETTER_RE.test(text.replace(/ҚМДБ/g, ""))) return text;
  return getOfflineAutoTranslation(text, target) ?? "…";
}

/**
 * `kk` ішіндегі форматтер функциялар applyLocale кезінде ауыспайды —
 * қайтарылған жолдарды офлайн сөздіктен / «…» арқылы жабамыз.
 */
function wrapKkFunctionsForLocale(target: OfflineAutoTranslateTarget): void {
  const walk = (node: unknown): void => {
    if (node == null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value === "function") {
        const original = value as (...args: unknown[]) => unknown;
        obj[key] = (...args: unknown[]) => {
          const result = original(...args);
          if (typeof result === "string") return localizeReturnedString(result, target);
          return result;
        };
        continue;
      }
      walk(value);
    }
  };
  walk(kk);
}

export function applyLocale(next: AppLocale): void {
  applyIntoTarget(
    kk as unknown as Record<string, unknown>,
    KK_BASELINE as unknown as Record<string, unknown>
  );
  if (next !== "kk") {
    for (const key of Object.keys(offlineLocaleTreeCache) as Array<Exclude<AppLocale, "kk">>) {
      if (key !== next) delete offlineLocaleTreeCache[key];
    }
    applyIntoTarget(
      kk as unknown as Record<string, unknown>,
      getOfflineLocalePatch(next)
    );
    applyIntoTarget(
      kk as unknown as Record<string, unknown>,
      mergeManualLocalePatches(next)
    );
    scrubRemainingKazakhLetters(next as OfflineAutoTranslateTarget);
    wrapKkFunctionsForLocale(next as OfflineAutoTranslateTarget);
  } else {
    invalidateOfflineLocaleTreeCache();
  }
  currentLocale = next;
  localeRevision += 1;
  syncAppLayoutDirection(next);
}

/** Pack жүктелгеннен кейін ағымдағы тілді қайта қолдану + UI жаңарту. */
export function reapplyCurrentLocale(): void {
  applyLocale(currentLocale);
  emitLocaleChange();
}

function emitLocaleChange(): void {
  for (const listener of localeListeners) listener();
}

export function getCurrentLocale(): AppLocale {
  return currentLocale;
}

export function getLocaleRevision(): number {
  return localeRevision;
}

export async function setCurrentLocale(nextRaw: AppLocale): Promise<void> {
  const next = normalizeLocale(nextRaw);
  if (next !== "kk") {
    const target = next as OfflineAutoTranslateTarget;
    /** APK slim pack — applyLocale алдында міндетті; CDN core күтпейміз. */
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const offline = require("../services/offlineAutoTranslations") as typeof import("../services/offlineAutoTranslations");
      offline.seedApkOfflineTranslationsSync();
      await offline.ensureOfflineAutoTranslationsLoaded(target);
      if (offline.hasOfflineAutoTranslationLocale(target)) {
        offline.pruneOfflineAutoTranslationsToLocale(target);
        invalidateOfflineLocaleTreeCache(next);
      } else if (__DEV__) {
        console.warn(`[i18n] APK pack missing locale=${target}; manual patches only`);
      }
    } catch (e) {
      if (__DEV__) console.warn("[i18n] prepareOfflinePack failed", e);
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const offline = require("../services/offlineAutoTranslations") as typeof import("../services/offlineAutoTranslations");
        offline.seedApkOfflineTranslationsSync();
        if (offline.hasOfflineAutoTranslationLocale(target)) {
          offline.pruneOfflineAutoTranslationsToLocale(target);
          invalidateOfflineLocaleTreeCache(next);
        }
      } catch {
        /* ignore */
      }
    }
  } else {
    invalidateOfflineLocaleTreeCache();
  }
  applyLocale(next);
  emitLocaleChange();
  try {
    await AsyncStorage.setItem(LOCALE_KEY, next);
  } catch {
    /* ignore */
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const translit = require("../quran/quranTranslitScript") as typeof import("../quran/quranTranslitScript");
    await translit.ensureDefaultQuranTranslitScript(next);
  } catch {
    /* ignore */
  }
  if (Platform.OS !== "web" && process.env.NODE_ENV !== "test") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const prayerCache = require("../storage/prayerCache") as typeof import("../storage/prayerCache");
      void prayerCache.syncNativePrayerWidgetFromStorage();
    } catch {
      /* ignore */
    }
  }
  if (next !== "kk" && process.env.NODE_ENV !== "test") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const m = require("../services/localeContentDownload") as typeof import("../services/localeContentDownload");
      /** Тіл таңдағанда core сөздікті күту — әйтпесе ~70% қазақша қалады. */
      await m.ensureI18nOfflineDictionary(next);
      m.scheduleLocaleContentDownload(next);
    } catch {
      /* ignore */
    }
  }
}

function subscribeLocale(listener: () => void): () => void {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
}

export function useAppLocale(): AppLocale {
  return useSyncExternalStore(subscribeLocale, getCurrentLocale, getCurrentLocale);
}

/** Тіл мәтіндері жаңарған сайын (соның ішінде reapply) өседі — memo/navigator key үшін. */
export function useLocaleRevision(): number {
  return useSyncExternalStore(subscribeLocale, getLocaleRevision, getLocaleRevision);
}

/**
 * Бут кезінде сақталған тілді оқып, негізгі `kk` мәтін объектісіне тиісті patch енгіземіз.
 * APK slim + мүмкін болса core сөздік (ensureI18nOfflineDictionary).
 */
export async function hydrateLocale(): Promise<AppLocale> {
  let next: AppLocale = "kk";
  try {
    next = normalizeLocale(await AsyncStorage.getItem(LOCALE_KEY));
  } catch {
    /* ignore */
  }
  if (next !== "kk") {
    const target = next as OfflineAutoTranslateTarget;
    seedApkOfflineTranslationsSync();
    await ensureOfflineAutoTranslationsLoaded(target).catch(() => {});
    if (hasOfflineAutoTranslationLocale(target)) {
      pruneOfflineAutoTranslationsToLocale(target);
      invalidateOfflineLocaleTreeCache(next);
    }
  } else {
    invalidateOfflineLocaleTreeCache();
  }
  applyLocale(next);
  emitLocaleChange();

  // Quran / CDN сөздік — UI-дан кейін (boot spinner ұзармасын)
  const localeForBg = next;
  void (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const reading = require("../quran/quranReadingLocale") as typeof import("../quran/quranReadingLocale");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const translit = require("../quran/quranTranslitScript") as typeof import("../quran/quranTranslitScript");
      await Promise.all([
        reading.ensureDefaultQuranReadingLocale(localeForBg),
        translit.ensureDefaultQuranTranslitScript(localeForBg),
      ]);
    } catch {
      /* ignore */
    }
    if (localeForBg !== "kk" && process.env.NODE_ENV !== "test") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const m = require("../services/localeContentDownload") as typeof import("../services/localeContentDownload");
        await m.ensureI18nOfflineDictionary(localeForBg);
        m.scheduleLocaleContentDownload(localeForBg);
      } catch {
        /* ignore */
      }
    }
  })();

  return next;
}
