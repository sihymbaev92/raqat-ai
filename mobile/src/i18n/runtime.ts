import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { kk } from "./kk";
import {
  ensureOfflineAutoTranslationsLoaded,
  getOfflineAutoTranslation,
  releaseOfflineAutoTranslationsMemory,
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
  | "ar"
  | "zh"
  | "fa"
  | "id"
  | "ms"
  | "hi"
  | "ku";

export const APP_LOCALE_OPTIONS: readonly { id: AppLocale; label: string; nativeLabel: string }[] = [
  { id: "kk", label: "Қазақша", nativeLabel: "Қазақша" },
  { id: "ru", label: "Русский", nativeLabel: "Русский" },
  { id: "en", label: "English", nativeLabel: "English" },
  { id: "ky", label: "Кыргызча", nativeLabel: "Кыргызча" },
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
      siriShortcutHelpTitle: "Siri и команды",
      siriShortcutHubTile: "Siri и команды",
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
      heroAiStripTitle: "КМДБ",
      promoHalalHeadline: "ХАЛАЛ ДАМУ",
      promoHolidayKurbanTitle: "Курбан айт",
      quickMenu: "Еще",
      duasShort: "Дуа",
      settingsShort: "Настройки",
      telegramShort: "Telegram",
      quranShort: "Коран",
      tileSeerah: "Сира",
      tileCommunityDua: "Дуа сообщества",
      tileHadith: "Хадисы",
      arabicLettersTile: "Таджвид",
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
          "اللَّهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
        translit:
          "Аллахумма рабба хазихи-д-да'вати-т-таммати ва-с-саляти-ль-ка'имати, ати Мухаммадан аль-василата ва-ль-фадилата, ваб'асху макамам-махмуданил-лязи ва'адтах, иннака ля тухлифу-ль-ми'ад.",
        meaning:
          "О Аллах, Господь этого совершенного призыва и совершаемой молитвы! Даруй Мухаммаду василя и достоинство, и возведи его на достохвальное место, которое Ты обещал. Воистину, Ты не нарушаешь обещания.",
      },
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
      kurbanAitTitle: "Курбан айт",
      raqatAiTitle: "КМДБ · Вопрос-ответ",
      halalHeroTagRegistry: "Официальный реестр",
      halalHeroTagVerify: "Проверка продукта",
    },
    communityDua: {
      screenTitle: "Дуа сообщества",
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
      screenTitle: "Таджвид",
    },
    knowledgePortal: {
      screenTitle: "Статьи",
    },
    settings: {
      title: "Настройки",
      subtitle: "Внешний вид, язык, кибла, вход и поддержка.",
      languageSection: "Язык",
      languageSectionSub: "Меню и навигация работают на казахском, русском и английском.",
      languageKk: "Қазақша",
      languageRu: "Русский",
      languageEn: "English",
      sectionAppearance: "Внешний вид",
      themeBackgroundTitle: "Фон",
      themeBackgroundCompactHint: "Светлые и темные темы",
      colorPaletteTitle: "Акцентный цвет",
      colorPaletteHint: "Цвет кнопок и значков.",
      accountSection: "Аккаунт",
      accountSectionSub: "Вход синхронизирует историю и прогресс.",
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
      siriShortcutHelpTitle: "Siri and Shortcuts",
      siriShortcutHubTile: "Siri and Shortcuts",
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
      heroAiStripTitle: "QMDB",
      promoHalalHeadline: "HALAL DAMU",
      promoHolidayKurbanTitle: "Eid al-Adha",
      quickMenu: "More",
      duasShort: "Duas",
      settingsShort: "Settings",
      telegramShort: "Telegram",
      quranShort: "Quran",
      tileSeerah: "Seerah",
      tileCommunityDua: "Community Dua",
      tileHadith: "Hadiths",
      arabicLettersTile: "Tajweed",
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
          "اللَّهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
        translit:
          "Allahumma rabba hadhihi-d-da'watit-tammati was-salatil-qa'imah, ati Muhammadan al-wasilata wal-fadilah, wab'athhu maqamam mahmudan alladhi wa'adtah, innaka la tukhliful-mi'ad.",
        meaning:
          "O Allah, Lord of this perfect call and established prayer, grant Muhammad al-Wasilah and virtue, and raise him to the praised station You promised him. Indeed, You do not break Your promise.",
      },
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
      raqatAiTitle: "QMDB · Q&A",
      halalHeroTagRegistry: "Official registry",
      halalHeroTagVerify: "Product check",
    },
    communityDua: {
      screenTitle: "Community Dua",
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
      screenTitle: "Tajweed",
    },
    knowledgePortal: {
      screenTitle: "Articles",
    },
    settings: {
      title: "Settings",
      subtitle: "Appearance, language, qibla, sign-in and support.",
      languageSection: "Language",
      languageSectionSub: "Menus and navigation work in Kazakh, Russian and English.",
      languageKk: "Қазақша",
      languageRu: "Русский",
      languageEn: "English",
      sectionAppearance: "Appearance",
      themeBackgroundTitle: "Background",
      themeBackgroundCompactHint: "Light and dark themes",
      colorPaletteTitle: "Accent color",
      colorPaletteHint: "Color for buttons and badges.",
      accountSection: "Account",
      accountSectionSub: "Sign in to sync history and progress.",
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
      contentHubSectionCommunity: "Кошумча куралдар", siriShortcutHelpTitle: "Siri жана буйруктар",
      siriShortcutHubTile: "Siri жана буйруктар",
    },
    dashboard: {
      greeting: "Ассалаому алейкум", heroTagline: "Намаз убактысы, Куран, дуба жана билим — бир колдонмодо",
      today: "бүгүн", nextPrayer: "Кийинки намаз", scheduleTable: "Бүгүнкү жадыбал",
      qiblaStrip: "Кыбыла багыты", morePrayerLink: "Толугураак", morePrayerLinkTarget: "намаз убактысы",
      servicesHeading: "Бөлүмдөр", articlesSeeAll: "Баарын көрүү", articleBadge: "Макала",
      heroQuranTitle: "Куран", heroHadithTitle: "Сахих хадистер", heroDuaTitle: "Коом дубасы",
      heroDuaSub: "Бөлүшүү · аамийн", heroAiStripTitle: "КМДБ", promoHalalHeadline: "ХАЛАЛ ДАМУ",
      promoHolidayKurbanTitle: "Курман айт", quickMenu: "Дагы", duasShort: "Дубалар", settingsShort: "Жөндөөлөр",
      telegramShort: "Telegram", quranShort: "Куран", tileSeerah: "Сира", tileCommunityDua: "Коом дубасы",
      tileHadith: "Хадистер", arabicLettersTile: "Тажвид", traditionTileShort: "Дин жана салт",
      traditionDinHubLabel: "Дин жана салт", radialLauncherMenuA11y: "Негизги бөлүмдөр", radialLauncherFabLabel: "Меню",
    },
    prayer: {
      title: "Намаз убактысы", city: "Шаар", country: "Өлкө", refresh: "Жаңылоо", fajr: "Багымдат",
      sunrise: "Күн чыгуу", dhuhr: "Бешим", asr: "Аср", maghrib: "Шам", isha: "Куптан",
      fajrShort: "Багымдат", sunriseShort: "Күн", dhuhrShort: "Бешим", asrShort: "Аср",
      maghribShort: "Шам", ishaShort: "Куптан", notifications: "Билдирүүлөр",
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
      raqatAiTitle: "КМДБ · Суроо-жооп", halalHeroTagRegistry: "Расмий тизмек",
      halalHeroTagVerify: "Өнүм текшерүү",
    },
    communityDua: { screenTitle: "Коом дубасы" },
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
    tajweedGuide: { screenTitle: "Тажвид" },
    knowledgePortal: { screenTitle: "Макалалар" },
    settings: {
      title: "Жөндөөлөр", subtitle: "Көрүнүш, тил, кыбыла, кирүү жана колдоо.",
      languageSection: "Тил", languageSectionSub: "Меню жана навигация тандалган тилде иштейт.",
      languageKk: "Қазақша", languageRu: "Русский", languageEn: "English",
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
      start: "Tushundim", languageTitle: "Тіл · Til · Language",
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
      contentHubSectionCommunity: "Qo'shimcha vositalar", siriShortcutHelpTitle: "Siri va buyruqlar",
      siriShortcutHubTile: "Siri va buyruqlar",
    },
    dashboard: {
      greeting: "Assalomu alaykum", heroTagline: "Namoz vaqti, Qur'on, duolar va bilim — bitta ilovada",
      today: "bugun", nextPrayer: "Keyingi namoz", scheduleTable: "Bugungi jadval",
      qiblaStrip: "Qibla yo'nalishi", morePrayerLink: "Batafsil", morePrayerLinkTarget: "namoz vaqti",
      servicesHeading: "Bo'limlar", articlesSeeAll: "Barchasini ko'rish", articleBadge: "Maqola",
      heroQuranTitle: "Qur'on", heroHadithTitle: "Sahih hadislar", heroDuaTitle: "Jamoa duosi",
      heroDuaSub: "Ulashish · omin", heroAiStripTitle: "QMDB", promoHalalHeadline: "HALAL DAMU",
      promoHolidayKurbanTitle: "Qurbon hayit", quickMenu: "Yana", duasShort: "Duolar", settingsShort: "Sozlamalar",
      telegramShort: "Telegram", quranShort: "Qur'on", tileSeerah: "Siyra", tileCommunityDua: "Jamoa duosi",
      tileHadith: "Hadislar", arabicLettersTile: "Tajvid", traditionTileShort: "Din va urf-odat",
      traditionDinHubLabel: "Din va urf-odat", radialLauncherMenuA11y: "Asosiy bo'limlar", radialLauncherFabLabel: "Menyu",
    },
    prayer: {
      title: "Namoz vaqti", city: "Shahar", country: "Davlat", refresh: "Yangilash", fajr: "Bomdod",
      sunrise: "Quyosh chiqishi", dhuhr: "Peshin", asr: "Asr", maghrib: "Shom", isha: "Xufton", notifications: "Bildirishnomalar",
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
      raqatAiTitle: "QMDB · Savol-javob",
    },
    communityDua: { screenTitle: "Jamoa duosi" },
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
    tajweedGuide: { screenTitle: "Tajvid" },
    knowledgePortal: { screenTitle: "Maqolalar" },
    settings: {
      title: "Sozlamalar", subtitle: "Ko'rinish, til, qibla, kirish va qo'llab-quvvatlash.",
      languageSection: "Til", languageSectionSub: "Menyu va navigatsiya tanlangan tilda ishlaydi.",
      languageKk: "Қазақша", languageRu: "Русский", languageEn: "English",
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
      start: "Anladım", languageTitle: "Тіл · Dil · Language",
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
      contentHubSectionCommunity: "Ek araçlar", siriShortcutHelpTitle: "Siri ve Kısayollar",
      siriShortcutHubTile: "Siri ve Kısayollar",
    },
    dashboard: {
      greeting: "Esselamü aleyküm", heroTagline: "Namaz vakitleri, Kur'an, dualar ve bilgi — tek uygulamada",
      today: "bugün", nextPrayer: "Sonraki namaz", scheduleTable: "Bugünün vakitleri",
      qiblaStrip: "Kıble yönü", morePrayerLink: "Daha fazla", morePrayerLinkTarget: "namaz vakitleri",
      servicesHeading: "Bölümler", articlesSeeAll: "Tümünü gör", articleBadge: "Makale",
      heroQuranTitle: "Kur'an", heroHadithTitle: "Sahih hadisler", heroDuaTitle: "Topluluk duası",
      heroDuaSub: "Paylaş · amin", heroAiStripTitle: "KMDB", promoHalalHeadline: "HALAL DAMU",
      promoHolidayKurbanTitle: "Kurban Bayramı", quickMenu: "Daha", duasShort: "Dualar", settingsShort: "Ayarlar",
      telegramShort: "Telegram", quranShort: "Kur'an", tileSeerah: "Siyer", tileCommunityDua: "Topluluk duası",
      tileHadith: "Hadisler", arabicLettersTile: "Tecvid", traditionTileShort: "Din ve gelenek",
      traditionDinHubLabel: "Din ve gelenek", radialLauncherMenuA11y: "Ana bölümler", radialLauncherFabLabel: "Menü",
    },
    prayer: {
      title: "Namaz vakitleri", city: "Şehir", country: "Ülke", refresh: "Yenile", fajr: "İmsak",
      sunrise: "Güneş", dhuhr: "Öğle", asr: "İkindi", maghrib: "Akşam", isha: "Yatsı", notifications: "Bildirimler",
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
      raqatAiTitle: "KMDB · Soru-cevap",
    },
    communityDua: { screenTitle: "Topluluk duası" },
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
    tajweedGuide: { screenTitle: "Tecvid" },
    knowledgePortal: { screenTitle: "Makaleler" },
    settings: {
      title: "Ayarlar", subtitle: "Görünüm, dil, kıble, giriş ve destek.",
      languageSection: "Dil", languageSectionSub: "Menü ve gezinme seçilen dilde çalışır.",
      languageKk: "Қазақша", languageRu: "Русский", languageEn: "English",
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
      start: "فهمت", languageTitle: "Тіл · اللغة · Language",
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
      contentHubSectionCommunity: "أدوات إضافية", siriShortcutHelpTitle: "Siri والاختصارات",
      siriShortcutHubTile: "Siri والاختصارات",
    },
    dashboard: {
      greeting: "السلام عليكم", heroTagline: "مواقيت الصلاة والقرآن والأدعية والعلم في تطبيق واحد",
      today: "اليوم", nextPrayer: "الصلاة التالية", scheduleTable: "جدول اليوم",
      qiblaStrip: "اتجاه القبلة", morePrayerLink: "المزيد", morePrayerLinkTarget: "مواقيت الصلاة",
      servicesHeading: "الأقسام", articlesSeeAll: "عرض الكل", articleBadge: "مقال",
      heroQuranTitle: "القرآن", heroHadithTitle: "أحاديث صحيحة", heroDuaTitle: "دعاء الجماعة",
      heroDuaSub: "مشاركة · آمين", heroAiStripTitle: "QMDB", promoHalalHeadline: "HALAL DAMU",
      promoHolidayKurbanTitle: "عيد الأضحى", quickMenu: "المزيد", duasShort: "الأدعية", settingsShort: "الإعدادات",
      telegramShort: "Telegram", quranShort: "القرآن", tileSeerah: "السيرة", tileCommunityDua: "دعاء الجماعة",
      tileHadith: "الأحاديث", arabicLettersTile: "التجويد", traditionTileShort: "الدين والتقاليد",
      traditionDinHubLabel: "الدين والتقاليد", radialLauncherMenuA11y: "الأقسام الرئيسية", radialLauncherFabLabel: "القائمة",
    },
    prayer: {
      title: "مواقيت الصلاة", city: "المدينة", country: "الدولة", refresh: "تحديث", fajr: "الفجر",
      sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء", notifications: "الإشعارات",
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
      raqatAiTitle: "QMDB · سؤال وجواب",
    },
    communityDua: { screenTitle: "دعاء الجماعة" },
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
    tajweedGuide: { screenTitle: "التجويد" },
    knowledgePortal: { screenTitle: "المقالات" },
    settings: {
      title: "الإعدادات", subtitle: "المظهر واللغة والقبلة وتسجيل الدخول والدعم.",
      languageSection: "اللغة", languageSectionSub: "تعمل القائمة والتنقل باللغة المختارة.",
      languageKk: "Қазақша", languageRu: "Русский", languageEn: "English",
      sectionAppearance: "المظهر", themeBackgroundTitle: "الخلفية", themeBackgroundCompactHint: "سمات فاتحة وداكنة",
      colorPaletteTitle: "لون التمييز", colorPaletteHint: "لون الأزرار والرموز.",
      accountSection: "الحساب", accountSectionSub: "تسجيل الدخول يزامن السجل والتقدم.",
      sectionLinks: "الأقسام", sectionSupport: "الدعم", headerSettingsA11y: "الإعدادات",
      prayerSettingsTitle: "إعدادات الصلاة", quranSettingsTitle: "إعدادات القرآن", hadithSettingsTitle: "إعدادات الأحاديث",
      openPrayerTimes: "مواقيت الصلاة", openQuranList: "سور القرآن", supportProjectTitle: "ادعم المشروع",
      supportProjectOpen: "فتح رابط الدعم", supportAccountCopy: "نسخ", supportAccountCopied: "تم النسخ",
    },
  },
  zh: {},
  fa: {},
  id: {},
  ms: {},
  hi: {},
  ku: {},
};

let currentLocale: AppLocale = "kk";
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

function getOfflineLocalePatch(target: Exclude<AppLocale, "kk">): Record<string, unknown> {
  if (!offlineLocaleTreeCache[target]) {
    offlineLocaleTreeCache[target] = buildOfflineLocaleTree(
      KK_BASELINE,
      target as OfflineAutoTranslateTarget
    );
    releaseOfflineAutoTranslationsMemory();
  }
  return offlineLocaleTreeCache[target] as Record<string, unknown>;
}

function normalizeLocale(raw: string | null | undefined): AppLocale {
  return raw && APP_LOCALE_IDS.has(raw as AppLocale) ? (raw as AppLocale) : "kk";
}

function applyLocale(next: AppLocale): void {
  applyIntoTarget(
    kk as unknown as Record<string, unknown>,
    KK_BASELINE as unknown as Record<string, unknown>
  );
  if (next !== "kk") {
    applyIntoTarget(
      kk as unknown as Record<string, unknown>,
      getOfflineLocalePatch(next)
    );
    applyIntoTarget(
      kk as unknown as Record<string, unknown>,
      LOCALE_PATCHES[next] as Record<string, unknown>
    );
  }
  currentLocale = next;
}

function emitLocaleChange(): void {
  for (const listener of localeListeners) listener();
}

export function getCurrentLocale(): AppLocale {
  return currentLocale;
}

export async function setCurrentLocale(nextRaw: AppLocale): Promise<void> {
  const next = normalizeLocale(nextRaw);
  if (next !== "kk") {
    await ensureOfflineAutoTranslationsLoaded();
  }
  applyLocale(next);
  emitLocaleChange();
  try {
    await AsyncStorage.setItem(LOCALE_KEY, next);
  } catch {
    /* ignore */
  }
}

function subscribeLocale(listener: () => void): () => void {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
}

export function useAppLocale(): AppLocale {
  return useSyncExternalStore(subscribeLocale, getCurrentLocale, getCurrentLocale);
}

/**
 * Бут кезінде сақталған тілді оқып, негізгі `kk` мәтін объектісіне тиісті patch енгіземіз.
 */
export async function hydrateLocale(): Promise<AppLocale> {
  let next: AppLocale = "kk";
  try {
    next = normalizeLocale(await AsyncStorage.getItem(LOCALE_KEY));
  } catch {
    /* ignore */
  }
  if (next !== "kk") {
    await ensureOfflineAutoTranslationsLoaded();
  }
  applyLocale(next);
  emitLocaleChange();
  return next;
}
