/** Қолданба мәтіндері (қазақша) */

/** Таңбалауыш атауы — басты бет, тақырыптар (үй экраны атауымен бірдей). */
export const APP_BRAND_KK = "RAHAT OMIR";

/** AI бөлімі: бренд, астындағы белгі, біріктірілген бір жол (тайл, a11y) */
export const IMAM_AI_BRAND_KK = "ҚМДБ";
export const IMAM_AI_TAGLINE_KK = "Ханафи мәзһабы";
export const FATUA_KZ_LABEL_KK = "Fatua.kz";
export const MUFTYAT_KZ_LABEL_KK = "Muftyat.kz";
export const ISLAM_KZ_LABEL_KK = "Islam.kz";
export const MUSLIM_KZ_LABEL_KK = "Muslim.kz";
export const IMAM_AI_LEAD_KK = `Қазақстандағы дәстүрлі Ханафи мәзһабы, Матуриди ақидасы және ${FATUA_KZ_LABEL_KK} / ${MUFTYAT_KZ_LABEL_KK} дереккөздері — бір хабта.`;
export const IMAM_AI_ASSISTANT_KK = `${IMAM_AI_BRAND_KK} · ${IMAM_AI_TAGLINE_KK}`;
/** @deprecated Imam Ai переход үшін мұрагер константа */
export const RAQAT_AI_ASSISTANT_KK = IMAM_AI_ASSISTANT_KK;

/** Сүзгі/таңдау: «барлығын көрсету» — бір форма (FILTER_ALL_KK). */
export const FILTER_ALL_KK = "Барлығы";

export const kk = {
  common: {
    loading: "Жүктелуде…",
    error: "Қате",
    retry: "Қайталау",
    openInBrowser: "Браузерде ашу",
    embeddedSiteError:
      "Сайт қолданба ішінде тұрақты ашылмады. Браузерде ашып көріңіз немесе қайта жүктеңіз.",
    or: "немесе",
    save: "Сақтау",
    cancel: "Болдырмау",
    close: "Жабу",
    next: "Келесі",
    skip: "Кейінірек",
    done: "Дайын",
    /** Артқа қайту (скринридер) */
    back: "Артқа",
    /** Оқулық аккордеоны: тарау түймесінің скринридер сипаттамасы */
    guideAccordionExpand: "ашу",
    guideAccordionCollapse: "жасыру",
    offlineBadge: "Офлайн дерек",
    fromCache: "Соңғы сақталған уақыттар көрсетілуде",
    filterAll: FILTER_ALL_KK,
    closeImageZoom: "Жабу",
    openImageZoomA11y: "Суретті ірі қарау",
    imagePinchZoomHint: "Екі саусақпен үлкейтіп-кішірейтуге болады. Екі рет басып қалпына келтіру.",
    /** Машиналық аударма көрсетілгенде үстіндегі ескерту */
    autoTranslateNotice: "Автоматты аударма — дәл болмауы мүмкін. Түпнұсқа мәтін қазақша.",
    appErrorTitle: "Қолданба қатесі",
    appErrorHint: "«Қайта» — қайта сынау. Себепті көшіру: лог / экран.",
  },
  officialFeed: {
    attribution: "Дереккөз: ресми сайт (үзінді)",
  },
  onboarding: {
    title: `${APP_BRAND_KK}-ға қош келдіңіз`,
    step1:
      "Қолданбада намаз уақыты, Құран, хатым, дұғалар, құбыла, хадистер және діни оқулықтар бар. Құбыла мен намаз уақыты дұрыс жұмыс істеуі үшін орын рұқсаты керек болуы мүмкін. Кейін қала, хабарлама және басқа баптауларды «Баптаулар» бөлімінен өзгерте аласыз.",
    step2:
      "Құбыла көрсеткіші үшін магнит өрісін калибрлеу керек: телефонды баяу «сегіз» пішінінде бір рет айналдыр.",
    step3:
      "Кейін «Баптаулар» бөлімінде қала, хабарлама дыбысы (азан) мен басқа опцияларды өзгертесіз. Рұқсаттарды бас тартқан болсаңыз, баптауларда немесе жүйе параметрлерінде қайта қосуға болады.",
    start: "Түсіндім",
    languageTitle: "Тіл · Язык · Language",
    languageHint: "Қолданба тілін таңдаңыз. Кейін баптаулардан өзгертуге болады.",
  },
  tabs: {
    /** Төменгі табта мәтін жоқ болғанда да скринридер үшін */
    homeTabA11y: "Негізгі экран",
    home: "Басты",
    times: "Уақыт",
    qibla: "Құбыла",
    /** Ортаңғы батырма: түбір stack AsmaAlHusna (a11y — толық атау) */
    asma: "Алланың 99 есімі",
    /** Араб иконкасының астындағы қысқа жазу */
    asmaSub: "99 есімі",
    /** Төменгі таб / басты бет тайлы: зікірлер */
    tasbih: "Зікірлер",
    more: "Тағы",
  },
  asma: {
    screenTitle: "Алланың 99 есімі",
    tabShort: "99 есім · мағыналары",
    /** Экран басы: الله + астында қысқа атау */
    heroSubtitle: "99 есімі",
    intro:
      "Есімді басқанда қысқа түсінік ашылады. Іздеу арқылы нөмір, арабша немесе мағына бойынша табыңыз.",
    /** Есім жолының астындағы қысқа нұсқау */
    tapDetailHint: "Толық ақпарат үшін басыңыз",
    collapseHint: "Жасыру үшін қайта басыңыз",
    searchPh: "Іздеу (нөмір, мағына, арабша)…",
    empty: "Сәйкес есім жоқ.",
    chTafsir: "Түсінік",
    chMeaning: "Мағынасы",
    chQuran: "Дерек",
    chNote: "Ескерту",
  },
  account: {
    title: "Аккаунт",
    headerCta: "Кіру",
    guestHint:
      "Кірсеңіз, хатым прогресі мен сақталған деректеріңіз басқа құрылғыда да жоғалмайды.",
    username: "Логин",
    password: "Құпия сөз",
    signIn: "Кіру",
    signOut: "Шығу",
    loginOk: "Кіру сәтті.",
    loginFail: "Кіру сәтсіз — логин мен құпия сөзді тексеріңіз.",
    loggedOut: "Шықтыңыз.",
    apiMissing: "Қызмет уақытша қолжетімсіз. Кейінірек қайталап көріңіз.",
    userId: "Пайдаланушы",
    phoneE164: "Телефон (E.164)",
    phonePlaceholder: "+77001234567",
    sendOtp: "Код алу (SMS)",
    otpCode: "Келген SMS коды",
    otpPlaceholder: "000000",
    verifyPhone: "Растау және кіру",
    signInGoogle: "Gmail арқылы кіру",
    signInApple: "iCloud (Apple) арқылы кіру",
    oauthGoogleNotConfigured: "Gmail арқылы кіру уақытша қолжетімсіз.",
    oauthAppleUnavailable: "Apple кіру тек iOS құрылғысында қолжетімді.",
    phoneSmsUnavailable: "SMS арқылы кіру уақытша қолжетімсіз. Кейінірек қайталап көріңіз.",
    expandAdminLogin: "Логин / құпия",
    collapseAdminLogin: "Жасыру",
    telegramLinkTitle: "Telegram ботпен байланысу",
    telegramLinkHint: `Кодты алып, ${APP_BRAND_KK} Telegram ботына 6 цифрды жіберіңіз — бот пен қолданба бір аккаунтқа бірігеді.`,
    telegramLinkGetCode: "6 таңбалы код алу",
    telegramLinkCopy: "Көшіру",
    telegramLinkCodeReady: "Код дайын — ботқа жіберіңіз.",
    telegramLinkCodeCopied: "Код буферге көшірілді.",
    telegramLinkCodeFail: "Код алу сәтсіз. Кейінірек қайталап көріңіз.",
    telegramLinkNeedLogin: "Алдымен кіріңіз.",
    telegramLinkExpires: "Жарамды: ~{sec} сек",
  },
  navigation: {
    duasTitle: "Дұғалар",
    surahTitle: "Сүре",
    telegramTitle: "Telegram",
    homeTitle: APP_BRAND_KK,
    tabHome: "Басты бет",
    tabArticles: "Мақалалар",
    tabPrayerTimes: "Намаз уақыты",
    tabSaved: "Сақталғандар",
    tabProfile: "Жеке бет",
    /** Дұғалар/тәспі header: басты бетке (намаз тор) */
    openDashboard: "Басты",
    pressBackAgainToExit: "Шығу үшін «Артқа» түймесін тағы бір рет басыңыз",
    contentHubTitle: "Мазмұн орталығы",
    contentHubSub:
      "Басты бетте күнделікті өзек қалады: намаз, Құран және халал. Мұнда қосымша білім, хадис, тәжуид, дәстүр, қажылық және құралдар жинақы сақталған.",
    /** Мазмұн хабы секциялары */
    contentHubSectionWorship: "Ібадат және бағыт",
    contentHubSectionKnowledge: "Білім және дереккөз",
    contentHubSectionCommunity: "Қосымша құралдар",
    siriShortcutHelpTitle: "Siri және Жарлықтар",
    /** Мазмұн орталығы тайлы (тек iOS көрсетіледі) */
    siriShortcutHubTile: "Siri және жарлықтар",
  },
  dashboard: {
    greeting: "Ассаляму әлейкум",
    /** Басты экранның үстіңгі бөлігі — платформа сипаты */
    heroTagline: "Намаз уақыты, Құран, дұға және білім — бір қолданбада",
    today: "бүгін",
    nextPrayer: "Келесі намаз",
    /** Басты бет hero: орталық таймер — скринридер */
    nextPrayerCountdownA11y: (salatLabel: string | null, hms: string) =>
      salatLabel?.trim()
        ? `Келесі намаз: ${salatLabel.trim()}. Қалған уақыт: ${hms}`
        : `Қалған уақыт: ${hms}`,
    /** Басты бет: hero қысқа режим — толық кестеге өту */
    tapOpenFullPrayerTimes: "Басыңыз — толық намаз уақыттары",
    scheduleTable: "Бүгінгі кесте",
    qiblaStrip: "Құбыла бағыты",
    brandTitle: APP_BRAND_KK,
    /** Hero астындағы сілтеме: бөлшек сөздер a11y үшін */
    morePrayerLink: "Толығырақ",
    morePrayerLinkTarget: "намаз уақыты",
    /** Сервис тайлдар секциясы */
    servicesHeading: "Қызметтер",
    /** Mockup басты бет тайл субтитрлері */
    homeTileQuranSub: "Аяттар мен сүрелер",
    homeTileNamazSub: "Уақыты мен тәртібі",
    homeTileQiblaSub: "Бағытын табу",
    homeTileTasbihSub: "Зікір санағыш",
    homeTileDuasSub: "Күнделікті дұғалар",
    homeTileTajweedSub: "Құран оқу ережелері",
    homeTileDhikrTitle: "Зікірлер",
    homeTileDhikrSub: "Таңертеңгі және кешкі",
    homeTileTraditionSub: "Мақалалар мен кеңестер",
    dailyHubTitle: "Бүгінге",
    prayerTrackerTitle: "Бүгінгі намаз",
    prayerTrackerStreak: (days: number) => `Серия: ${days} күн`,
    prayerTrackerProgress: (done: number, total: number) => `${done}/${total} намаз`,
    dailyAiLabel: "Имам AI сұрағы",
    dailyAiA11y: "Күнделікті AI сұраққа өту",
    dailyAyahLabel: "Күнделікті аят",
    dailyAyahA11y: (surah: string, ayah: number) => `Күнделікті аят: ${surah}, ${ayah}`,
    dailyHadithLabel: "Күнделікті хадис",
    dailyHadithA11y: "Күнделікті хадис — хадис бөліміне өту",
    dailyQuoteLabel: "Нақыл",
    dailyQuoteA11y: "Қазақ ұлы сөздері",
    articlesSeeAll: "Барлығын көру",
    articleBadge: "Мақала",
    halalProductsRotatorTitle: "Halal Damu өнімдері",
    halalProductsRotatorSubtitle: "Сертификатты ұйымдар және тексеруге арналған өнім анықтамасы",
    halalProductsRotatorBadge: "HALAL DAMU",
    halalProductsOpenCatalog: "Каталог",
    halalProductsRotatorA11y: (current: number, total: number, title: string) =>
      `Халал өнім ${current}/${total}. ${title}. Басыңыз — каталогты ашу`,
    savedTabHint: "Құрандағы соңғы орын, хатым, белгіленген аяттар және таңдаулы деректер бір жерде.",
    /** Seerah / Quran карт — скринноттай кішіп мәтін */
    seerahCardSub: "Пайғамбар өмірбаяны",
    quranCardSub: "Сүрелер, аяттар",
    hadithCardSub: "Пайғамбар ﷺ өнегесі",
    hajjCardSub: "Үмра, қажылық",
    tajweedCardSub: "ҚМДБ · тәжуид ережелері",
    namazCardSub: "Дәрет · қадамдар · уақыт",
    namazTileLongPressA11y: "Ұзақ басу — намаз уақыты кестесін ашу",
    formatApproxTimeLeft: (totalMinutes: number) => {
      const m = Math.max(0, Math.floor(totalMinutes));
      const h = Math.floor(m / 60);
      const rem = m % 60;
      const bits: string[] = ["Шамамен"];
      if (h > 0) bits.push(`${h} сағ`);
      if (rem > 0) bits.push(`${rem} мин`);
      if (h === 0 && rem === 0) bits.push("0 мин");
      bits.push("қалды");
      return bits.join(" ");
    },
    /** Hero сол: Құран тізімі */
    heroQuranTitle: "Құран",
    /** Hero оң: хадис тізімі */
    heroHadithTitle: "Сахих хадистер",
    /** Қолданбада қауым дұғасы — басты бет торындағы тайл (strip жоқ) */
    heroDuaTitle: "Қауым дұғасы",
    heroDuaSub: "Бөлісу · әмин",
    /** Құран тайлдарының үстіндегі бір жол AI */
    aiRowTitle: IMAM_AI_ASSISTANT_KK,
    /** Hero оң бағана: қысқа атау (толығы — aiRowTitle / экран ішінде) */
    heroAiStripTitle: IMAM_AI_BRAND_KK,
    /** Промо карточка: басты тақырып + астында promoHalalSubline */
    promoHalalHeadline: "ХАЛАЛ ДАМУ",
    promoHalalSubline: "halaldamu.kz · ресми тізілім",
    /** Басты бет: Құрбан айт промо — жеке нұсқаулық экраны */
    promoHolidayKurbanTitle: "Құрбан айт",
    promoHolidayKurbanSub: "Намаз, құрбан, қазақы ізет — толық нұсқаулық",
    promoHolidayKurbanOpenHint: "Құрбан айт нұсқаулығын ашу",
    kurbanAitTopicsHeading: "Тақырыптар",
    kurbanAitOpenFullGuide: "Толық нұсқаулықты ашу",
    /** Басты бет: ауыстыратын жаңалық каруселі */
    newsRowBadge: "Жаңалық",
    newsRotatorCounter: (current: number, total: number) => `${current} / ${total}`,
    newsOpenTopic: (title: string) => `${title} — ашу`,
    newsOpenArticle: (title: string, source?: string | null) =>
      source ? `${source} — толық оқу` : `${title} — толық оқу`,
    newsRotatorA11y: (current: number, total: number, title: string) =>
      `Жаңалық ${current}/${total}. ${title}. Басыңыз — толық мақаланы ашу`,
    officialSourceOpenFatua: "Fatua.kz ресми сайты — ашу",
    officialSourceOpenMuftyat: "Muftyat.kz ресми сайты — ашу",
    /** Промо карточка: бір жол + астында promoAiSubline */
    promoAiHeadline: IMAM_AI_BRAND_KK,
    promoAiSubline: IMAM_AI_LEAD_KK,
    aiRowSub: IMAM_AI_LEAD_KK,
    loadError: "Уақыттар алынбады",
    /** Желі жоқ/қате, бірақ кэштегі кесте көрінеді */
    offlineCachedTimesHint:
      "Төмендегі уақыттар телефондағы соңғы сақталған кэштен. Желі қолжетімді болғанда жаңартыңыз.",
    pullToRefreshHint: "Экранды төмен тартып та жаңартуға болады.",
    prayerTimesRetryA11y: "Намаз уақыттарын желіден қайта жүктеу",
    /** Намаз кестесі бос, кэш жоқ — тек қате */
    prayerTimesLoadFailedHint: "Қала мен желіні тексеріп, қайта көріңіз.",
    /** Кэш сақталған сәтінің салыстырмалы сипаттамасы алдындағы префикс */
    cacheSavedLabel: (when: string) => `Сақталған: ${when}`,
    /** Негізгі модульдер (намаз + AI) */
    focusTitle: "Басты модульдер",
    prayerCta: "Намаз уақыттары",
    /** Намаз карточкасының скринридер атауы (көрінісінде тақырып жоқ) */
    prayerCardA11y: "Намаз уақыты мен кесте",
    /** Басты беттегі намаз блогын басқанда — толық экран ашылады */
    openPrayerDetailA11y: "Келесі намаз қысқаша көрінісі. Толық намаз уақыты мен хижра күнтізбесін ашу",
    /** Намаз карточкасы: орталық ауа райы (скринридер) */
    prayerWeatherA11y: (tempLine: string) => `Ауа райы: ${tempLine}`,
    prayerWeatherUnavailableA11y: "Ауа райы: дерек жоқ",
    prayerCtaSub: "Кесте және ескертулер",
    seerahCta: "Сира",
    seerahCtaSub: "Нұрсұлтан ұстаз — 38 сабақ (YouTube)",
    aiOneCta: IMAM_AI_ASSISTANT_KK,
    aiOneCtaSub: "Сұрақ-жауап · намаз · діни тақырыптар",
    moreContent: "Мазмұн",
    compactStrip: "Негізгі",
    quickMenu: "Тағы",
    duasShort: "Дұғалар",
    settingsShort: "Баптаулар",
    telegramShort: "Telegram",
    quranShort: "Құран",
    /** Тайл: қысқа атау */
    tileSeerah: "Сира",
    tileHadith: "Хадис",
    /** Құбыла көрсеткісі астындағы қысқа нұсқау */
    qiblaHeroFoot: "Толық экран — басу · орынды жаңарту — ұзақ басу",
    qiblaHeroHintNone: "Бағыт есептелуде…",
    qiblaHeroHintAligned: "Құбылаға тура (шамамен)",
    qiblaHeroHintCw: "Телефонды сағат тілі бойынша бұраңыз",
    qiblaHeroHintCcw: "Телефонды сағат тіліне қарсы бұраңыз",
    /** Тайл: тәжуид (әріптер + жоспар) */
    arabicLettersTile: "Тәжуид",
    /** Басты бет тайлы: қысқа атау */
    traditionTileShort: "Дін мен дәстүр",
    traditionTileSub: "Асыл сөздер · кітаптар · 37 тақырып",
    /** Мазмұн хабы: дін + дәстүр бір тайл (KazakhTradition) */
    traditionDinHubLabel: "Дін мен дәстүр",
    /** Радиал меню: ортадағы FAB */
    radialLauncherOpenA11y: "Қызметтер мәзірін ашу — батырма немесе жоғары тарту",
    radialLauncherCloseA11y: "Мәзірді жабу — батырма немесе төмен тарту",
    radialLauncherOpenHint: "Басыңыз немесе жоғары тартыңыз",
    radialLauncherCloseHint: "Басыңыз немесе төмен тартыңыз",
    radialLauncherMenuA11y: "Негізгі қызметтер",
    radialLauncherFabLabel: "Қызметтер",
  },
  namazGuide: {
    shortTitle: "Намаз",
    screenTitle: "Намаз оқулығы",
    intro:
      "Намазды кезең-кезеңімен үйреніңіз: алдымен дәрет, кейін ниеттен сәлемге дейінгі қадамдар. Фиқһтық нақты шешімді ұстазбен растаңыз.",
    hubTitle: "Намаз орталығы",
    hubSub: "Жылдам сілтемелер және оқу прогрессі",
    quickPrayerTimes: "Намаз уақыты",
    menzikirTitle: "Бөлімдер (8)",
    menzikirTotal: (sections: number) => `${sections} бөлім — дәреттен сынаққа дейін`,
    menzikirJumpHint: "Бөлімге өту үшін жолды басыңыз",
    progressWudu: "Дәрет қадамдары",
    progressSteps: (done: number, total: number) => `${done} / ${total}`,
    progressQuiz: "Сынақ",
    progressQuizEmpty: "әлі жоқ",
    /** Сурет астыңғы ескерту */
    imageTapHint: "Сурет төменде көрінеді; басып толық экранда ашуға болады. Екі саусақпен үлкейтуге болады.",
    closeImageLightbox: "Жабу",
    openImageA11y: "Суретті ірі қарау",
    wuduHeroTitle: "Дәрет",
    wuduHeroSub:
      "10 қадам: сурет, қысқа түсіндіру және оқылатын дұғалар.",
    wuduStepsIntro:
      "Ханафи дәрет реті: әр қадамда сурет, қысқа әрекет және керек жерде оқылатын мәтін. Суретті басып толық экранда ашуға болады.",
    wuduTheoryTitle: "Қосымша теория",
    wuduTheorySubtitle: "Дәрет түрлері, бұзылу, ер/әйел ескертулері",
    wuduSectionShowA11y: "Дәрет бөлімін ашу",
    wuduSectionHideA11y: "Дәрет бөлімін жасыру",
    sectionNamazMovesTitle: "Намаз қимылы мен сәләм (суретпен)",
    learningWuduHeading: "Дәрет: қадамдық оқу (арабша, қазақша оқылым)",
    learningCommonMistakes: "Жиі қателер",
    learningCheckpoint: "Өзіңізді тексеру",
    stepMarkDone: "Бұл қадамды орындадым",
    stepMarkedDone: "Қадам белгіленді",
    stepMarkDoneA11y: "Қадамды орындалды деп белгілеу",
    stepMarkedDoneA11y: "Қадам орындалды деп белгіленді",
    quizHeading: "Қысқа сынақ (6 сұрақ)",
    quizIntro: "Әр сұраққа бір рет жауап бересіз; түсініктеме бірден көрінеді. Нәтиже құрылғыда сақталады.",
    quizScore: (correct: number, total: number) => `Дұрыс жауап: ${correct} / ${total}`,
    /** Бір бөлімде: суреттер, түсіндіру, қадамдық оқу, мәтін және қысқа сынақ */
    unifiedNamazTitle: "Намаз нұсқаулығы (толық)",
    unifiedNamazSubtitle:
      "Сурет, қысқа түсіндіру, араб мәтіні, оқылым және мағына.",
    unifiedNamazIntro:
      "Қадам реті: ниет пен тәкбір → қиям → рукуғ → сәжде → соңғы отырыс → сәлем. Әр блокты ашып, оқылатын мәтінді жаттаңыз.",
  },
  tajweedGuide: {
    shortTitle: "Тәжуид",
    screenTitle: "Тәжуид",
    intro:
      "Тәжуид — Құранды әріп, дыбыс, созу және тоқтау ережесімен дұрыс оқу. Төмендегі оқу ретімен бастаңыз.",
    sourceSafetyNote:
      "Оқулықтағы аят мағыналары мен мысалдар оқу мақсатына берілген. Діни үкім, терең тәфсір немесе даулы мәселе үшін ҚМДБ бағыты мен білікті ұстаз түсіндірмесіне сүйеніңіз.",
    sectionAlphabet: "Араб әліпбиі",
    onlineLessonEyebrow: "Онлайн сабақ",
    onlineLessonCta: "WhatsApp арқылы жазылу",
    onlineLessonA11y: "Тәжуид онлайн сабағына WhatsApp арқылы хабарласу",
    onlineLessonBody: (phone: string) =>
      `Тәжуидті ұстазбен онлайн үйрену үшін WhatsApp арқылы хабарласыңыз. Нөмір: ${phone}. Батырманы басқанда дайын хабарлама ашылады.`,
    sectionBook: "Толық оқулық бөлімдері",
    sectionBookSub: (_pages: number) => "Әліппе мен ережелер · тарауға секіру",
    openBookBtn: "Оқулықты ашу",
    openBookA11y: "Тәжуид оқулығын ашу",
    sectionQuranColors: "Құрандағы түсті белгілер",
    sectionSource: "Дереккөз",
    tocGroupPreface: "Алғысөз және кіріспе",
    tocJumpHint: "Бөлімге өту үшін жолды басыңыз",
    expandAllParts: "Барлық топты ашу",
    collapseAllParts: "Барлық топты жабу",
    quranColorsHint:
      "Құран оқу экранындағы бояулар: 17 түсті белгі аят ішінде бөлек көрсетіледі.",
    tocHeading: "Мазмұны",
    pagesHeading: "Тәжуид оқулығы",
    pageUnit: "бет",
    pageLabel: (n: number) => `${n}-бет`,
    closeImageLightbox: "Жабу",
    openPageImageA11y: (n: number) => `${n}-бет — сурет`,
    openMuftyatA11y: "muftyat.kz сайтында ашу",
    openPdfA11y: "PDF нұсқасын ашу",
    listenPageA11y: (n: number) => `${n}-бетті дауыспен оқу`,
    stopListenA11y: "Оқуды тоқтату",
    listenPageBtn: "Оқу",
    stopListenBtn: "Тоқтату",
    alphabetTapHint: "Әріпті басыңыз — арабша дыбысталуы дауыспен оқылады.",
    alphabetSpeechError:
      "Дыбыс шықпады. Браузерде дыбыс қосулы екенін тексеріңіз; телефонда араб TTS (Google TTS) орнатылғанын қараңыз.",
    listenLetterA11y: (nameKk: string, ar: string) => `${nameKk}, ${ar} — тыңдау`,
    alphabetHeading: "Араб әліпбиі",
    alphabetLegendHeavy: "Жуан",
    alphabetLegendLight: "Жіңішке",
    alphabetExampleLabel: "Мысал",
  },
  duas: {
    intro:
      "Дұғалар 8 жүйелі бөлімде: күнделікті, дәрет, денсаулық, саяхат, зікір, қажылық, білім/ризық және 10 қысқа зікір. Намаз ішіндегі дұғалар мұнда жоқ — «Зікірлер» бөлімін қараңыз.\n\nТөмендегі бөлімдерден секіруге болады. Бөлім атауына басыңыз — дұғалар тізімі ашылады. Карточкада араб мәтіні көрінеді; қайта басқанда оқылуы мен мағынасы шығады.",
    menzikirTitle: "Бөлімдер (8)",
    menzikirTotal: (sections: number, duas: number) => `${sections} бөлім · барлығы ${duas} дұға`,
    menzikirJumpHint: "Бөлімге өту үшін жолды басыңыз",
    /** Қалта тақырыбының астындағы қысқа сан */
    duaCount: (n: number) => `${n} дұға`,
    categoryExpandHint: "Бөлімдегі дұғаларды көрсету",
    categoryCollapseHint: "Дұғалар тізімін жасыру",
    translitCaption: "Оқылуы (қазақша транскрипция)",
    meaningCaption: "Мағына (қазақша)",
    /** Карточка қысқартылғанда — толығын ашу */
    expandTapHint: "Оқылуы мен мағынаны ашу үшін басыңыз",
    /** Карточка толық ашылғанда — қалтаға қысқарту */
    collapseTapHint: "Қысқарту үшін қайта басыңыз — тек дұға мәтіні қалады",
    searchPlaceholder: "Іздеу: тақырып, арабша, транскрипция немесе мағына…",
    searchHint:
      "Жазған кезде сәйкес бөлімдер автоматты ашылады. Тазалау үшін жолды бос қалдырыңыз.",
    noSearchResults: "Осындай сөзбен дұға табылмады — басқа түйін сөз немесе қысқа сұрау қолданыңыз.",
    expandAllCategories: "Барлық бөлімді ашу",
    collapseAllCategories: "Барлық бөлімді жабу",
  },
  qibla: {
    permLoading: "Орын рұқсаты…",
    deniedTitle: "Геолокация қажет",
    deniedBody:
      `Параметрлер → ${APP_BRAND_KK} қолданбасы → Орын рұқсатын қосыңыз немесе төмендегі «Баптауларды ашу» батырмасын басыңыз.`,
    servicesOffTitle: "Орын қызметі өшірулі",
    servicesOffBody:
      "Телефонда орын (GPS) қосыңыз: Параметрлер → Орын → Орын қызметін қосу. Android 12+ / 13: қолданба үшін «Дәл орын» (Precise) қосыңыз — тек жақын орын болса құбыла дәлірек болады. Содан қолданбаға қайта кіріңіз.",
    positionFailedTitle: "Орын анықталмады",
    positionFailedBody:
      "Ашық аспан астында немесе терезе жақта қайта көріңіз. Ішкі бөлмеде сигнал әлсіз болуы мүмкін. «Уақыт» бөлімінде таңдалған қала бойынша шамамен бағыт қосылды — дәл GPS болса дәлірек.",
    cityApproxHint:
      "Бағыт қолданбада таңдалған қала орталығының координатасы бойынша (GPS сигналы болмағанда).",
    openSettings: "Баптауларды ашу",
    retryLocation: "Қайта алу",
    hintPending: "Орын мен магнитометр дайын болғанда көрсеткі пайда болады.",
    hintAligned:
      "Көрсеткі Қағба жаққа қарағанда тұрақталды. Магнит белдеу мен металл дәлдікті өзгертуі мүмкін.",
    hintTurnCw: "Сағат тілі бойынша телефонды баяу бұраңыз — көрсеткі Қағбаға қарағанша.",
    hintTurnCcw: "Сағат тіліне қарсы телефонды баяу бұраңыз — көрсеткі Қағбаға қарағанша.",
    /** Құбыла экранындағы дәл градус жолы (maxDeg = QIBLA_ALIGN_THRESHOLD_DEG, qiblaHints). */
    offsetInZone: (maxDeg: number) =>
      `Тура аймақта (±${maxDeg}°). Магнит пен метал әсер етуі мүмкін — қажет болса телефонды «секіру» қимылымен калибрлеңіз.`,
    offsetPreciseCw: (deg: number) =>
      `${Math.abs(deg).toFixed(1)}° қалды — сағат тілі бойынша бұраңыз.`,
    offsetPreciseCcw: (deg: number) =>
      `${Math.abs(deg).toFixed(1)}° қалды — сағат тіліне қарсы бұраңыз.`,
    /** WGS84 координаттан есептелген азимут (0° = солтүстік, сағат тілі). */
    azimuthReadout: (deg: string) => `Құбыла азимуты: ${deg}°`,
    /** Компас / магнит түзетілген құрылғы бағыты (географиялық солтүстікке қатысты). */
    headingReadout: (deg: string) => `Құрылғы бағыты: ${deg}°`,
    compassQualityReadout: (quality: "unknown" | "high" | "medium" | "low", acc: string) => {
      const label =
        quality === "high"
          ? "жоғары"
          : quality === "medium"
            ? "орта"
            : quality === "low"
              ? "төмен"
              : "анықталуда";
      return acc === "—" ? `Компас сапасы: ${label}` : `Компас сапасы: ${label} · дәлдік ${acc}°`;
    },
    locationAccuracyReadout: (accuracy: string) => `Орын дәлдігі: ${accuracy}`,
    locationSourceCity: "Орын: таңдалған қала бойынша шамамен",
    webCompassTitle: "Сайтта компасты қосу",
    webCompassBody:
      "Телефон браузері компас сенсорын бөлек рұқсатпен ашады. Төмендегі батырманы басып, сұралса Motion/Orientation рұқсатын беріңіз.",
    webCompassCta: "Компасқа рұқсат беру",
    webCompassManualBody:
      "Егер браузер сенсор бермесе, сайтта стрелканы қолмен солға/оңға жылжытып тексеруге болады.",
    webCompassLeft: "← Солға",
    webCompassRight: "Оңға →",
    webCompassReset: "Нөлдеу",
    motionBalanced: "Тұрақты",
    motionFast: "Жылдам",
    calibrationTitle: "Компас калибрлеу шебері",
    calibrationBody:
      "20 секунд бойы телефонды ауада «8» пішінінде баяу айналдырыңыз. Металлдан алыс ұстаңыз.",
    calibrationRunning: (sec: number) => `Калибрлеу жүріп жатыр… ${sec} с`,
    calibrationStart: "Калибрлеуді бастау",
    calibrationStop: "Тоқтату",
    calibrationHigh: "Дәлдік: жоғары",
    calibrationMedium: "Дәлдік: орта",
    calibrationLow: "Дәлдік: төмен",
    magnetHint: "Дәлдікке металл заттар мен қапсырма әсер етуі мүмкін.",
    modeCompass: "Компас",
    modeCamera: "Камера",
    cameraTitle: "Құбыла · камера",
    cameraBodyHint: "Телефонды баяу бұрыңыз — көрсеткі Қағбаға қарағанша.",
    cameraWebUnavailable: "Камера режимі тек телефонда (iOS/Android) қолжетімді.",
    cameraPermTitle: "Камера рұқсаты",
    cameraPermBody: "Алдыңғы камера арқылы құбыла бағытын көру үшін рұқсат қажет.",
    cameraPermCta: "Рұқсат сұрау",
    cameraBackToCompass: "Компас режиміне",
    headerLongPressCamera: "Ұзақ басу — камера режимі",
    headerTapQibla: "Құбыла экранына өту",
  },
  seerah: {
    title: "Сира",
    intro:
      "Пайғамбар Оған Алланың салауаты мен сәлемі болсын өмірі мен жолы — сира. Төменде Нұрсұлтан ұстаздың 38 бейнесабағына батырмалар бар — әрқайсысы YouTube-та ашылады.",
    lessonsSection: "Бейнесабақтар (1–38)",
    /** Карточка астындағы мәтін: «1 сабақ», «2 сабақ», … */
    lessonTitle: (n: number) => `${n} сабақ`,
    lessonSub: "YouTube",
    ustazImageA11y: "Нұрсұлтан ұстаз",
    lessonA11y: (n: number) => `Сира ${n} сабақ — YouTube-та ашу`,
    openError: "Сілтемені ашу сәтсіз болды.",
  },
  tasbih: {
    screenTitle: "Зікірлер",
    zikirSection: "Зікірлер",
    /** Тізім экраны баннерінің қосымша жолы */
    listSubtitle:
      "Әр тарауда зікірдің араб мәтіні, қазақша атауы және тәспідегі прогресс көрінеді.",
    /** Тізім жолы: тәспі экранын ашу (скринридер) */
    openCounterA11y: "Тәспі экранын ашу",
    /** Ашылған зікір жолы: жасыру (скринридер) */
    collapseDhikrA11y: "Зікірді жасыру",
    backToList: "Тізімге",
    zikirToggleOpen: "Зікірлерді жасыру",
    zikirToggleClosed: "Зікірлерді көрсету",
    /** Тізім жабық: басқа зікір таңдау */
    zikirHeaderClosedHint: "Басқа зікір · тізімді ашу",
    zikirHeaderA11y: "Зікір тізімін ашу немесе жасыру",
    pickDhikr: "Зікірді таңдаңыз",
    goalLabel: "Мақсат (қайталам)",
    tapHint: "Төмендегі дөңгелекті басып санайсыз.",
    tapA11y: "Тәспіні басып санау",
    phaseSubhan: "СубханАллаһ",
    phaseHamd: "Әлхамдулиллаһ",
    phaseTakbir: "Аллаһу акбар",
    tripleHint: "Намаздан кейінгі тәспі: СубханаЛлаһ, Әлхамдулиллаһ, Аллаһу акбар — әрқайсысы 33 рет, барлығы 99.",
    reset: "Нөлдеу",
    left: "қалды",
    translitLabel: "Транскрипция",
    meaningLabel: "Мағына",
    loadFailedHint: "Зікір тізімі жүктелмеді. Қолданбаны қайта іске қосыңыз немесе жаңартыңыз.",
  },
  aiChat: {
    /** Текст өрісінің ішіндегі нұсқау (қысқа; толық мысалдар usageTips-те) */
    /** Қысқа: кіріс жолында ұзын placeholder кесіліп көрінбеуі үшін */
    placeholder: "Пәтуа сұрағыңызды жазыңыз…",
    send: "Жіберу",
    empty:
      "Сұрағыңызды жазыңыз. Жауап тек Fatua.kz және Muftyat.kz индексіндегі материалдарға сүйенеді; астында ресми сілтеме көрсетіледі. Материал табылмаса — «табылмады» деп хабарланады.",
    configTitle: "Қызметке қосылу керек немесе кіру жоқ",
    configBody:
      "Қызметке қосылу үшін интернет керек. Егер сұрақ-жауап ашылмаса, кейінірек қайталап көріңіз немесе баптаулардан қызмет күйін тексеріңіз.",
    signInRequired:
      "Бұл функция үшін алдымен «Баптаулар» бөлімінен аккаунтқа кіріңіз.",
    /** Қонақ режим: серверден LLM болмаса қысқа локал кеңес көрсетіледі */
    guestWebNote:
      "🌐 Толық талдау (LLM) бұл сәтте қолжетімсіз болды. Кейінірек қайта көріңіз немесе қажет болса «Баптауларда» кіріңіз.",
    openSettingsTab: "Толық баптауларды ашу",
    openSettingsShort: "Баптаулар",
    thinking: "Жауап дайындалуда…",
    detailPreparing: "Толығырақ дайындалып жатыр…",
    /** Қысқа жауап көрініп тұр; толық саты фонда */
    detailPreparingShort: "Толық жауап қосылуда…",
    /** Quick сәтті болса, full staged қысқа сүрін мүмкін — «тұрып қалды» божамын азайту */
    fullDetailWaitNote:
      "Күте тұрыңыз: толық жауап дайындалып жатыр. Бұл 1–2 минутқа дейін созылуы мүмкін.",
    fallbackNoAnswer: "Жауап уақытша қолжетімсіз. Кейінірек қайта жіберіңіз.",
    detailRetry: "Қайта көру",
    detailSection: "Толығырақ",
    detailUnavailable:
      "Толық талдау жүктелмеді — жоғарыдағы қысқа жауапты пайдаланыңыз немесе қайта жіберіңіз.",
    error: "Сұрау орындалмады",
    /** Сервер JSON емес дене қайтарғанда (nginx/HTML, бос жауап, қате прокси) */
    errorParse:
      "Қызметтен дұрыс жауап келмеді. Интернетті тексеріп, кейінірек қайталап көріңіз.",
    errorAuth:
      "AI чатына кіру рұқсаты жоқ. Баптаулардан аккаунтқа кіріп көріңіз.",
    errorRateLimit: "Сұрау тым жиі жіберілді. Біраздан кейін қайта көріңіз.",
    errorServer: "Қызмет уақытша дайын емес. Кейінірек қайталап көріңіз.",
    errorGeminiBusy:
      "AI қызметі уақытша жүктеліп тұр. 1–2 минуттан кейін қайта жіберіңіз.",
    hollowServerReply:
      "AI жауап бере алмады. Кейінірек қайталап көріңіз немесе ресми дереккөздер бөлімінен іздеңіз.",
    errorTimeout:
      "Күту уақыты аяқталды. Интернетті тексеріп, қайта көріңіз.",
    errorNetwork:
      "Желіге қосылу сәтсіз. Интернетті тексеріп, кейінірек қайталап көріңіз.",
    /** Диагностика: нақты жүргізіліп жатқан API (override болса соны көрсетеді) */
    activeApiHost: (host: string) => `API: ${host}`,
    disclaimer:
      "Жауап ақпараттық көмек; фиқһтық үкім емес. Бағыт: Қазақстан заңдарына сай дәстүрлі Ханафи мәзһабы және Матуриди ақидасы. Нақты жағдайда Fatua.kz / Muftyat.kz толық мәтінін оқыңыз немесе білікті ұстазға жүгініңіз.",
    persistentSafetyNotice: "Фәтуа емес: жауапты ҚМДБ дереккөзі және Ханафи мәзһабы бойынша тексеріңіз.",
  /** AI чат — тұрақты, ірі ескерту (фетва емес). */
    heroDisclaimer:
      "Бұл AI көмекші — фетва бермейді. Қателік болуы мүмкін. Ресми сұрақтар үшін Fatua.kz-ке жүгініңіз.",
    heroDisclaimerFatuaLink: "Fatua.kz ашу",
    usageTips:
      "Мысал: «Ханафи бойынша зекет мөлшері», «Дәрет бұзылуы», «Ораза уақыты». Жауап тек индекстегі пәтуаға сүйенеді; табылмаса ресми сайтқа жібереміз.",
    settingsPanelTitle: "Сұрақ-жауап баптаулары",
    settingsPanelA11y: "Сұрақ-жауап баптауларын ашу немесе жию",
    kbOnlyModeBadge: "ҚМДБ · Ханафи бағыты",
    kbNoSourceWarning:
      "Бұл жауапқа ресми дереккөз сілтемесі қосылмаған. Fatua.kz / Muftyat.kz сайтында толық мәтінді өзіңіз растаңыз.",
    kbNoSourceIncompleteTitle: "Дереккөзсіз жауап толық емес",
    kbNoSourceIncompleteBody:
      "Индекстен нақты ресми сілтеме шықпады. Бұл мәтінді үкім ретінде қабылдамай, Fatua.kz / Muftyat.kz толық мәтінінен немесе ұстаздан нақтылаңыз.",
    kbPipelineNote:
      "RAHAT OMIR AI — жаңа фетуа сайты емес. Жүйе Қазақстандағы дәстүрлі Ханафи мәзһабы мен Матуриди ақидасына сай ҚМДБ дереккөздерін, Fatua.kz / Muftyat.kz материалдарын іздейді, содан кейін үзіндіні қазақша қысқартады. Жауап астында дереккөз сілтемесі.",
    kbDisabledNoApi: "Пәтуа іздеу қызметі уақытша қолжетімсіз.",
    kbChecking: "Пәтуа индексі тексерілуде…",
    kbServerOff: "Пәтуа іздеу қызметі уақытша қолжетімсіз.",
    kbApiOld: "Пәтуа іздеу қызметін жаңарту қажет. Кейінірек қайталап көріңіз.",
    kbIndexed: (fatua: number, muftyat: number, chunks: number) =>
      `Индекс: ${FATUA_KZ_LABEL_KK} ${fatua}, ${MUFTYAT_KZ_LABEL_KK} ${muftyat} мақала · ${chunks} үзінді.`,
    kbRefreshA11y: "Индекс күйін жаңарту",
    introPanelTitle: "ҚМДБ бағыты және пәтуа көзі",
    introPanelToggleA11y: (open: boolean) =>
      open ? "Пәтуа көзі ақпаратын жию" : "Пәтуа көзі ақпаратын ашу",
    exampleQuestionsTitle: "Мысал сұрақтар",
    exampleQuestionA11y: (q: string) => `Мысал сұрақ: ${q}`,
    kbSearchTitle: "Пәтуа іздеу",
    kbSearchHint:
      "Fatua.kz және Muftyat.kz индексінен іздеу. Толық мәтін көрсетілмейді — үзінді және сайтта ашу.",
    kbSearchPlaceholder: "Мысалы: намаз, дәрет, зекет…",
    kbSearchSubmitA11y: "Іздеу",
    kbSearchEmpty: "Нәтиже табылмады. Басқа сөзмен қайталаңыз немесе AI чатта сұраңыз.",
    kbSearchError: "Іздеу уақытша орындалмады. Интернетті тексеріп, қайта көріңіз.",
    kbSearchAttribution: "Дереккөз: ресми сайт (үзінді)",
    kbSearchReadFull: "Толық оқу",
    kbSearchReadFullA11y: (title: string) => `${title} — толық оқу`,
    kbSearchOpenBanner: `Пәтуа іздеу (${FATUA_KZ_LABEL_KK} / ${MUFTYAT_KZ_LABEL_KK})`,
    kbSearchOpenBannerA11y: "Fatua.kz және Muftyat.kz бойынша іздеу экраны",
    kbShelfTitle: "ҚМДБ пәтуа іздеу",
    kbShelfHint: "Тақырыпты басыңыз — сұрақты чатқа қояды. Жауап Ханафи бағыты мен ресми дереккөзге сүйенуі тиіс.",
    kbShelfToggleA11y: (open: boolean) =>
      open ? "Пәтуа іздеуді жию" : "Пәтуа іздеуді ашу",
    kbShelfUntitled: "Пәтуа",
    kbChipAll: "Барлығы",
    kbChipFatua: FATUA_KZ_LABEL_KK,
    kbChipMuftyat: MUFTYAT_KZ_LABEL_KK,
    kbShelfChipsA11y: "Сайт бойынша сүзгі",
    kbShelfAsk: "Сұрақ қою",
    kbShelfAskA11y: (title: string) => `${title} — сұрақ қою`,
    kbShelfAskDefault: "Осы пәтуа не туралы? Қысқаша түсіндір.",
    kbShelfSourceLabel: "Дереккөз",
    kbShelfTopicLabel: "Тақырып",
    kbShelfExcerptLabel: "Үзінді",
    sourceFallbackLabel: "Дереккөз",
    apiMissingDetail:
      "Қызметке қосылу мүмкін болмады. Кейінірек қайталап көріңіз.",
    sourcesTitle: "Дереккөздер",
    sourcesMore: "қосымша",
    sourceOpenA11y: (title: string) => `${title} — браузерде ашу`,
  },
  kmdbHub: {
    title: IMAM_AI_BRAND_KK,
    eyebrow: "ҚМДБ · ресми дереккөз",
    lead: "Fatua.kz, Muftyat.kz және RAHAT OMIR оқу модульдері — бір жүйелі хабтан: іздеу, оқу, сұрау және тексеру.",
    tileAi: "Сұрақ-жауап",
    tileAiSub: "Пәтуа мен мақалаға сүйенген AI (дереккөзбен)",
    tilePortal: "Ресми портал",
    tilePortalSub: "Fatua.kz + Muftyat.kz мақалалары, жаңалық және AI сұрау",
    tileSearch: "Пәтуа іздеу",
    tileSearchSub: "Локалды Fatua/Muftyat базасынан жылдам іздеу",
    tileBooks: "Ресми кітаптар",
    tileBooksSub: "Fatua.kz PDF және Muftyat.kz кітапханасы",
    tileHadith: "ҚМДБ хадис",
    tileHadithSub: "Muftyat/Fatua мақалаларынан хадис үзінділері",
    tileHajjSub: "Қажылық, умра, тәлбия және ресми нұсқаулық",
    tileZakatSub: "Нисаб · мүлік · қарыз · 2.5% есеп",
    workflowTitle: "Қалай қолдану керек",
    workflowSearchTitle: "1. Ресми мәтінді табыңыз",
    workflowSearchBody: "Портал немесе пәтуа іздеу арқылы Fatua.kz/Muftyat.kz материалын ашыңыз.",
    workflowReadTitle: "2. Толық дереккөзді оқыңыз",
    workflowReadBody: "Мақала, кітап немесе PDF толық мәтінін қарап, үзіндімен шектелмеңіз.",
    workflowAskTitle: "3. AI арқылы түсіндіріңіз",
    workflowAskBody: "Мәтін түсініксіз болса, дереккөзге сүйенген сұрақ қойыңыз.",
    workflowVerifyTitle: "4. Жеке үкімді ұстазбен нақтылаңыз",
    workflowVerifyBody: "Неке, талақ, мұра, кәффарат сияқты жеке мәселеде мешіт имамы немесе ресми пәтуа қажет.",
    officialSitesTitle: "Ресми сайттар",
    officialSitesLead:
      "Ресми мәтінді ашып оқыңыз, түсінбеген жерін AI-дан дереккөзге сүйеніп сұраңыз.",
    fatuaDescription: "Пәтуа, сұрақ-жауап және жеке діни мәселені ресми мәтінмен нақтылау.",
    fatuaChipFatwa: "Пәтуа",
    fatuaChipQa: "Сұрақ-жауап",
    fatuaChipPersonal: "Жеке мәселе",
    muftyatDescription: "ҚМДБ жаңалығы, мақала, кітап және діни-ағартушылық материалдар.",
    muftyatChipArticle: "Мақала",
    muftyatChipBook: "Кітап",
    muftyatChipNews: "Жаңалық",
    openFatuaA11y: "Fatua.kz ашу",
    openMuftyatA11y: "Muftyat.kz ашу",
    muftyatRefreshA11y: "Сайтты жаңарту",
    tabMuftyat: MUFTYAT_KZ_LABEL_KK,
    tabFatua: FATUA_KZ_LABEL_KK,
    tabMosques: "Мешіттер",
    tileMosques: "Мешіттер",
    tileMosquesSub: "Жақындағы мешіттерді 2GIS каталогы арқылы табыңыз.",
    disclaimer:
      "Діни үкім шығару — тек ресми мәтін және ұстаз түсіндірмесіне сүйеніңіз. AI жауабы — көмекші, пәтуа емес.",
  },
  zakatCalculator: {
    title: "Зекет калькуляторы",
    lead:
      "Мүлікті ретімен енгізіңіз: ақша, алтын-күміс, сауда тауары, қайтарылатын қарыз және қысқа қарыздар. Нисабқа жетсе, калькулятор 2.5% зекет сомасын шығарады.",
    resultTitle: "Шамамен берілетін зекет",
    inputsTitle: "Мүлік пен міндеттемелер",
    assetsTotal: "Активтер",
    debtsTotal: "Қарыздар",
    netTotal: "Зекет базасы",
    rateLabel: "Мөлшер",
    cash: "Ақша және депозит",
    cashHint: "Қолма-қол ақша, карта, банк шоты, депозит.",
    gold: "Алтын құны",
    goldHint: "Зекетке кіретін алтынды бүгінгі теңге құнымен енгізіңіз.",
    silver: "Күміс құны",
    silverHint: "Күмісті немесе күміс құнын теңгемен жазыңыз.",
    tradeGoods: "Сауда тауары",
    tradeGoodsHint: "Сатуға арналған тауардың нарықтық құны.",
    receivables: "Қайтарылатын қарыз",
    receivablesHint: "Қайтуы ықтимал берешек, табыс, төлемдер.",
    debts: "Қысқа қарыздар",
    debtsHint: "Жақын мерзімде төленетін міндеттемелерді шегеру.",
    nisab: "Нисаб",
    nisabHint: "ҚМДБ/ұстаз айтқан ағымдағы нисабты теңгемен енгізіңіз.",
    nisabReached: "Нисабқа жетті: есеп зекет базасының 2.5% бойынша шықты.",
    nisabMissing: (amount: string) => `Нисабқа жетпейді: шамамен ${amount} кем.`,
    nisabNotSet: "Нисаб енгізілмесе, экран тек 2.5% шамасын көрсетеді.",
    disclaimer:
      "Бұл калькулятор ақпараттық көмек қана. Нисаб, жыл толуы, қарыз шегеру және нақты мүлік түрі бойынша ҚМДБ пәтуасы немесе білікті ұстазбен нақтылаңыз.",
    askAi: "Зекет туралы сұрау",
    aiPrompt: "Зекет мөлшері қалай есептеледі? Нисаб пен қарызды шегеру шарттарын түсіндіріңіз.",
    clear: "Тазалау",
  },
  knowledgePortal: {
    title: "Діни білім порталы",
    screenTitle: "Fatua · Muftyat",
    eyebrow: `${IMAM_AI_BRAND_KK} · ҚМДБ ресми дереккөздері`,
    lead: `${FATUA_KZ_LABEL_KK} мен ${MUFTYAT_KZ_LABEL_KK} — бір ортада: жаңалықтар, пәтуалар, сұрақ-жауап. Мақаланы оқыңыз немесе AI арқылы түсіндіру сұраңыз.`,
    qmdbTag: "ҚМДБ",
    feedTitle: "Мақалалар",
    feedEmpty: "Мазмұн табылмады. Іздеуді өзгертіңіз немесе ресми сайттарды ашыңыз.",
    askAiTitle: "RAHAT OMIR AI-ға сұрақ қою",
    askAiHint: "Fatua.kz / Muftyat.kz индексімен жауап",
    askAiA11y: "RAHAT OMIR AI чатына өту",
    openFatuaA11y: "Fatua.kz ресми сайты",
    openMuftyatA11y: "Muftyat.kz ресми сайты",
    openPortalBanner: "Діни білім порталы",
    openPortalBannerA11y: "Fatua.kz және Muftyat.kz біріктірілген портал",
    sourceLabel: "Дереккөз",
    topicLabel: "Тақырып",
    excerptLabel: "Үзінді",
    untitled: "Мақала",
    excerptBadge: "Үзінді",
    readInApp: "Толығырақ оқу",
    noExcerpt: "Үзінді жоқ.",
    fullTextOnSiteNotice: "Толық мәтін ресми сайтта. Төмендегі батырмамен ашыңыз.",
    openFullOnSite: "Ресми сайтта ашу",
    openFullOnSiteA11y: (title: string) => `${title || "Мақала"} — ресми сайтта ашу`,
    detailBoundaryHint: "Бұл экран — мақала үзіндісі. Толық мәтін мен ресми пәтуа Fatua.kz / Muftyat.kz сайтында.",
  },
  features: {
    hatimTitle: "Хатым",
    hajjTitle: "Қажылық",
    hajjPageLabel: (page: number) => `${page}-бет`,
    hajjOqylyLabel: "Оқылуы",
    hajjMagynasyLabel: "Мағынасы",
    hajjOpenPageImageA11y: (page: number) => `${page}-бет суретін үлкейту`,
    hajjCloseImageLightbox: "Жабу",
    hajjOpenMuftyatLink: "muftyat.kz кітабы",
    hajjOpenMuftyatA11y: "muftyat.kz сайтында Қажылық кітабын ашу",
    hajjSourceMeta: (org: string, year: number) => `${org} · ${year} · Ламашәріп Қайрат Қайырбекұлы`,
    /** Тәлбия карточкасындағы постер (скринридер) */
    hajjTalbiyahPosterA11y:
      "Тәлбия дұғасы — тілге байланысты оқылуы мен мағынасы (мешіт фоны)",
    hajjIntro:
      "ҚМДБ «Қажылық» кітабынан ықшамдалған оқу нұсқасы. Бөлімді ашып, мәтінін ретімен оқыңыз; ресми дереккөз төменде берілген.",
    hajjTourAgenciesTitle: "Қажылық ұйымдарын тексеру",
    hajjTourAgenciesLead: "Ұмыра/қажылық сапарына шығар алдында тексеретін қысқа нұсқаулық",
    hajjTourAgenciesEmptyTitle: "Агенттікті таңдағанда нені сұрау керек?",
    hajjTourAgenciesEmpty:
      "Ресми рұқсат құжатын, келісімшартты, төлем түбіртегін, Мекке-Медина қонақүйін және жетекші ұстаз/топ басшысын нақтылап алыңыз.",
    hajjTourAgenciesChecklist: [
      "ҚМДБ/уәкілетті орган рұқсаты және компания құжаты",
      "Келісімшарт, төлем түбіртегі, қайтару шарты",
      "Қонақүй мекенжайы, ұшу күні, топ жетекшісінің байланысы",
    ],
    hajjTourAgenciesDisclaimer:
      "Байланыс және баға — тікелей агенттікпен. RAHAT OMIR тек ақпараттық тізім; келісімшарт агенттікпен жасалады.",
    hajjTourServiceUmrah: "Ұмыра",
    hajjTourServiceHajj: "Қажылық",
    hajjTourAgencyOpenA11y: (name: string) => `${name} — байланыс`,
    halalTitle: "ХАЛАЛ ДАМУ",
    halalRefreshA11y: "Сайтты жаңарту",
    halalHeroTagRegistry: "Ресми тізілім",
    halalHeroTagVerify: "Өнім тексеру",
    halalTabSite: "halaldamu.kz",
    halalTabInstitutions: "Мекемелер",
    halalTabVerify: "Тексеру",
    halalTabMap: "Карта",
    /** @deprecated P1 — halalTabVerify */
    halalTabGoods: "Тексеру",
    halalProductsApiChecking: "Өнім анықтамасы дайындалуда…",
    halalProductsApiEmptyTitle: "Штрихкод бойынша тексеру қалай жұмыс істейді",
    halalProductsApiEmptyBody:
      "Қолданба алдымен өнім атауы/штрихкод анықтамасын қарайды, содан кейін өндірушіні ресми Halal Damu сертификатты ұйымдар тізілімімен салыстырады.",
    halalProductsApiEmptySeed: (count: number) =>
      `Анықтамада ${count} штрихкод бар. Соңғы шешім үшін өнім атауын, құрамын және өндіруші сертификатын қатар тексеріңіз.`,
    halalProductsApiLearnMore: "Толығырақ",
    halalMapTabTitle: "Сертификатты ұйымдар картасы",
    halalMapTabHint: "GPS бойынша жақын маңдағы ұйымдарды картада көріңіз; нүктені басып карточканы ашыңыз.",
    halalMapTabStat: (count: number) => `~${count} мекеме (координаты бар нүктелер)`,
    halalGoodsQuickTitle: "Жылдам іздеу",
    halalGoodsQuickHint: "2+ таңба — нәтиже автоматты жаңарады.",
    halalCheckPhotoShort: "Сурет",
    halalCheckBarcodeShort: "Штрихкод",
    halalGoodsQuickPlaceholder: "Өнім атауын, E‑код, штрихкод енгізіңіз…",
    halalHubShareCompany: "Бөлісу",
    halalHubCopyAddress: "Мекенжайды көшіру",
    halalProductCopyBarcode: "Штрихкодты көшіру",
    halalFavoritesTitle: "Таңдаулылар",
    halalFavoritesEmpty: "Ұйымды карточкадан жұлдызша арқылы сақтаңыз.",
    halalFavoritesRemove: "Таңдаудан алу",
    halalFavoritesAdd: "Таңдауға қосу",
    halalHistoryTitle: "Соңғы іздеулер",
    halalHistoryClear: "Тазалау",
    halalScanResultsTitle: "Соңғы скан нәтижелері (офлайн)",
    halalScanResultsClear: "Тазалау",
    halalScanResultsHint: "Желі жоқ кезде соңғы 20 штрихкод нәтижесін қайта ашу.",
    halalScanResultsOfflineBadge: "кэш",
    halalOpenOnSite: "halaldamu.kz сайтында ашу",
    halalNearbyTitle: "Жақын маңдағы ұйымдар",
    halalNearbyHint:
      "Тек таңдалған радиус ішіндегі нәтижелер (координаты жоқ жазбалар көрсетілмейді). Мешіттер — 2GIS картасынан.",
    halalNearbyLookupLabel: "Іздеу түрі",
    halalNearbyLookupInstitution: "Мекеме",
    halalNearbyLookupProduct: "Өнім",
    halalNearbyLookupMosque: "Мешіт",
    halalNearbyProductTitle: "Халал өнімдер",
    halalNearbyProductHint:
      "halaldamu.kz тізілімінен халал өнімдер. Атау бойынша нақтылауға 2+ таңба енгізіңіз.",
    halalNearbyProductEmpty: "Өнім табылмады — басқа атау немесе «Барлығы» сүзгісін қолданып көріңіз.",
    halalProductProducerFallbackHint:
      "Нақты өнім карточкасы табылмады. Сұрауға сәйкес сертификатты өндірушілер:",
    halalProductProducerFallbackLabel: "Халал сертификатты өндіруші",
    halalProductSeedLabel: "Штрихкод анықтамасы",
    halalProductOfficialLabel: "Ресми өнім жазбасы",
    halalProductProducerCertPrefix: "Өндіруші сертификаты",
    halalProductSeedHint:
      "Бұл жазба өнімді тануға көмектеседі. Соңғы мәртебе үшін өндіруші сертификатын, өнім атауын және құрамын салыстырыңыз.",
    halalNearbyProductSearchPlaceholder: "Өнім атауы (кем дегенде 2 таңба)",
    halalNearbyProductMinHint: "Кемінде 2 таңба енгізіп «Іздеу» батырмасын басыңыз.",
    halalNearbyMosqueTitle: "Жақын маңдағы мешіттер",
    halalNearbyMosqueHint: "2GIS картасынан жақын маңдағы мешіттер.",
    halalNearbyMosqueSearchPlaceholder: "Мешіт атауы немесе мекенжайы",
    halalNearbyMosqueEmpty: "Айналада мешіт табылмады — радиусты ұлғайтып көріңіз.",
    halalNearbyMosqueOpenMap: "2GIS картада ашу",
    halalNearbyMosqueFallbackTitle: "Мешіт",
    halalNearbyMosqueAddressMissing: "Мекенжай көрсетілмеген",
    halalNearbyMosqueImamLabel: "Имам",
    halalNearbyMosqueOpenDataMissing: "Ашық деректе табылмады",
    halalNearbyMosqueWebsiteLabel: "Сайт / әлеуметтік желі",
    halalNearbyMosqueScheduleLabel: "Жұмыс уақыты",
    halalNearbyMosqueSourceLabel: "Дереккөз",
    halalNearbyMosqueInfoFallback: "2GIS каталогындағы мешіт. Имам/телефон бойынша ашық дерек әзір табылмады.",
    halalNearbyMosqueOpen2GisA11y: "2GIS картасын ашу",
    halalNearbyMosqueCallA11y: (phone: string) => `Қоңырау шалу: ${phone}`,
    halalNearbyMosqueSource: (count: number) => `2GIS · ${count} мешіт`,
    halalNearbyCategoryLabel: "Санат",
    halalNearbySearchPlaceholder: "Атау немесе мекенжай бойынша іздеу",
    halalNearbyLoadBtn: "Іздеу",
    halalNearbyLoadingMore: "Қалған нәтижелер жүктелуде…",
    halalNearbyFilterEmpty: "Сүзгі бойынша табылмады.",
    halalNearbyPermDenied: "Орналасу рұқсаты берілмеді — баптаулардан қосыңыз.",
    halalNearbyEmpty: "Айналада табылмады — радиусты ұлғайтып көріңіз.",
    halalNearbyRadiusKm: (km: number) => `${km} км`,
    halalCategoryFood: "Тамақ өнімдері",
    halalCategoryOther: "Басқа",
    halalCategoryCatering: "Тамақтандыру",
    halalCategoryProduction: "Өндіріс",
    halalProductStatusLabel: "Өнім күйі",
    halalProductStatusHint: "Өнім күйі (status):",
    halalProductStatusAll: FILTER_ALL_KK,
    halalProductStatusHalal: "Халал",
    halalProductStatusDoubtful: "Күмәнді",
    halalProductStatusHaram: "Харам",
    halalAdditiveNoDesc: "Толық сипаттама жоқ. Атауды ресми тізіммен салыстырыңыз.",
    halalCatalogTitle: "Мекемелер каталогы",
    halalCatalogLocalTitle: "Жергілікті мекемелер",
    halalCatalogLocalHint:
      "Тек сіздің орналасқан жеріңіздегі сертификатты мекемелер көрсетіледі. Өнімдер «Тексеру» вкладкasında.",
    halalCatalogLocalHintNamed: (city: string) =>
      `${city} және маңайындағы мекемелер. Тізім орналасу немесе мекенжай бойынша сүзіледі.`,
    halalCatalogLocalListTitle: "Жақын маңдағы мекемелер",
    halalCatalogRadiusLabel: "Радиус",
    halalCatalogHint:
      "Ұйымдар тізімі halaldamu.kz ресми дерегінен жүктеледі. Санат сүзгісі қолданбада; «Барлығы» — барлық ұйымдар.",
    halalCatalogLoadingHint:
      "Тізілім жүктелуде (~3700 мекеме). Бірінші ашу 5–15 секунд алуы мүмкін — күтіңіз.",
    halalCatalogFilterEmpty:
      "Осы санат бойынша ұйым табылмады. «Барлығы» таңдаңыз немесе іздеуге 3+ таңба енгізіңіз.",
    halalSyncTitle: "halaldamu.kz — тікелей байланыс",
    halalSyncInProgress: "Сайтпен синхрондау…",
    halalSyncOpenSite: "Ресми сайтты ашу",
    halalSyncLine: (total: number, syncedAt: string | null, fromCache: boolean) => {
      const when = syncedAt
        ? new Date(syncedAt).toLocaleString("kk-KZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "";
      const cache = fromCache ? " · кэш (желі жоқ болса да)" : "";
      return `${total} мекеме${when ? ` · ${when}` : ""}${cache}`;
    },
    halalDamuDisclaimer:
      "Нәтиже ресми тізілімнен алынады; соңғы мәртебе мен сертификат мерзімін өндіруші арқылы растаңыз.",
    halalFilterSectionTitle: "Мекеме сүзгілері",
    halalFilterCertLabel: "Сертификат күйі",
    halalFilterCategoryLabel: "Санат түрі",
    halalFilterAll: FILTER_ALL_KK,
    halalFilterCertActive: "Белсенді",
    halalFilterCertExpired: "Мерзімі өткен",
    halalFilterCertDraft: "Жоба",
    halalSearchPageInfo: (page: number, totalPages: number) => `Бет: ${page} / ${totalPages}`,
    halalLoadMoreResults: "Келесі нәтижелерді жүктеу",
    halalCompanyOpenProducts: "Осы ұйымның өнімдері",
    halalCompanyProductsHeading: "Тізілімдегі өнімдер",
    halalCompanyProductsEmpty: "Бұл ұйым үшін өнім жазбасы табылмады.",
    halalCompanyProductsClear: "Өнімдер блокын жабу",
    halalBody:
      "Деректер ресми Halal Damu тізілімінен қолданба ішінде көрсетіледі. Толық карточканы қажет болса ішкі беттен ашуға болады.",
    halalLocalhostHint:
      "Халал каталогының мекенжайы тек сынақ режиміне қойылған. Release алдында ресми сайт мекенжайын таңдаңыз.",
    /** Ішкі API емес — тек сыртқы сілтеме */
    halalConfigNeedApi:
      "Халал талдау қызметі қосылмаған. Release алдында ресми сайт мекенжайын баптаңыз.",
    halalInstitutionSearchScopeHint:
      "Ұйым іздеу — ресми каталог бойынша. Атау енгізіңіз немесе төмендегі санат сүзгілерін қолданыңыз.",
    halalHubSearchPlaceholder: "Ұйым атауы (кем дегенде 3 таңба)",
    halalHubSearchMinHint: "Іздеу үшін кемінде 3 таңба енгізіңіз.",
    halalInstantSearchHint: "Тізімнен табылған алғашқы нәтижелер — толық іздеу аяқталуда…",
    halalHubRecentTitle: "Соңғы жаңартулар",
    halalHubSearchResults: "Іздеу нәтижесі",
    halalHubEmpty: "Ештеңе табылмады — басқа сөз немесе ресми сайтта толық сүзгі.",
    halalHubLoading: "Жүктелуде…",
    halalHubNetworkErr: "Желі қатесі — қайталаңыз.",
    halalHubDetailTitle: "Ұйым карточкасы",
    halalHubLegalName: "Заңды атауы",
    halalHubAddress: "Мекенжайы",
    halalHubPhone: "Телефон",
    halalHubOpenRoute: "Карта / маршрут",
    halalHubOpen2Gis: "2GIS маршрут",
    halalHubWhatsApp: "WhatsApp",
    halalHubWhatsAppOpen: "WhatsApp арқылы жазу",
    halalHubWebsite: "Сайт",
    halalHubContactsQuick: "Байланыс",
    halalHubGallery: "Фотогалерея",
    halalHubDescription: "Сипаттама",
    halalHubCertNumber: "Сертификат нөмірі",
    halalHubCertIssued: "Берілген күні",
    halalHubCertExpires: "Аяқталуы",
    halalHubLinkOther: "Сілтеме",
    halalHubCert: "Сертификат күйі",
    halalHubMap: "Картада ашу",
    halalMapTitle: "Халал сертификатты ұйымдар (карта)",
    halalMapOpenBtn: "Картада көрсету",
    halalMapLoading:
      "halaldamu.kz толық тізімі жүктелуде — бірінші ашқанда бірнеше секунд немесе минутқа созылуы мүмкін (JSON үлкен).",
    halalMapEmpty:
      "Картаға қойылатын координатасы бар, сертификаты «active» күйіндегі ұйым табылмады (немесе map_link координатасы жоқ).",
    halalMapError: "Карта дерегін жүктеу сәтсіз — желіні тексеріп қайталаңыз.",
    halalMapOpenDetail: "Толығырақ (қолданба)",
    halalMapFooterNote:
      "Карта: OpenStreetMap + halaldamu.kz координаталары. Кластерді басып жақындатыңыз; белгішеде сілтеме арқылы ұйым карточкасын ашыңыз.",
    halalHubClose: "Жабу",
    halalPullRefreshHint:
      "Төмен тартыңыз — каталог, карта және сақталған дерек желіден қайта жаңарады.",
    halalHubClearSearch: "Іздеуді тазалау",
    halalHubCategory: "Санаты",
    halalHubUpdatedAt: "Соңғы жаңарту",
    halalCheckSectionTitle: "Өнімді тексеру",
    halalCheckBarcodeBtn: "Штрихкод / QR (камера)",
    halalCheckTextPlaceholder: "Өнім атауы, құрам, E‑код…",
    halalCheckRun: "Іздеу",
    halalCheckMin2: "Кемінде 2 таңба енгізіңіз.",
    halalCheckPhotoBtn: "Камерамен сурет (мәтінді қолмен)",
    halalCheckPhotoTitle: "Сурет",
    halalCheckPhotoBody:
      "Камерамен түсірген соң платформа AI суретті талдайды; көрінген штрихкод немесе атау бойынша halaldamu.kz дерегі автоматты ізделеді. Нақты халал шешімін өндіруші мен ұстазбен растаңыз.",
    halalPhotoVisionTitle: "Жылдам талдау (сурет)",
    halalPhotoVisionDisclaimer:
      "Бұл құрамдық баға — фиқһтық үкім емес; соңғы мәртебе үшін ресми тізілім мен өндірушіні қараңыз.",
    halalPhotoVisionRegistryLookup:
      "Суреттен өнім белгісі анықталды. Қазір ресми тізілімнен автоматты тексеріліп жатыр.",
    halalPhotoVisionNoProduct:
      "Суреттен анық өнім атауы немесе штрихкод табылмады. Атауын қолмен енгізіп немесе штрихкодты сканерлеп көріңіз.",
    halalPhotoVisionNeedApi:
      "Суретті талдау қызметі уақытша қолжетімсіз. Кейінірек қайталап көріңіз.",
    halalPhotoVisionFail: "Суретті талдау сәтсіз — желіні тексеріп қайталаңыз.",
    halalPhotoReadFail: "Суретті оқу сәтсіз — қайта түсіріп көріңіз.",
    halalPhotoTooLarge: "Сурет тым үлкен — камера сапасын төмендетіп қайталаңыз.",
    halalCheckProducts: "Өнімдер",
    halalCheckAdditives: "Қосымшалар",
    halalCheckCompaniesShort: "Ұйымдар (3+ таңба)",
    halalCheckNoData:
      "Өнім/қосымша табылмады. «Ұйымдар» бөлімінен өндірушіні іздеңіз немесе ресми сайттан толық тексеріңіз.",
    halalCheckOpenOfficial: "halaldamu.kz сайтында іздеу",
    halalVerifySummaryOkTitle: "Тізілімде халал жазба табылды",
    halalVerifySummaryOkBody: (count: number) =>
      `${count} өнім ресми тізілімнен шықты. Сертификат пен дереккөзді төмендегі карточкадан тексеріңіз.`,
    halalVerifySummaryBadTitle: "Күйін қайта тексеру керек",
    halalVerifySummaryBadBody:
      "Нәтижеде жарамсыз немесе мерзімі өткен күй болуы мүмкін. Ресми сайттағы толық карточканы ашып тексеріңіз.",
    halalVerifySummaryAdditiveTitle: "Құрам бойынша белгі табылды",
    halalVerifySummaryAdditiveBody: (count: number) =>
      `${count} қосымша табылды. Бұл автоматты анықтама ғана — нақты өнім сертификатын тізілімнен растаңыз.`,
    halalVerifySummaryCompanyTitle: "Сертификатты ұйым табылды",
    halalVerifySummaryCompanyBody: (count: number) =>
      `${count} ұйым/өндіруші табылды. Нақты өнім тізілімде болмаса, өндіруші сертификатын және өнім атауын салыстырыңыз.`,
    halalScanFlowRegistry: "Ресми тізілімнен автоматты іздеу…",
    halalScanFlowAi: "Сурет талдануда, содан тізілімге автоматты өту…",
    halalScanTitle: "Штрихкодты сканерлеу",
    halalScanHint: "Өнімдегі сызықтық кодты шеңберге түсіріңіз.",
    halalScanWebUnavailable: "Веб нұсқада камерамен сканерлеу жоқ; мәтінді енгізіңіз.",
    halalScanCamPerm: "Камера рұқсаты қажет.",
    halalScanCamPermBtn: "Рұқсат сұрау",
    halalCheckCamPerm: "Камера рұқсаты қажет.",
    /** RAQAT AI хабы — Halal Damu экранымен бір визуал тіл */
    raqatAiTitle: IMAM_AI_BRAND_KK,
    raqatAiLead: IMAM_AI_LEAD_KK,
    raqatAiDisclaimer:
      "Жауап Қазақстандағы дәстүрлі Ханафи мәзһабы, Матуриди ақидасы және ҚМДБ дереккөздері аясында беріледі; фиқһтық үкім емес. Толық мәтінді ресми сайтта оқыңыз.",
    raqatAiSyncTitle: "raqat.kz — платформа API",
    raqatAiSyncOpenSettings: "Баптауларды ашу",
    raqatAiSyncNoApi: "API мекенжайы бапталмаған",
    raqatAiSyncLine: (host: string) => `Байланыс: ${host}`,
    raqatAiMarketingBanner: "Ресми веб-сайт",
    imamAiBrand: IMAM_AI_BRAND_KK,
    imamAiTagline: IMAM_AI_TAGLINE_KK,
    imamAiTitle: IMAM_AI_ASSISTANT_KK,
    imamAiMarketingWebToolbar: "Ресми веб",
    imamAiMarketingWebA11y: "Ресми түсіндіру немесе басты веб бетті қолданба ішінде ашу",
    traditionTitle: "Дін мен дәстүр",
    kurbanAitTitle: "Құрбан айт",
    kurbanAitTopicSub: "Намаз, құрбан, қазақы ізет — толық нұсқаулық",
    kurbanAitIntro:
      "Құрбан айт — жеке нұсқаулық: намаз, құрбандық, қазақы құттықтау, күн жоспары және ресми сайттардан үзінділер. «Дәстүр мен дін» бөліміндегі басқа тақырыптардан бөлек.",
    traditionIntro:
      "Үш бөлім: асыл сөздер → кітаптар → салт-дәстүр тақырыптары. Әр блокты жеке ашып оқыңыз.",
    /** «Дәстүр мен дін» экраны — түймелер, тақырыптар, санат фильтрі */
    traditionGuide: {
      screenTitle: "Дін мен дәстүр",
      screenSubtitle: "Асыл сөздер · кітаптар · 37 тақырып",
      kazakhHeroTagline: "Дәстүрімізді бірге сақтайық",
      kazakhValuesBannerTitle: "Ұлттық құндылықтар",
      kazakhValuesBannerBody:
        "Ақида, ғибадат және әдеп — дін мен дәстүрді өлшейтін үш тірек. Оқулық мазмұны осы бағдармен құрылған.",
      kazakhValuesBannerCta: "Толығырақ",
      kazakhHubAsylSozHint: "Дана авторлар · Абай",
      kazakhHubBooksHint: "Ғибадат · Құран · кітаптар",
      kazakhHubTraditionHint: "37 тақырып · аят/хадис дәлелі",
      disclaimer:
        "Мазмұн оқулық сипатында; медициналық сұрақты дәрігерге, ал діни шешімді білікті ұстаз немесе ресми ұйымдық нұсқаулықпен растаңыз.",
      pillarsTitle: "Үш тірек (дін мен дәстүрді өлшеу)",
      pillarAqida:
        "① Ақида — таухид: қайыр мен жаза түпкілікті Алладан; марқұм, зат, түс немесе сан «өзінен күш» болып қалмасын; ырымды мәдени әдет пен сенімді ажыратыңыз.",
      pillarIbada:
        "② Ғибадат — ось: намаз, ораза, зекет, құрбан отбасында уақыт пен ниетпен бекітілсе, дәстүрдің игі жағы осыға қарай бағытталады.",
      pillarAdab:
        "③ Әдеп — шекара: сөз, ас, киім, қонақ, көрші, жамағатта ұстамдылық; мереке мен қайғыда ысырақсыз, басқа адамның құқығын құрметтеу.",
      pillarRefsNote:
        "Аят пен сүннет сілтемелері оқулық деңгейінде; толық тәпсір, фиқһ және ресми норманы мешіт пен ұстазбен толықтырыңыз.",
      /** Қосымша философиялық түсінік (экранда жинақы түрде жиналған) */
      introMoreShow: "Толығырақ: дін мен дәстүр қалай үйлеседі",
      introMoreHide: "Жию",
      introDetail:
        "Дәстүр — қоғамның ұзақ уақытта сыналған тәжірибесі; шариғат — Алланың пәрмені мен Пайғамбар ﷺ сүннеті. Екеуі адамға, отбасы мен көршіге зиян келтірмейтін жағдайда ғана бірге жүре алады.\n\n" +
        "Бұл экрандағы аят нөмірлері бағыт беру үшін; мәзһабтық ерекшеліктерді ұлттық діни басқарма нұсқауымен растаңыз.",
      /** Экран құрылымы — жоғарыдан төмен оқу реті */
      traditionScreenMapTitle: "Экран қалай құрылған (кіріспе карта)",
      traditionScreenMapBody:
        "① Асыл сөздер — дана авторлар, Абай «Қара сөз».\n" +
        "② Кітаптар — ресми кітапхана, күнделікті құрал және дәстүр нұсқаулықтары.\n" +
        "③ Салт-дәстүр тақырыптары — 37 карточка, іздеу, таңдаулы.\n" +
        "④ Айт жинақ — Ораза айт + Құрбан айт (жеке блок).",
      systemHubTitle: "Жүйелі құрылым",
      systemPracticeTitle: "Салтты түсіну жолы",
      systemPracticeSub:
        "Әр дәстүрді мақсатымен, дінмен үйлесуімен, шариғи шегімен және бүгінгі қолдану қадамымен оқыңыз.",
      catalogReadOrderTitle: "Кітаптар — оқу реті",
      faithShelfIbada: "I. Ғибадат",
      faithShelfIbadaHint: "Намаз уақыты, құбыла, намаз, дұға, тәспі",
      faithShelfQuran: "II. Құран мен оқу",
      faithShelfQuranHint: "Құран, тәжуид, хатим",
      faithShelfIlm: "III. Білім",
      faithShelfIlmHint: "Хадис, сира, қажылық, 99 есім",
      faithShelfTools: "IV. Күнделікті құрал",
      faithShelfToolsHint: "Халал, пәтуа іздеу, сұрақ-жауап",
      traditionShelfGuides: "V. Дәстүр нұсқаулықтары",
      traditionShelfGuidesHint: "37 тақырып — отбасы, қоғам, рәсім, дінмен дәлел",
      traditionEvidenceTitle: "Дәлелдер: аят және хадис",
      traditionEvidenceHint:
        "Салт-дәстүрдің дінмен ұштасатын жағы — Құран аяттары мен сүннеттегі мағыналық бағдармен. Толық фиқһ — ұстазбен.",
      traditionEvidenceDisclaimer:
        "Үзінділер қысқа мағыналық түйін ретінде берілді, толық мәтін/үкім үшін Құран, хадис жинағы және мешіт/мүфтият түсіндірмесін қараңыз.",
      traditionEvidenceMeaningLabel: "Мағыналық түйін",
      traditionEvidenceOpenQuran: "Құранда оқу",
      traditionEvidenceOpenHadith: "Хадисті ашу",
      traditionEvidenceCount: (n: number) => `${n} дәлел · аят/хадис`,
      catalogSectionFaithIbada: "I. Ғибадат",
      catalogSectionFaithQuran: "II. Құран мен оқу",
      catalogSectionFaithIlm: "III. Білім",
      catalogSectionFaithTools: "Күнделікті құрал",
      catalogSectionTradition: "Дәстүр нұсқаулықтары",
      catalogSectionOfficialFatua: "Fatua.kz кітапханасы",
      catalogSectionOfficialMuftyat: "Muftyat.kz кітапханасы",
      /** Іздеу күнделікті жағдайларға сәйкес келгенде */
      searchSituationsTitle: "Күнделікті жағдайлар",
      searchTopicsTitle: "Тақырып карточкалары",
      /** Экран ішінде жылдам секіру */
      anchorBarHint: "Төменгі бөлімге секіру:",
      anchorGoal: "Режім мен профиль",
      anchorDaily: "Күнделікті жағдай",
      anchorWeek: "7 күн жоспары",
      anchorTopics: "Тақырыптар тізімі",
      anchorTop: "Жоғарыға",
      anchorAsylSoz: "Асыл сөздер",
      anchorBooks: "Кітаптар",
      anchorTradition: "Тақырыптар",
      sectionsTitle: "Салт-дәстүр тақырыптары",
      sectionsHint: "Тақырыпты басып ашыңыз; ішінде «қысқаша», «шек», «қадамдар» қалталары. Бір уақытта бір тақырып ашық тұрады.",
      pocketSummary: "Қысқаша",
      sectionIntroTitle: "Кіріспе: үш тірек",
      sectionIntroSubtitle: "Дін мен дәстүр бөлімінің негізі",
      sectionWorksheetTitle: "Жағдайды талдау",
      sectionWorksheetSubtitle: "Мақсат, отбасы, күнделікті жағдай",
      sectionWeekTitle: "7 күн жоспары",
      sectionWeekSubtitle: "Апталық бекіту",
      topicsCount: (n: number) => `${n} тақырып`,
      favoritesOnlyOff: "Таңдаулыны сүзу",
      favoritesOnlyOn: "Тек таңдаулылар",
      favoritesCount: "Таңдаулы саны",
      favoriteAdd: "Таңдаулыға қосу",
      favoriteRemove: "Таңдаулыдан алу",
      personalRouteTitle: "Жеке оқу маршруты",
      personalRouteReady: "Маршрут тақырыптары",
      personalRouteEmpty: "Алдымен кемі 1 тақырыпты таңдаулыға қосыңыз.",
      personalRouteCopy: "Жеке маршрутты көшіру",
      personalRouteCopyDone: "Жеке маршрут көшірілді",
      filterAll: FILTER_ALL_KK,
      filterFamily: "Отбасы",
      filterSocial: "Қоғам",
      filterCeremony: "Рәсім",
      filterFaith: "Дін тәлімі",
      worksheetSectionTitle: "Бір жағдайды талдау",
      worksheetSectionHint:
        "Реті: мақсат режімі → отбасы түрі → күнделікті жағдай (баға, қадамдар, өзін-өзі тексеру).",
      goalModeTitle: "Мақсат режімі",
      familyProfileTitle: "Отбасы профилі",
      dailySituationTitle: "Күнделікті жағдай",
      evaluationLabel: "Бағалау",
      stateGood: "үйлесімді",
      stateWarn: "сақтық",
      stateBad: "қайшы",
      selfCheckTitle: "Өзін-өзі тексеру",
      overallSummary: "Жалпы қорытынды",
      copyPlan: "Жоспарды көшіру",
      copyPlanDone: "Жоспар көшірілді",
      weekSectionTitle: "Апталық бекіту",
      weekPlanTitle: "7 күндік отбасылық жоспар",
      weekPlanIntro:
        "Әр күні бір қадам: күнделікті жағдай мен отбасы профилінен кезектеседі; соңғы күн — жоспарды бекіту.",
      weekReviewDay:
        "Жоспарды бекіту: жоғарыдағы қадамдарды қайта қараңыз; келесі аптаға қажет болса өзгертіңіз.",
      resetWeek: "Аптаны қайта бастау",
      openAll: "Барлығын ашу",
      closeAll: "Барлығын жабу",
      searchPlaceholder:
        "Іздеу: бата, той, құдалық, наурыз, жаназа, беташар, ас, садақа, ұстаз, тоқсан, ғибат, ырым, таухид, түс, сан, дүние заттары…",
      /** Іздеу жолағы (скринридер) */
      searchInputA11y:
        "Тақырып карточкалары мен күнделікті жағдайлар бойынша іздеу. Тақырып атауы, қысқаша сипат немесе жағдай атауымен сүзу.",
      expandShow: "Толығырақ ашу",
      expandHide: "Жасыру",
      deepReligionTitle: "Ұштасуы",
      deepOriginTitle: "Қайдан шықты",
      deepLimitsTitle: "Шариғи шек",
      deepPracticeTitle: "Қолдану қадамдары",
      deepVignettesTitle: "Жағдайлар мен мысалдар (тереңірек)",
      deepClosingTitle: "Түйін",
      emptySearch: "Сәйкес бөлім табылмады.",
      /** Құрбан айт карточкасындағы басты сурет (скринридер) */
      kurbanInfographicA11y:
        "Құрбан айт мереке жоспары: намаз, дұға мен құттықтау, көршілерге айттау, құрбандық шалу, етті үшке бөлу, ысырапсыз дастархан",
      kurbanAit: {
        topicSubtitle: "Намаз, құрбан, қазақы ізет — толық нұсқаулық",
        bannerSubtitle: "Шүкір, құрбан, көрші мен қонақ — қазақи ізетпен",
        sectionsTitle: "Мереке жоспары (алты бағыт)",
        phrasesTitle: "Қазақы құттықтау сөздері",
        phrasesHint: "Қысқа, шынайы сөз — мерекенің жүрегі; мәжбүрлеу немесе мақтан емес.",
        dayPlanTitle: "Күн бойынша жоспар",
        deepOriginTitle: "Қайдан шықты",
        deepReligionTitle: "Ұштасуы",
        deepLimitsTitle: "Шариғи шек",
        deepPracticeTitle: "Толық қадамдар тізімі",
        deepVignettesTitle: "Жағдайлар мен мысалдар",
        deepClosingTitle: "Түйін",
        disclaimer:
          "Намаз уақыты, такбир, құрбан шарттары мен жеке жағдайды мешіт имамы немесе сенімді ұстазбен міндетті түрде растаңыз.",
        officialSnippetsTitle: "Ресми беттерден үзінді",
        officialSnippetsBody:
          "Төмендегі жолдар halaldamu.kz және (қосылған болса) Raqat ресми вебінің ашық бетінен автоматты алынған. Бұл оқулық емес — нақты намаз уақыты, фитр және фиқһ шешімін мешіт пен ұстазбен растаңыз.",
        officialSnippetsLoading: "Ресми сайттардан мәтін жүктелуде…",
        officialSnippetsEmpty:
          "Бұл сайтта айт туралы дайын үзінді табылмады. Төмендегі қолданба нұсқаулығын негізге алыңыз.",
        officialSnippetsNotConfigured:
          "Raqat ресми вебі қолданбада қосылмаған — тек halaldamu.kz синхрондалды.",
        officialSnippetsNetwork: "Желі қатесі — кейін қайта синхрондап көріңіз.",
        officialSnippetsError: "Сайт жауабы алынбады.",
        officialSnippetsCacheNote: "Сақталған дерек (30 мин) — жаңарту: «Кітаптар жинағы» → синхрон белгішесі.",
        officialSnippetsDisclaimer:
          "Үзінділер тек ақпарат үшін; шариғат шешімі — имам, мешіт хабарламасы немесе білікті ұстаз.",
        officialSourceOk: (n: number) => `${n} үзінді табылды`,
        officialSourceNotConfigured: "қосылмаған",
        officialSourceNetwork: "желі қатесі",
        officialSourceEmpty: "айтқа қатысты мәтін жоқ",
        officialSourceError: "қате",
      },
      orazaAit: {
        bannerSubtitle: "Шүкір, намаз, фитр — қазақи ізетпен",
        sectionsTitle: "Мереке жоспары (төрт бағыт)",
        phrasesTitle: "Қазақы құттықтау сөздері",
        phrasesHint: "Қысқа, шынайы сөз; оразды бұзатын ұсынудан сақтану.",
        dayPlanTitle: "Күн бойынша жоспар",
        deepOriginTitle: "Қайдан шықты",
        deepReligionTitle: "Ұштасуы",
        deepLimitsTitle: "Шариғи шек",
        deepPracticeTitle: "Толық қадамдар тізімі",
        deepVignettesTitle: "Жағдайлар мен мысалдар",
        deepClosingTitle: "Түйін",
        disclaimer:
          "Намаз уақыты, фитр мөлшері мен жеке жағдайды мешіт имамы немесе сенімді ұстазбен міндетті түрде растаңыз.",
        officialSnippetsTitle: "Ресми беттерден үзінді",
        officialSnippetsBody:
          "Төмендегі жолдар halaldamu.kz және (қосылған болса) Raqat ресми вебінің ашық бетінен автоматты алынған. Бұл оқулық емес — нақты намаз уақыты, фитр және фиқһ шешімін мешіт пен ұстазбен растаңыз.",
        officialSnippetsLoading: "Ресми сайттардан мәтін жүктелуде…",
        officialSnippetsEmpty:
          "Бұл сайтта айт туралы дайын үзінді табылмады. Төмендегі қолданба нұсқаулығын негізге алыңыз.",
        officialSnippetsNotConfigured:
          "Raqat ресми вебі қолданбада қосылмаған — тек halaldamu.kz синхрондалды.",
        officialSnippetsNetwork: "Желі қатесі — кейін қайта синхрондап көріңіз.",
        officialSnippetsError: "Сайт жауабы алынбады.",
        officialSnippetsCacheNote: "Сақталған дерек (30 мин) — жаңарту: «Кітаптар жинағы» → синхрон белгішесі.",
        officialSnippetsDisclaimer:
          "Үзінділер тек ақпарат үшін; шариғат шешімі — имам, мешіт хабарламасы немесе білікті ұстаз.",
        officialSourceOk: (n: number) => `${n} үзінді табылды`,
        officialSourceNotConfigured: "қосылмаған",
        officialSourceNetwork: "желі қатесі",
        officialSourceEmpty: "айтқа қатысты мәтін жоқ",
        officialSourceError: "қате",
      },
      aitCollectionGuide: {
        title: "Айт жинақ — екі мереке",
        lead: "Ораза айт (айт әл-фитр) және Құрбан айт. Төменде 2 кітап карточкасы; үстінде — ресми сайттардан қысқа үзінді.",
        step1: "Синхрон жолақ: halaldamu.kz және Raqat вебі қосылған ба, қанша үзінді келгенін көріңіз (↻ жаңарту).",
        step2: "«Құрбан айт» — жеке экран; «Ораза айт» — осы жинақтағы карточка. «Нұсқаулықты ашу» — күн жоспары мен құттықтау.",
        step3: "Нақты намаз уақыты, фитр, құрбан шарттары — мешіт хабарламасы мен ұстазбен растаңыз.",
        note: "Интернет болмаса да қолданба нұсқаулығы жұмыс істейді; үзінділер — қосымша көмек.",
      },
      aitSyncTitle: "Айт жинақ — ресми дерек",
      aitSyncSubtitle:
        "halaldamu.kz (халал стандарт) және Raqat ресми вебі — айт, намаз, мереке туралы ашық мәтін.",
      aitSyncInProgress: "Екі сайттан дерек жүктелуде…",
      aitSyncTapRefresh: "↻ белгішесін басыңыз — қайта жүктеу",
      aitSyncOpenHalal: "halaldamu.kz ашу",
      aitSyncOpenRaqat: "Raqat ресми вебін ашу",
      aitSourceOk: (n: number) => `${n} үзінді`,
      aitSourceNotConfigured: "қосылмаған",
      aitSourceNetwork: "желіге қосылмады",
      aitSourceEmpty: "айт мәтіні табылмады",
      aitSourceError: "жүктелмеді",
      aitSyncLine: (snippetCount: number, syncedAt: string | null, fromCache: boolean) => {
        const t = syncedAt
          ? new Date(syncedAt).toLocaleString("kk-KZ", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "әлі жоқ";
        const cache = fromCache ? " · сақталған көшірме" : "";
        if (snippetCount === 0 && !syncedAt) return "Әлі синхрондалмады — белгішені басыңыз";
        return `Барлығы ${snippetCount} үзінді · соңғы жаңарту: ${t}${cache}`;
      },
      bookGroupAit: "Айт жинақ",
      bookOpenAitCta: "Нұсқаулықты ашу",
      greatWordsNavEyebrow: "Асыл сөздер",
      greatWordsNavTitle: "Қазақтың керемет сөздері",
      greatWordsNavSub:
        "Шешейдің ақыл сөздері, сананы ашатын даналық, Абайдың «Қара сөз» толық мәтіні (45 сөз), ұстаздар мен әулиелер рухындағы сөздер.",
      sectionAsylSozTitle: "Асыл сөздер",
      sectionAsylSozSubtitle: "Қазақ дана авторлары · іздеу · Абай «Қара сөз»",
      sectionAsylSozIntro:
        "Дана авторлар сөздері, халық нақылы, Абай «Қара сөз» — жеке жинақ экранында.",
      booksSearchEmpty: "Сүзгі бойынша кітап табылмады.",
      asylSozOpenAllCta: "Барлық сөздерді ашу",
      booksOpenAllCta: "Барлық кітаптарды ашу",
      booksLaunchSub: "Дін оқулықтары · ресми кітаптар · дәстүр",
      aitLaunchSub: "Ораза айт · Құрбан айт",
      greatWordsOpenCollectionCta: "Барлық жинақты ашу",
      sectionBooksTitle: "Кітаптар",
      sectionBooksSubtitle: "Дін оқулықтары · дәстүр нұсқаулығы",
      sectionBooksIntro:
        "Басты бетте тұрған намаз, құран, тәжуид, сира, қажылық және 99 есім мұнда қайталанбайды. Мұнда ресми кітаптар, күнделікті құралдар және дәстүр нұсқаулықтары ғана жинақталған.",
      sectionBooksSearchPlaceholder: "Кітап немесе автор іздеу…",
      sectionTraditionBlockTitle: "Салт-дәстүр тақырыптары",
      sectionTraditionBlockSubtitle: "37 тақырып · іздеу · таңдаулы",
      sectionTraditionBlockIntro:
        "Қазақ дәстүрін дінмен салыстыру: әр тақырып — жеке карточка; ішінде қысқаша, шек, қадамдар.",
      sectionAitTitle: "Айт жинақ",
      sectionAitSubtitle: "Ораза айт · Құрбан айт",
      sectionAitIntro:
        "Екі мереке — жеке нұсқаулық: намаз, фитр/құрбан, қазақы құттықтау, күн жоспары.",
      traditionOpenTopicsCta: "Тақырыптар тізіміне өту",
      collectionsOverviewTitle: "4 топ — каталог картасы",
      collectionsOverviewHowTo:
        "Бұл жерде басты бетте қайталанатын намаз, құран, тәжуид, сира, қажылық және 99 есім карточкалары көрсетілмейді. Қалғаны: Fatua.kz/Muftyat.kz ресми кітаптары және дәстүр нұсқаулықтары. Айт жинақ жеке.",
      collectionsBookCount: (n: number) => (n === 1 ? "1 кітап" : `${n} кітап`),
      bookContentsTitle: "Мазмұны (не бар)",
      bookReligionTitle: "Дінмен байланысы",
      bookHowToReadTitle: "Қалай оқу керек",
      bookOpenCta: "Кітапты ашу",
      bookTapHint: "Карточканы басып — мазмұн мен «Кітапты ашу»",
      booksCount: (n: number) => (n === 1 ? "1 кітап" : `${n} кітап`),
      wisdomBooksCount: (n: number) =>
        `${n === 1 ? "1 кітап" : `${n} кітап`} · дана авторлар`,
      searchBooksTitle: "Кітаптар жинағынан",
      bookGroupWisdom: "Ұлттық даналық",
      bookGroupFaith: "Дін оқулықтары",
      bookGroupTradition: "Дәстүр нұсқаулықтары",
      spiritLiftTitle: "Рух беретін сөз",
      spiritLiftSub: "Басыңыз — жаңа нақыл, қара сөз немесе өсиет",
      spiritLiftButtonA11y: "Рух беретін сөз — нақыл көрсету",
      spiritLiftAnother: "Тағы бір сөз",
      spiritLiftFullRead: "Толығырақ оқу",
      spiritLiftClose: "Жабу",
      spiritLiftModalA11y: "Рухани нақыл терезесі",
    },
    officialFatuaBook: {
      screenTitle: "Fatua.kz кітабы",
      readPdfCta: "Кітапты оқу (PDF)",
      readPdfA11y: "PDF нұсқасын қолданба ішінде ашу",
      openSiteCta: "Fatua.kz сайтында ашу",
      openSiteA11y: "Fatua.kz ресми бетін ашу",
      aboutFallback: "Ресми Fatua.kz кітапханасынан. Толық мәтін PDF түрінде қолжетімді.",
      sourceNote: "Мазмұн — Fatua.kz ресми PDF. Авторлық құқықты сақтаңыз; таратуға рұқсат жоқ.",
      notFound: "Кітап табылмады немесе PDF жоқ.",
    },
    greatWordsGuide: {
      screenTitle: "Қазақтың керемет сөздері",
      disclaimer:
        "Кейбір нақылдардың дәл жолы қолжазба мен басылымда өзгеруі мүмкін; ғылыми жұмыс үшін түпнұсқа нұсқаларға жүгініңіз.",
      editorialNote:
        "Төмендегі ұзын мәтіндер — нақылды толық түсіндіруге арналған оқулық стиліндегі редакциялық еңбек; тарихи тұлғаның түпнұсқа шығармасымен сөзбе-сөз салыстыру үшін ғылыми басылымды пайдаланыңыз.",
      attributionPrefix: "Көз:",
      searchPlaceholder: "Іздеу: автор, нақыл, сөз…",
      searchA11y: "Нақылдар, авторлар және мәтін бойынша іздеу",
      emptySearch: "Сәйкес жол табылмады.",
      statsLine: (authors: number, entries: number) => `${entries} толық сөз · ${authors} автор жинағы`,
      mergedStatsLine: (topics: number, reflective: number) =>
        `${topics} біріктірілген тақырып · ${reflective} сананы ашатын ұзын жазба`,
      mergedTopicsTitle: "Біріктірілген тақырыптар",
      mergedTopicsHint:
        "Аттас және қайталанатын тақырыптар бір жерге жиналды: бір ойды бірнеше тұлғаның мәтінімен салыстырып оқыңыз.",
      reflectiveWritingsTitle: "Сананы ашатын тұлға жазбалары",
      reflectiveWritingsHint:
        "Қысқа нақылмен шектелмей, ойды тереңдететін толық қара сөздер мен тұлға мәтіндерін оқыңыз.",
      topicEntriesSuffix: "жазба",
      mergedEntryCount: (n: number) => `${n} жазба біріктірілді`,
      mergedTopicMeta: (n: number) => `Біріктірілген тақырып · ${n} жазба`,
      authorsSectionTitle: "Авторлар",
      authorsSectionHint: "Авторды таңдаңыз — оның барлық еңбектері тізімделеді.",
      authorWorksTitle: "Еңбектер",
      authorNotFound: "Автор табылмады.",
      entryNotFound: "Мәтін табылмады.",
      worksCount: (n: number) => `${n} еңбек`,
      worksInBook: (n: number) => `Бұл жинақта: ${n} еңбек`,
      authorCardA11y: (name: string, n: number) => `${name}, ${n} еңбек. Тізімді ашу`,
      entryRowA11y: (title: string) => `Ашу: ${title}`,
      searchResultsTitle: "Іздеу нәтижесі",
      searchMoreHint: (total: number) => `Барлығы ${total} нәтиже. Нақтырақ сөз енгізіп, тарылтыңыз (бір экранда 80 жол көрсетіледі).`,
      entryScreenTitle: "Сөз",
      karaSozLabel: (n: number) => `«Қара сөз», ${n}-ші сөз`,
    },
    imamAiBody:
      "Намаз, ораза, Құран, хадис және күнделікті діни сұрақтарға көмек. Жауапты қысқа, түсінікті сұраңыз; фиқһтық даулы мәселелерде ұстазға жүгінуді ұмытпаңыз.",
  },
  hatim: {
    progressTitle: "Хатым прогресі",
    progressCount: "{read} / {total} сүре белгіленді",
    /** {surahTitle} — қазақша атау; {ayah} — осы сүренің ішіндегі аят нөмірі (сүре нөмірі емес) */
    resumeLine: "Соңғы оқу: {surahTitle} · {ayah}-аят",
    continueReading: "Жалғастыру",
    tapAyahHint:
      "Аятқа басыңыз — прогресс сақталады; соңғы аяттан кейін сүре оқылды деп белгіленеді.",
    ayahProgressSaved: "Прогресс сақталды",
    surahCompletedToast: "Сүре оқылып болды — тізімде белгі қойылды",
    guideShow: "Нұсқау: хатым қалай жүзеге асырылады",
    guideHide: "Нұсқауды жасыру",
    guideToggle: "Нұсқауды ашу немесе жасыру",
    markReadA11y: "{title} сүресін оқылды деп белгілеу",
    /** Бисмилля баннерін басқанда оқу экранына өту */
    basmalaOpenReaderA11y:
      "Оқу экранын ашу: соңғы оқу орны немесе келесі белгісіз сүре. Бисмилля жолы.",
    /** Сүре жолы: тізімнен мұсаф оқуға */
    /** Сүре жолы: мұсаф ашу (скринридер). meta — хатым тізімі үшін нөмір мен аят саны */
    openSurahRowA11y: (
      title: string,
      meta?: { surahNumber: number; ayahCount: number },
    ) =>
      meta
        ? `Сүре ${meta.surahNumber}, ${title}, ${meta.ayahCount} аят. Мұсаф оқуын ашу`
        : `${title}. Мұсаф оқуын ашу`,
    reminderTitle: "Күнделікті ескерту",
    reminderHint: "Белгіленген уақытта хатымды жалғастыруды еске саламыз. Намаз хабарламаларын жаңартқанда да қайта қосылады.",
    reminderNotifChannelName: "Хатым оқуы",
    reminderNotifTitle: "Хатым",
    reminderNotifBody: "Бүгінгі оқуды жалғастырыңыз — Құран хатымы.",
    reminderPermNeeded: "Хабарлама рұқсаты қажет. Жүйе баптауларынан қосыңыз.",
    reminderTimeLabel: "Уақыт",
    reminderTimeMinusA11y: "Уақытты 30 минутқа артқа жылжыту",
    reminderTimePlusA11y: "Уақытты 30 минутқа алға жылжыту",
    /** Джуз торы: сүре «оқылды» белгісі джуз ішіндегі сүрелердің қаншасына тарағаны (шамамен) */
    juzProgressTitle: "30 джуз",
    juzProgressHint:
      "Әр ұяшықта осы джузға кіретін сүрелердің қаншасы толық оқылды деп белгіленгені көрсетіледі (бір сүре бірнеше джузға саналуы мүмкін). Ұяшықты басыңыз — тізім сол джуздың басталатын сүре жолына скролл жасайды; мұсаф оқу үшін сол сүре жолын басыңыз.",
    juzOpenA11y: (juz: number) => `Джуз ${juz}: тізімде осы джуздың басталатын сүреге скролл жасау`,
    /** Шапка: сүре/джуз/бет навигациясын ашу */
    juzHeaderBtnA11y: "Джуз және бет бойынша өту",
    /** Шапка: сүре іздеу */
    searchBtnA11y: "Сүре іздеу",
    searchQuickAction: "Сүре іздеу",
    juzQuickAction: "Джуз",
    searchTitle: "Сүре іздеу",
    searchPlaceholder: "Атау немесе нөмір…",
    searchEmpty: "Сүре табылмады",
    searchClearA11y: "Іздеу мәтінін тазалау",
    searchRowA11y: (title: string, meta: string) => `${title}, ${meta}. Тізімде көрсету`,
    navPickerColSurah: "СҮРЕ",
    navPickerColJuz: "ДЖУЗ",
    navPickerColPage: "БЕТ",
    navPickerApply: "Қолдану",
    navPickerCancel: "Болдырмау",
    navPickerSurahLabel: (n: number, title: string) => `${n}. ${title}`,
    navPickerJuzLabel: (n: number) => `${n} джуз`,
    navPickerPageLabel: (n: number) => String(n),
    /** @deprecated eski 30 джуз тор модалы */
    juzSheetTitle: "30 джуз",
    settingsTitle: "Хатым баптаулары",
    settingsSubtitle: "Тема, мұсаф, аудио, ескерту және прогресс.",
    settingsMushaf: "Мұсаф таңдау",
    settingsPlayUntil: "Жүктеу/ойнату шектеуі",
    settingsPlayUntilJuz: "Джуз",
    settingsPlayUntilSurah: "Сүре",
    settingsPlayUntilAyah: "Аят",
    settingsTranslations: "Аудармалар",
    settingsSyncProgress: "Прогресті синхрондау",
    settingsClearProgress: "Прогресті тазалау",
    settingsClearTitle: "Хатым прогресін тазалау?",
    settingsClearBody: "Барлық оқылған сүре белгілері және соңғы оқу орны жойылады.",
    settingsClearConfirm: "Тазалау",
    settingsFootnote: "Мұсаф, қаріп және қари таңдауы — «Құран баптаулары» экранында.",
    settingsBtnA11y: "Хатым баптаулары",
    contextMenuReaderTitle: "Оқу көрінісі",
    contextMenuReaderHint: "Тема, өлшем, қабаттар",
    contextMenuGroupTheme: "Оқу темасы",
    contextMenuGroupScale: "Мұсаф өлшемі",
    contextMenuGroupLayers: "Көрсету қабаттары",
    contextMenuAllSettings: "Толық хатым баптаулары",
  },
  prayer: {
    title: "Намаз уақыттары",
    hint: "Қала мен елді таңдаңыз немесе енгізіңіз, содан жаңартыңыз.",
    sourceMode: "Уақыт көзі",
    sourceCalc: "ҚМДБ ресми",
    sourceMosque: "Қолмен теңестіру",
    mosqueShiftLabel: (min: number) => `Мешіт ығысуы: ${min >= 0 ? `+${min}` : min} мин`,
    mosqueShiftHint:
      "Қазақстан қалалары үшін ҚМДБ ресми кестесі қолданылады. Қажет болса, жергілікті мешіт кестесіне сәйкестеу үшін минут ығысуын қолмен өзгертіңіз.",
    city: "Қала",
    country: "Ел",
    refresh: "Жаңарту",
    fajr: "Таң (фаджр)",
    sunrise: "Күн",
    dhuhr: "Бесін",
    asr: "Екінті",
    maghrib: "Ақшам",
    isha: "Құптан",
    fajrShort: "Таң",
    sunriseShort: "Күн",
    dhuhrShort: "Бесін",
    asrShort: "Екінті",
    maghribShort: "Ақшам",
    ishaShort: "Құптан",
    presets: "Қазақстан қалалары",
    notifications: "Ескертулер",
    notifHint:
      "Ескертулер жүйелік күнтізбемен жоспарланады — қолданба жабық немесе фонда тұрса да уақытында шығуы керек (рұқсат пен «дәл оятқыш»/батарея шектеуін тексеріңіз). Азан қосулы парыз намаз кіргенде толық экран беті ашылып, азан толық ойналады; қажет болмаса қолданушы өзі «Азанды тоқтату» батырмасымен тоқтатады.",
    notifSoundSection: "Намаз хабарламасының дыбысы",
    notifSoundHint:
      "Таңдау жоспарланған хабарламалар мен «уақыт кірді» экранына қолданылады. ▶ арқылы азанды тыңдап көріңіз.",
    /** a11y: ойнату батырмасы — label = таңдау атауы */
    notifSoundPreviewA11y: (label: string) => `${label} — тыңдау`,
    notifSoundAdhanHaramain: "Азан",
    /** Намаз уақыттары экраны: ескертулер жолы */
    timesNotifSoundLineDisabled:
      "Ескертулер өшірулі — намаз уақыты кіргенде хабарлама мен азан шықпайды.",
    timesNotifSoundLineEnabled: (soundLabel: string) =>
      `Ескертулер қосулы — уақыт кіргенде хабарлама шығады. Дыбыс: ${soundLabel}.`,
    timesOpenSoundSettings: "Намаз баптаулары",
    notifSoundOff: "Дыбыссыз",
    iftarHint: "Ақшам (ифтар) уақытында қосымша ескерту",
    enableNotif: "Хабарламаларды қосу",
    iftarExtra: "Ифтар ескертуі (Ақшам)",
    /** Жоспарланған push: тақырып */
    notifPushTitle: "Намаз уақыты",
    azanScreenKicker: "Намаз уақыты кірді",
    azanScreenDefaultLabel: "Намаз",
    azanScreenBody:
      "Азан толық оқылады. Қажет болмаса төмендегі батырмамен өзіңіз тоқтатыңыз.",
    azanTextPanelTitle: "Азан мәтіні",
    azanRepeatTwo: "2 рет",
    azanRepeatFour: "4 рет",
    azanTextBlocks: [
      {
        id: "takbir-open",
        arabic: "اللَّهُ أَكْبَرُ",
        translit: "Аллаһу әкбар",
        meaning: "Алла ұлық.",
        repeat: "4 рет",
      },
      {
        id: "shahada-tawhid",
        arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ",
        translit: "Әшһәду әллә иләһә иллаллаһ",
        meaning: "Алладан басқа құлшылыққа лайық тәңір жоқ екеніне куәлік беремін.",
        repeat: "2 рет",
      },
      {
        id: "shahada-risala",
        arabic: "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
        translit: "Әшһәду әннә Мұхаммәдәр-расулуллаһ",
        meaning: "Мұхаммедтің Алланың елшісі екеніне куәлік беремін.",
        repeat: "2 рет",
      },
      {
        id: "hayya-salah",
        arabic: "حَيَّ عَلَى الصَّلَاةِ",
        translit: "Хәййә 'алас-саләһ",
        meaning: "Намазға асығыңыз.",
        repeat: "2 рет",
      },
      {
        id: "hayya-falah",
        arabic: "حَيَّ عَلَى الْفَلَاحِ",
        translit: "Хәййә 'алал-фәләх",
        meaning: "Құтылуға, игілікке асығыңыз.",
        repeat: "2 рет",
      },
      {
        id: "takbir-close",
        arabic: "اللَّهُ أَكْبَرُ",
        translit: "Аллаһу әкбар",
        meaning: "Алла ұлық.",
        repeat: "2 рет",
      },
      {
        id: "tahlil",
        arabic: "لَا إِلٰهَ إِلَّا اللَّهُ",
        translit: "Лә иләһә иллаллаһ",
        meaning: "Алладан басқа құлшылыққа лайық тәңір жоқ.",
      },
    ],
    fajrAzanTextBlock: {
      id: "fajr-extra",
      arabic: "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ",
      translit: "Әс-салату хайрум-минән-нәум",
      meaning: "Намаз ұйқыдан қайырлы.",
      repeat: "2 рет",
    },
    azanDuaTextBlock: {
      id: "azan-dua",
      arabic:
        "اللَّهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
      translit:
        "Аллаһуммә раббә һәзиһид-да'уатит-тәәммәти уәс-саләтил-қоимә, әәти Мұхаммәдәнил-уәсиләтә уәл-фадиләтә, уәб'асһу мақомәм-махмуданил-ләзи уә'адтәһ, иннәкә лә тухлифул-ми'ад.",
      meaning:
        "Уа, Алла! Осы толық шақырудың және орындалатын намаздың Раббысы! Мұхаммедке уәсилә мен артықшылық бер, әрі Өзің уәде еткен мақтаулы орынға жеткіз. Расында, Сен уәдеңнен таймайсың.",
    },
    azanScreenStop: "Азанды тоқтату",
    azanScreenStopped: "Азан тоқтатылды",
    /** body: намаз атауы + уақыт */
    notifPushBody: (salatLabel: string, time: string) => `${salatLabel}: ${time}`,
    /** Күн шығуы ескертуі */
    notifSunriseBody: (time: string) => `Күн шықты — ${time}`,
    /** Басты бет: дәл осы минутта (қолданба ашық) */
    momentBanner: (salatLabel: string) => `${salatLabel} — уақыт кірді`,
    /** Намаз экраны: 7 күндік жол тақырыбы */
    hijriWeekTitle: "Жақын 7 күн (хижра · григориан)",
    /** Хижра есебі туралы бір жол */
    hijriCalendarNote:
      "Хижра күні — Үмм әл-Қыра аппроксимациясы (күнтізбе көрсетілімі). Төмендегі намаз уақытымен бір локальды күнге сәйкес көрсетіледі.",
    /** Намаз уақыты экраны: hero сурет (скринридер) */
    timesHeroIshaA11y: "Кеш мешіті — безендіру суреті",
    timesHeroKaabaA11y: "Кешкі мешіт, сақина арка және жол — безендіру суреті",
    /** Намаз уақыты экраны — ислам тарихы; `prayerHistoryRotation` тәртібі: дүйсенбі=0 … жексенбі=6 (getDay() Monday-first) */
    prayerHistoryTitle: "Ислам тарихынан",
    /** Тарих карточкасының астындағы бір жолдық мақсат (үйренушіге бағыт) */
    prayerHistorySubtitle:
      "Төменде әр апта күні бөлек тақырып: не болды, не үшін бізге әлі маңызды және осы экрандағы уақыт пен хижра күнтізбесімен қалай сабақтасады — қысқаша, түсінікті тілмен.",
    prayerHistoryRotation: [
      {
        weekday: "Дүйсенбі",
        paragraphs: [
          "Бүгінгі тақырып — хижра (қоныс аудару): мұсылман күнтізбесінің жыл санауы осыдан басталады. 622 жылы (григориан бойынша шамамен) Мұхаммед ﷺ және сахабалар қауымы Мәккедегі қудалаудан сақтанып Мединеге көшті; мұнда жаңа қоғам, мешіт және ортақ іс-шаралар қалыптасты.",
          "Мединада «Мәсжид ан-Набауи» орталық саяси мен рухани өмірдің ядросы болды: жұма, жамаат, кеңес — мұның бәрі кейінгі ғасырлардағы мешіт мәдениетінің үлгісі ретінде сақталды.",
          "Хижра күні экранда көрсетіледі — бұл Үмм әл-Қыра сияқты халықаралық күнтізбе аппроксимациясы; нақты мешіт немесе ұстаз кестесімен сәйкестендіру үшін жергілікті нұсқауды да қараңыз.",
          "Қысқаша мағына: хижра тек «күн санақ» емес — бірлік, қауым және ғибадатты ұйымдастыру тарихы; бүгінгі хижра жолы сол дәстүрдің күнтізбелік еске салуы.",
        ],
      },
      {
        weekday: "Сейсенбі",
        paragraphs: [
          "Бүгінгі тақырып — азан және уақытты қоғамға жария ету. Ислам дәстүрінде Билал ибн Рабах (Алла ол отынымен) Мединеде тұңғыш тұрақты азан айтқан мүәззин ретінде аталады; азан — намаз уақыты жақындағанда жамағатты шақырудың сүннет жолы.",
          "Азанның сөздері Құран мен сүннетке сәйкес қысқа шақыру: Аллаһтың ұлылығы, куәлік және Пайғамбарға шақыру. Әр ғасырда дауыстық стиль мен мешіт ішіндегі рет аймаққа қарай өзгерген, бірақ мазмұны бірдей сақталған.",
          "Үйде оқитындар үшін де азан — уақытты жүрекпен бекіту әдеті; қалада дыбыс аз болса, қолданба мен мешіт кестесі дәл осы «уақыт белгіленді» дәстүрінің жалғасы.",
          "Негізгі ой: намаз уақытын «жеке сағат» емес, қоғамдық рет пен жауапкершілік ретінде көру мәдениеті ғасырлар бойы нығайған.",
        ],
      },
      {
        weekday: "Сәрсенбі",
        paragraphs: [
          "Бүгінгі тақырып — бес уақыт намаздың астрономиялық негізі. Таң (фаджр), бесін (зухр), екінті (аср), ақшам (мағриб), құптан (иша) уақыттары Күн мен Айдың қозғалысына, көлеңке ұзындығына және таңның атуына байланысты есептеледі; Құранда күннің орны мен түні ескеріледі.",
          "Пайғамбар ﷺ дәуірінен бері ғұламалар күн батуы, түннің енуі, екінтіге дейінгі көлеңке сияқты өлшемдерді мәзһабқа қарай түрліше түсіндірген; сондықтан әр елде мешіт кестелері шамалы айырмашылық көрсетуі табиғи.",
          "Қолданба уақыттары — есептелген жақын мәндер; нақты парыз уақытын өз мәзһабыңыз бен мешітіңізбен растаңыз. Бұл — «дәлдік пен дәстүрді бірге ұстау» дегенді білдіреді.",
          "Түсінікті қорытынды: бес уақыт — тек рухани емес, табиғатпен үйлесетін күндік ритм; экрандағы сағаттар сол ритмнің заманауи көмекшісі.",
        ],
      },
      {
        weekday: "Бейсенбі",
        paragraphs: [
          "Бүгінгі тақырып — жұма намазы қоғамдық парыз ретінде қалай бекіді. Мединеде мұсылмандар жұма күні жиналып, хутба тыңдап, жұма намазын бірге оқыған; бұл — бірлік, хабардарлық және білім беру үшін ортақ уақыт белгілеу.",
          "Хутба — уағыз ғана емес, қауымға хәл сұрау, ескерту және тәртіпті түзету сияқты қызметтерді де қамтыған; кейінгі империялар мен қалаларда жұма мешіттері қала өмірінің орталығына айналды.",
          "Әдеп: жұмаға ерте келу, таза киім, қатардағы орынды сақтау, имамға құрмет — бұл жамағаттық ибадаттың тарихи үлгісі.",
          "Бүгінгі кестеде жұма уақытын көрсеңіз, оны жергілікті мешіттің нақты уақытымен салыстыру — жиналу, хутба және кірісу уақытын дәл ұстау үшін ең сенімді жол.",
        ],
      },
      {
        weekday: "Жұма",
        paragraphs: [
          "Бүгінгі тақырып — Қағба және құбыла. Мәккедегі Қағба Ибраһим әлейһиссәләм дәуірінен бері қасиетті орын ретінде құрметтеліп, исламда барлық дүниежүзілік намаз бағыты осы нүктеге қарай бекітілген.",
          "Мешіт салығанда құбыла қабырғасы Қағбаға қарай жоспарланады; саптар түзу тұру — жамағаттың тарихи тәртібі. Саяхатта немесе жаңа жерде құбыла бағытын білу дәстүрлі мәдениеттің жалғасы.",
          "Қазақ жерінде де ғасырлар бойы мешіттер, медреселер және қолжазба кестелер арқылы уақыт пен бағыт сақталған; қазіргі қолданба құбыла экраны — сол дәстүрдің цифрлық көмекшісі.",
          "Ескерту: магниттік солтүстік пен нақты құбыла бұрышы арасында құрылғыға байланысты шамалы қателік болуы мүмкін; маңызды жағдайда мешіт бағытын растаңыз.",
        ],
      },
      {
        weekday: "Сенбі",
        paragraphs: [
          "Бүгінгі тақырып — Рамазан айы: Құран түскен ай ретінде құрметтеледі; ораза — таңнан күн батқанға дейінгі сабыр мен өзін тәртіптеу ғибадаты.",
          "Тарауих және түнгі оқулар тарихта қауымдық бірлік пен Құранды қайта оқу дәстүрін күшейткен; әр үйдің де өз кестесі болуы мүмкін, бірақ ортақ идея — айдың рухани жүктемесін бөлісу.",
          "Ифтар (ақшамнан кейін) мен сәхәр (таң алды) уақыттары күн батуы мен таң атуына байланысты; сондықтан осы экрандағы ақшам мен фаджр уақыттары рамазанда да дәл сол астрономиялық логиканың жалғасы.",
          "Жеке жағдай (ауру, саяхат, жүктілік) бойынша ораза шарттарын әрқашан білікті ұстазбен немесе мәзһаб нұсқауымен келісіңіз — қолданба тек жалпы тарихи сипаттама береді.",
        ],
      },
      {
        weekday: "Жексенбі",
        paragraphs: [
          "Бүгінгі тақырып — сахаба қауымы мен кейінгі ғұлама мектептері. Мединеде сахабалар бір-біріне қолдау көрсетіп, намазда қатар тұрған; көрші мен жамағатқа құрмет — осыдан өрбіген әлеуметтік әдеп.",
          "Кейінгі ғасырларда ханафи, шафи, малики, ханбали сияқты мәзһаб мектептері намаз уақытының шектерін, көлеңке өлшемдерін және жұма тәртібін әртүрліше бекіткен; бұл «бір Құран — түсіндіру жолдары әртүрлі» дегенді білдіреді.",
          "Әр аймақтың климатында күн ұзақтығы өзгереді; сол себепті полярлық аймақтарда ерекше ережелер туралы фиқһ кітаптарында бөлек тақырыптар бар — қолданба орта ендікке жақын есепке сүйенеді.",
          "Практикалық кеңес: қолданба уақыттарын өз мешітіңіздің кестесімен салыстырып, қажет болса минуттық түзету (баптауда) қолданыңыз — бұл тарихтағы «мешітке сәйкес келу» дәстүрінің заманауи түрі.",
        ],
      },
    ],
  },
  quran: {
    listTitle: "Сүрелер",
    /** Құран тізімі: сүре/джуз ауыстырғышы */
    listModeSurahA11y: "Көрініс: сүре бойынша тізім",
    listModeJuzA11y: "Көрініс: джуз бойынша тізім",
    modeSurah: "Сүре",
    modeJuz: "Джуз",
    juzTitle: (n: number) => `Джуз ${n}`,
    juzStartsAtLine: (surahTitle: string, ayah: number) =>
      `Басталуы: ${surahTitle} · ${ayah}-аят`,
    loading: "Сүрелер жүктелуде…",
    listError: "Сүре тізімі алынбады",
    ayahLoading: "Аяттар жүктелуде…",
    ayahError: "Мәтін алынбады",
    bookmarkAdd: "Бетбелгіге",
    bookmarkRemove: "Бетбелгіден алу",
    audioOpen: "Сүре дыбысы (қари, сыртқа)",
    ayahPlaySudaisA11y: (ayah: number) => `Аят ${ayah}: дыбысты ойнату`,
    ayahPauseSudaisA11y: (ayah: number) => `Аят ${ayah}: тыныту`,
    ayahResumeSudaisA11y: (ayah: number) => `Аят ${ayah}: жалғастыру`,
    ayahAudioLoadingAction: "Жүктелуде",
    ayahAudioPauseAction: "Пауза",
    ayahAudioResumeAction: "Жалғастыру",
    ayahAudioError: "Бұл аяттың дыбысы офлайн cache-те жоқ. Интернет қосылғанда бір рет тыңдасаңыз, кейін офлайн ойналады.",
    mushafAyahAudioLoadingLine: (ayah: number) => `${ayah}. аят — дыбыс дайындалып жатыр`,
    mushafAyahAudioPlayingLine: (ayah: number) => `${ayah}. аят ойнатылуда`,
    mushafAyahAudioPausedLine: (ayah: number) => `${ayah}. аят — тынытылған`,
    ayahAudioReciterHint: "▶ Аят дыбысы — таңдалған қари. Бір рет тыңдалған аят офлайн cache-ке сақталады.",
    mushafAssetFallbackNotice:
      "Мұсаф суреті/қарпі жүктелмеді, сондықтан бет оқуды тоқтатпай мәтіндік режимде көрсетілді.",
    ayahs: "аят",
    revelationMeccan: "Мекке",
    revelationMedinan: "Мәдина",
    surahListMetaLine: (place: string, ayahCount: number) => `${place} · ${ayahCount} аят`,
    juzSectionHeader: (n: number) => `ДЖУЗ ${n}`,
    readerHeaderTitle: (surahTitle: string) => `Сүре ${surahTitle}`,
    readerHeaderPageJuz: (page: number, juz: number) => `бет. ${page}, джуз ${juz}`,
    readerHeaderJuzHizb: (juz: number, hizb: number) => `джуз ${juz}, ½ Хизб ${hizb}`,
    hatimInQuranHint: "Құран оқу жоспары — осы бөлімнен",
    continueReadingTitle: "Соңғы оқуға оралу",
    continueReadingSubtitle: (surahTitle: string, ayah: number) => `${surahTitle} · ${ayah}-аят`,
    continueReadingA11y: (surahTitle: string, ayah: number) =>
      `Соңғы оқуға оралу: ${surahTitle}, ${ayah}-аят`,
    readingStreakDays: (days: number) => `Оқу сериясы: ${days} күн`,
    kkApiHint:
      `Толық қазақша мағына платформа дерекқорында толтырылғанда барлық сүре үшін көрінеді. ${APP_BRAND_KK} платформа API қосыңыз; офлайн бандлда әдетте Құран мәтіні ғана.`,
    meaningKk: "Мағына (қазақша)",
    /** Оқылуы: дерекқордағы қазақша транскрипция басым; жоқ болса латын (alquran) немесе автоматты */
    translitCaption: "Оқылуы (транскрипция)",
    /** Сүре оқу экранындағы баптаулар парақшасы (Ayah сияқты оқу қолданбаларына ұқсас) */
    readerSettingsTitle: "Оқу баптаулары",
    readerReadingThemeTitle: "Оқу темасы",
    readerReadingThemeHint:
      "Ақ — ашық бет; Қараңғы — қара фон; Жасыл сия — жасыл Құран мәтіні.",
    readerSettingsA11y: "Оқу баптамаларын ашу",
    readerShowContentTitle: "Көрсету (өзіңіз таңдаңыз)",
    readerShowContentHint:
      "Араб, транскрипция және қазақша мағынаны жеке қосуға немесе өшіруге болады. Кем дегенде бір түрі қосулы тұруы керек.",
    readerShowArabicLabel: "Араб мәтіні",
    readerShowTranslitLabel: "Транскрипция (оқылуы)",
    readerShowMeaningLabel: "Мағына (Ерлан Алимулы аудармасы)",
    readerAllowRotationLabel: "Экранды бұруға рұқсат (ландшафт)",
    /** Хатым мұсаф: жоғарғы панельдегі экран бұру батырмасы (a11y) */
    readerAllowRotationTopA11y:
      "Экранды бұруға рұқсат: қосу немесе өшіру. Өшірулі кезде тек портрет; қосылғанда ландшафтқа ауыса алады.",
    readerAllowRotationHint:
      "Өшірулі кезде оқу экранында тек портрет — телефонды үстелде жатық ұстап оққанда экран қайта-қайта бұрыла қоймайды. Қосқанда телефонды бұрып кең көрініспен оқуға болады.",
    readerAtLeastOneBlock: "Кем дегенде бірін қосып тұрыңыз.",
    readerReciterTitle: "Құран қариы",
    readerReciterHint:
      "Аят сайын дыбыс интернеттен жүктеледі. Экрандағы қазақша мағына — Ерлан Алимулы аудармасы; «Аударма» аудиосы — Халифа Алтай (қазақ) немесе Эльмир Кулиев (орыс) оқылуы; «Араб қарилары» — түпнұсқа тәжуид. Абдурахман Моссадта әзірге ашық source-тағы таңдаулы толық сүрелер ғана бар. Бір нұсқа ойнамаса, басқа қариге ауысып көріңіз.",
    readerReciterGroupKk: "Қазақша аудио (аударма оқылуы)",
    readerReciterGroupRu: "Орысша аударма",
    readerReciterGroupAr: "Араб қарилары (тәжуид)",
    readerArabicFontTitle: "Баспа стилі",
    readerArabicFontHint:
      "Madina (Lateef) — хатым бисмилләсімен бірдей Lateef, қара сия. «Muftyat» — muftyat.kz оқулығы сияқты Lateef + жасыл сия. «Scheherazade» — ірі мұсаф. «Geeza Pro» тек iOS-та.",
    readerArabicScriptTitle: "Құран имла нұсқасы",
    readerArabicScriptHint:
      "Екі цифрлық араб имласы: (1) Мадина · Усмани — quran-uthmani; (2) Unicode — quran-unicode (түрік және халықаралық қолданбаларда кең тараған кодтау). Екеуі де араб қаріпі, тек әріптер мен белгілер әртүрі болуы мүмкін. Тәжуид түстері тек Мадина нұсқасында.",
    readerArabicScriptMadinah: "Мадина · Усмани",
    readerArabicScriptTurkish: "Unicode (түрік кодтауы)",
    /** Жоғарғы жолдағы қысқа белгі */
    readerArabicScriptChipMadinah: "Мадина · Усмани",
    readerArabicScriptChipTurkish: "Unicode · түрік",
    readerArabicScriptBarA11y:
      "Құран имла нұсқасы. Бассаңыз оқу баптамалары ашылады. Жоғарғы «Нұсқа: …» жолын аятқа ұзақ басқанда немесе оқу баптамаларынан көрсетуге болады.",
    readerImlaBarPrefix: "Нұсқа:",
    readerArabicScriptSourcesToggleShow: "Дереккөздер мен имла туралы толығырақ",
    readerArabicScriptSourcesToggleHide: "Жасыру",
    readerArabicScriptSourcesTitle: "Дереккөздер: Мадина және Unicode",
    readerArabicScriptSourcesBody:
      `${APP_BRAND_KK} бір экранда екі араб имласын ұстайды — Усмани (Мадина) мен Unicode (түрік/халықаралық кодтау) — салыстыруға ыңғайлы.\n\n` +
      "1) Мадина · Усмани — api.alquran.cloud, edition: quran-uthmani. Кинг Фахд кешінің сандық Усмани стиліне жақын; тәжуид түстері осы нұсқада (quran-tajweed).\n\n" +
      "2) Unicode · түрік кодтауы — api.alquran.cloud, edition: quran-unicode (Хосни Unicode жинағы). Түрік Құран қолданбалары мен халықаралық цифрлық басылымдарда жиі кездеседі; физикалық мұсафпен әр әріп сәйкес келмеуі мүмкін.\n\n" +
      "Салыстыру үшін мәтіндер NFC/NFKC нормализациясымен жеңілдетіледі — тек көмек, фиқһтық шешім емес. Ұстазбен немесе өз мұсафыңызбен растаңыз.\n\n" +
      "Офлайнда екінші жол тек бұрын желіден кештелген сүре үшін болады; API-only режимінде сыртқы Quran Cloud өшірілгенде бір ғана араб жолы болуы мүмкін.",
    ayahMenuCopyDualArabic: "Көшіру (екі араб нұсқасы)",
    ayahMenuCopyDualArabicA11y: "Мадина және Unicode араб мәтіндерін бір буферге көшіру",
    ayahMenuCopiedDualArabic: "Екі араб нұсқасы көшірілді",
    readerDualArabicCopyMadinahHeader: "Мадина · quran-uthmani",
    readerDualArabicCopyTurkishHeader: "Unicode · quran-unicode",
    readerDualArabicCopyDiffNote: "Нормализациядан кейін (NFKC): екі жолдың символдары әртүрлі.",
    readerDualArabicCopySameNote: "Нормализациядан кейін (NFKC): жолдар бірдей көрінеді (баспа әлі де өзгеше болуы мүмкін).",
    readerMushafScaleTitle: "Мұсаф: араб мәтіні өлшемі",
    readerMushafScaleHint:
      "Хатым кітап көрінісінде арап жолдарының өлшемі. Баптау сақталады — келесі оқуға кіргенде солай қалады.",
    readerNavTitle: "Мұсаф: оқу режимі",
    readerNavScroll: "Тік скролл (барлық аяттар)",
    readerNavPage: "Беттер (солға/оңға)",
    /** Тік скролл мен бет режимінің айырмасы — баптау модалында көрсетіледі */
    readerNavModesHint:
      "Тік скролл: сүредің араб мәтіні бір үздіксіз ағын болып көрінеді; әр аят соңында усмани нөмір. Транскрипция мен қазақша мағына қосулы болса, олар арабтың астында аяттар бойынша бөлек блоктарда тұрады; скроллдағанда төменгі хизб/бет жолы көрінетін аятқа жақындатылады. Беттер: экранды бірнеше аяттан тұратын беттерге бөледі — саусақпен солға/оңға сырғытыңыз; әр бетте де араб мәтіні бір ағын, астында аудармалар. Аят дыбысы ойнағанда қолданба сәйкес бетке және ішіне аятқа скролл жасауға тырысады. Соңғы оқу орны сақталады.",
    readerMushafDensityTitle: "Мұсаф: тығыздық",
    readerMushafDensityHint:
      "Аяттар арасындағы бостық пен араб жол биіктігі (бисмиллә үшін де). Таңдау сақталады.",
    readerMushafDensityTight: "Ықшам",
    readerMushafDensityMedium: "Орташа",
    readerMushafDensityComfort: "Ыңғайлы",
    readerAyahMarkerStyleTitle: "Аят нөмірі стилі",
    readerAyahMarkerStyleHint:
      "Аят нөмірінің көрінісі: дөңгелек мұсаф белгісі немесе классикалық қос шеңбер. Үздіксін араб ағынында нөмір аят соңында көрсетіледі; бетбелгі түсі бар болса, жанында нүкте шығады.",
    readerAyahMarkerRingSvg: "Дөңгелек мұсаф белгісі",
    readerAyahMarkerClassic: "Классикалық шеңбер",
    readerMushafPageEditionTitle: "Мұсаф бет нумерациясы",
    readerMushafPageEditionHint:
      "Бет нөмірі бір ғана Хафс 604 картасымен есептеледі (Мадина King Fahd / KFGQPC және көптеген түрік 604 басылымдары осымен сәйкес келеді). Басқа басылыммен салыстырғанда айырмашылық болуы мүмкін.",
    /** Мұсаф төменгі жолындағы қысқа белгі (Хафс, 604 бет жүйесі) */
    mushafFooterEditionHafs604: "Хафс · 604",
    ayahMenuTitle: (surah: number, ayah: number) => `Сүре ${surah} · аят ${ayah}`,
    ayahMenuPlayUntilJuz: "Ойнату",
    ayahMenuPlayUntilJuzHint: "джуз соңына дейін",
    ayahMenuPlaySelected: "Ойнату",
    ayahMenuPlaySelectedHint: "таңдалған аят",
    ayahMenuRepeat: "Қайталау",
    ayahMenuRepeatHint: "таңдалған аят",
    ayahMenuOpenA11y: (ayah: number) => `Аят ${ayah} — мәзір`,
    ayahMenuHighlight: "Белгілеу",
    ayahMenuHighlightPickColor: "түс таңдау",
    ayahMenuTranslationTafsir: "Аударма / тәфсир",
    ayahTranslationSheetTitle: (surah: number, ayah: number) => `Аударма / тәфсір · ${surah}:${ayah}`,
    ayahTranslationArabic: "Арабша аят",
    ayahTranslationReading: "Оқылуы",
    ayahTranslationMeaning: "Қазақша мағына",
    ayahTranslationTafsir: "Қысқа тәфсір",
    ayahTranslationMissing: "Бұл аяттың қазақша мағынасы әзірге дерекқорда жоқ.",
    ayahTranslationTafsirBody:
      "Бұл бөлім аяттың қазақша мағынасын жеке оқуға ыңғайлап көрсетеді. Діни үкім шығару немесе терең тәпсір үшін ҚМДБ/Муфтият еңбектері мен ұстаз түсіндірмесіне сүйеніңіз.",
    ayahTranslationTafsirPrefix: "Қысқаша түсінік: бұл аяттың негізгі мағынасы",
    ayahTranslationTafsirSuffix:
      "Терең тәпсір, жеке үкім немесе мәзһабтық мәселе үшін ҚМДБ/Муфтият еңбектері мен ұстаз түсіндірмесіне сүйеніңіз.",
    ayahMenuCopyShort: "Көшіру",
    /** Аят мәзіріндегі имла жолы (скринридер) */
    ayahMenuArabicScriptBarA11y:
      "Қолданыстағы Құран имла нұсқасы. Бассаңыз оқу баптамаларының имла бөлімі ашылады.",
    ayahMenuPlay: "Осыдан ойнату",
    ayahMenuCopy: "Көшіру (араб + мағына)",
    ayahMenuCopyWithTranslation: "Көшіру (аударма мен транскрипция)",
    ayahMenuShare: "Бөлісу",
    ayahMenuNote: "Ескертпе…",
    ayahMenuBookmarkColors: "Түсті белгі",
    ayahMenuRemoveMarker: "Белгіні жою",
    ayahMenuCopied: "Көшірілді",
    ayahMenuNotePlaceholder: "Ескертпе мәтіні…",
    ayahMenuSaveNote: "Сақтау",
    ayahMenuCancel: "Болдырмау",
    readerMushafScaleSmallerA11y: "Араб мәтінін кішірейту",
    readerMushafScaleLargerA11y: "Араб мәтінін үлкейту",
    readerMushafScaleValueA11y: (pct: number) => `Масштаб шамамен ${pct} пайыз`,
    readerOpenLegend: "Тәжуид түстерінің анықтамасы",
    readerTajweedExplainShort:
      "Көк/сарғыш — медд, жасыл/күлгін — ғунна/ихфа, қызыл — қалқала, сұр — оқылмайтын әріп. Толық тізім — «Анықтама».",
    tajweedColorHintShort:
      "Көк/сарғыш — медд · жасыл/күлгін — ғунна/ихфа · қызыл — қалқала · сұр — оқылмайды",
    tajweedPanelOn: "Қосу",
    tajweedPanelOff: "Өшіру",
    /** Mushaf «Part N» — оқу қолданбаларындағы джуз нөмірі */
    readerJuzPart: (n: number) => `джуз ${n}`,
    /** Сүре оқу шапкасында джуз жолының оңындағы тізім батырмасы */
    juzPickerListBtnA11y: "Джуздар тізімін ашу",
    juzPickerSheetTitle: "Джуздар",
    /** Хатым мұсаф төменгі жолы (сол бөлігі) */
    mushafFooterHizb: (n: number) => `Хизб ${n}`,
    /** Quran.com хатым футері (латын). */
    mushafFooterHizbQcom: (n: number) => `Hizb ${n}`,
    /** 604 хатым жоғарғы жол — сол жақ (Quran.com: Al-Baqarah). */
    mushafChromeSurahLatin: (name: string) => name,
    /** 604 хатым жоғарғы жол — оң жақ (Quran.com: Part 1). */
    mushafChromePart: (n: number) => `Part ${n}`,
    /** @deprecated ескі UI — mushafChromePart */
    mushafChromeJuz: (n: number) => `Джуз ${n}`,
    mushafChromePage: (n: number) => `Бет ${n}`,
    /** Скринридер: оң жақтағы нөмір — шамамен бет (нақты мұсаф басылымына тәуелді емес) */
    mushafFooterPageA11y:
      "Оң жақтағы сандар — Хафс 604 жүйесі бойынша шамамен бет нөмірі; қолданбадағы нақты баспа мұсафпен бір минуттық айырмашылық болуы мүмкін.",
    /** Сүре тізімінің үстіндегі мушаф стиліндегі бисмилля жолы (скринридер) */
    readerBismillahBannerA11y:
      "Сүре алдындағы бисмиллә — бастау: بسم الله الرحمن الرحيم",
    tajweedModeLabel: "Тәжуид түстері",
    tajweedModeHint:
      "Al Quran Cloud «quran-tajweed» дерегі: ұзарту (медд), ғунна, ихфа, қалқала, тыныш әріптер және т.б. түспен белгіленеді. Хатымда офлайн жинақтан жүктеледі.",
    tajweedLoading: "Тәжуид мәтіні жүктелуде…",
    tajweedLoadFailedHint:
      "Тәжуид мәтіні жүктелмеді. Интернетті тексеріп, жоғарғы тарту арқылы жаңартыңыз.",
    tajweedLegendTitle: "Тәжуид түстері (анықтама)",
    tajweedLegendIntro:
      "Al Quran Cloud «quran-tajweed» — 17 ереже тегі ([h[, [n[, [f[ …). Әр түс бір ережені білдіреді (API tajweed-guide сәйкес). Толық теория — «Тәжуид» бөлімі.",
    tajweedLegendClose: "Жабу",
    tajweedOpenGuide: "Тәжуид оқулығына өту",
    tajweedOpenGuideA11y: "Тәжуид бөлімінде ережелер мен жоспар",
    tajweedSourceNote:
      "Дерек: api.alquran.cloud · quran-tajweed. Фиқһтық даулы оқу үшін ұстазбен растаңыз.",
    apiOnlyRequired:
      `API-only режимі қосулы: бұл бөлім үшін платформа API (${APP_BRAND_KK}) қолжетімді болуы міндетті.`,
  },
  hadith: {
    hub: {
      screenTitle: "Хадистер",
      leadUnified:
        "Хадис — Пайғамбарымыз Мұхаммедтің ﷺ сөзі, ісі және мақұлдаған өнегесі. Бұл бөлім ақпараттық оқу үшін: діни үкім, мәзһабтық қорытынды және жеке жағдай бойынша шешім тек ҚМДБ ұстанатын Ханафи бағыты, ресми дереккөз және білікті ұстаз түсіндірмесімен нақтыланады.",
      boundaryNotice:
        "Шекара анық: хадис — риуаят мәтіні; мақала — түсіндіру; пәтуа — ресми үкім; Құран аудармасы — мағына; AI жауабы — тек дереккөз табуға көмектесетін көмекші, пәтуа емес.",
      offlineSectionTitle: "Офлайн оқу",
      offlineSectionHint: "Телефонда интернетсіз — ҚМДБ мақалаларынан контекст үзінділері және сахих жинақ дереккөздері.",
      kmdmbBadge: "Қазақша",
      kmdmbSub: "Fatua.kz + Muftyat.kz мақалаларынан хадис/риуаят үзінділері",
      sahihBadge: "Араб + дереккөз",
      sahihSub: "Сахих әл-Бұхари және Сахих Муслим — араб түпнұсқа, Sunnah.com сілтемесі",
      sahihCount: (n: number) => `${n.toLocaleString("kk-KZ")} хадис`,
      sahihCountLoading: "Жүктелуде…",
      offlineCtaA11y: "Сахих хадистер офлайн тізімін ашу",
      kmdmbTab: "ҚМДБ үзінділері",
      sahihTab: "Сахих корпус",
      sahihTabHint: "Бухари мен Муслим — ашық дереккөз бойынша офлайн оқу.",
      kmdmbTabA11y: "ҚМДБ үзінділері тізіміне өту",
      sahihTabA11y: "Сахих корпус тізіміне өту",
      sourcesToggleA11y: "Сенімді дереккөздер кестесін ашу немесе жабу",
      sourcesTitle: "Сенімді дереккөздер",
      sourcesHint: "Батырма — ресми сайтта ашу.",
      colSource: "Дереккөз",
      colReliability: "Сенімділік",
      colUsage: "Не үшін қолдануға болады?",
      reliabilityVeryHigh: "Өте жоғары",
      reliabilityHigh: "Жоғары",
      sourceMuftyatUsage: "Ресми негіз, пәтуалар, сенімді аударма",
      sourceIslamUsage: "Хадис жинақтарын (кітаптарды) толық жинақтауға",
      sourceFatuaUsage: "Нақты мәселелер бойынша хадистерді іздеуге",
      sourceMuslimUsage: "Тақырыптық хадистерді іздеуге",
      openSourceA11y: (name: string) => `${name} — ресми сайтта ашу`,
      openUrlError: "Сілтеме ашылмады — интернетті тексеріңіз.",
    },
    muftyatExcerpts: {
      cardTitle: "Fatua.kz + Muftyat.kz",
      cardSub: "ҚМДБ ресми сайттардан хадис/риуаят үзінділері — офлайн",
      cardA11y: "Fatua.kz және Muftyat.kz хадис үзінділері тізімін ашу",
      screenTitle: "ҚМДБ хадис үзінділері",
      lead: "Fatua.kz және Muftyat.kz мақалаларынан алынған хадис/риуаят үзінділері. Контекст пен толық түсіндірме — ресми сілтемеде; жеке үкім ретінде қолданбаңыз.",
      count: (n: number) => `${n.toLocaleString("kk-KZ")} жазба`,
      countBySite: (muftyat: number, fatua: number) =>
        `Muftyat ${muftyat.toLocaleString("kk-KZ")} · Fatua ${fatua.toLocaleString("kk-KZ")}`,
      searchPlaceholder: "Іздеу (тақырып, мәтін)",
      empty: "Ештеңе табылмады",
      sourceBadgeMuftyat: "Muftyat.kz · ҚМДБ",
      sourceBadgeFatua: "Fatua.kz · ҚМДБ",
      textSection: "Мәтін",
      disclaimer:
        "Бұл үзінділер мақала/пәтуа контекстінен алынған. Дәл діни үкім үшін толық мәтін, ҚМДБ ұстанатын Ханафи бағыты және білікті ғалым/имам түсіндірмесіне жүгініңіз.",
      articleExcerptBadge: "Мақала үзіндісі · ресми хадис аудармасы емес",
      openOriginalMuftyat: "Muftyat.kz-та толық мақаланы ашу",
      openOriginalFatua: "Fatua.kz-та толық мәтінді ашу",
    },
    title: "Сахих хадистер",
    /** Тізімнің ең басы — кіріспе батырмасы */
    introTitle: "Кіріспе",
    introBody:
      "Хадистер мұсылманға күнделікті өмірде бағыт береді: адалдық, сабыр, ата-анаға құрмет, көрші ақысы, тазалық, намаз, дұға және жақсы мінез сияқты амалдарды Пайғамбар ﷺ үлгісімен түсіндіреді. Хадисті оқығанда дереккөзін, тақырып контекстін және Қазақстандағы ҚМДБ ұстанатын Ханафи бағытын ескеру маңызды.",
    titleMeaning:
      "«Сахих» — жеткізу тізбегі сенімді хадис. Мұнда Сахих әл-Бұхари және Сахих Муслим деректері берілген; әр хадисте нөмірі, жинағы және дереккөзі көрсетіледі. Бұл пәтуа емес: фиқһтық қорытынды үшін ҚМДБ/Ханафи түсіндірмесіне жүгініңіз.",
    tabBukhari: "Имам Бухари",
    tabMuslim: "Имам Муслим",
    menuTitle: "Хадистер",
    menuSub: "Пайғамбар ﷺ өнегесі · өмірге бағыт",
    detailTitle: "Хадис",
    loading: "Хадистер жүктелуде…",
    empty: "Әзірге хадис жоқ. Қолданбаны қайта іске қосыңыз немесе жаңартыңыз.",
    /** Ағымдағы қойындыда жол жоқ, екіншісінде бар */
    tabEmptyHint: "Бұл жинақта жазба жоқ — жоғарыдағы екінші қойындыны басып көріңіз.",
    notFound: "Хадис табылмады",
    arabic: "Түпнұсқа (арабша)",
    /** Деталь экранындағы қазақша аударма бөлімі */
    translationKk: "Мағына (қазақша)",
    /** Сервердегі text_en — көбіне Sahih International стиліндегі ағылшынша */
    translationEn: "Мағына (ағылшынша)",
    /** fawaz hadith-api rus-bukhari / rus-muslim */
    translationRu: "Мағына (орысша)",
    narrator: "Риуаят еткен",
    provenance: "Түпнұсқа және дәлел",
    /** Хадис деталында — қазақша аударма қай сайттан алынғаны */
    kkSourceTitle: "Дереккөз",
    kkSourceOpenA11y: (name: string) => `${name} — ресми сайтта ашу`,
    sourceOnlyNote:
      "Қазақша аударма осы қолданбада жарияланбайды. Толық мәтін, контекст және Ханафи бағытындағы түсіндіру — төмендегі дереккөз сілтемесінде немесе білікті ұстазда.",
    importBlurb:
      "Офлайн корпус: араб түпнұсқа + дереккөз. Қазақша аударма жарияланбайды.",
    refLabel: "Сілтеме:",
    apiLinked: "Онлайн жаңарту қосулы — толық мәтін жаңарып тұрады.",
    apiOffline: "Онлайн жаңарту қолжетімсіз — офлайн корпус көрсетілуде.",
    apiLinkedShort: "Мәтін онлайн жаңартылды.",
    translationPending:
      "Қазақша мағына әзір жоқ немесе жүктелмеді. Түпнұсқа — жоғарыдағы араб мәтіні.",
    /** Толық экран: мағына бөлімінің үстіндегі қысқа ескерту */
    detailMeaningNote:
      "Мағына/аударма ақпараттық көмек қана; хадистен жеке үкім шығармаңыз. Дәл мағына, контекст және Ханафи мәзһабы бойынша қорытынды үшін араб түпнұсқа, ресми дереккөз және білікті ғалым/имам түсіндірмесіне жүгініңіз.",
    narratorPending: "—",
    /** Тізім басты: қанша жол жүктелгенін көрсету (Муслим бос емес екенін тексеруге) */
    corpusStats: (bukhari: number, muslim: number) =>
      `Жүктелді: Бұхари ${bukhari.toLocaleString("kk-KZ")} · Муслим ${muslim.toLocaleString("kk-KZ")}`,
    modeUnique: "Тек бірегей",
    modeFull: "Толық кітап",
    modeUniqueHint:
      "Бір мәтін кітапта бірнеше тарауда қайталанса, мұнда тек біреуі көрсетіледі (қайталанусыз).",
    modeFullHint: "Барлық жолдар — ғылыми/тарау құрылымымен бірге (қайталанулар қоса).",
    /** Тізім кітап ретімен көрсетіледі */
    letterIndexHint:
      "Хадистер кітап ішіндегі ретімен (№ 1, 2, 3…) және тарау бойынша топталған. Тарау атауы экспорт дереккөзінен.",
    reliabilityTitle: "Сенімділік меткасы",
    sourceBadge: (v: string) => `Дерек: ${v}`,
    gradeBadge: (v: string) => `Дәреже: ${v}`,
    gradeUnknown: "көрсетілмеген",
    gradeDefaultSahih: "сахих жинақ (Бұхари/Муслим)",
    translationBadgeReady: "Қазақша мағына бар",
    translationBadgeMissing: "Қазақша мағына жоқ",
  },
  settings: {
    title: "Баптаулар",
    subtitle: "Көрініс, құбыла, кіру және қолдау. Намаз, Құран және хадис — өз бөлімдерінің баптауларында.",
    prayerSettingsTitle: "Намаз баптаулары",
    prayerSettingsSubtitle: "Қала, уақыт көзі, намаз хабарламалары және азан дыбысы.",
    quranSettingsTitle: "Құран баптаулары",
    quranSettingsSubtitle:
      "Мұсаф, араб қарпі, қари, тәжуид және офлайн дерек — бір экранда. Аударма мен тәфсір аят мәзіріндегі «Аударма / тәфсір» арқылы ашылады.",
    hadithSettingsTitle: "Хадис баптаулары",
    hadithSettingsSubtitle:
      "Тізім көрінісі, әдепкі жинақ, корпус күйі және платформадан жаңарту. Хадис тізіміндегі ⚙️ осы жерге ашылады.",
    quranSectionReading: "Оқу",
    quranSectionReadingSub: "Соңғы оқылған орынды сақтау.",
    quranSectionMushaf: "Мұсаф және навигация",
    quranSectionMushafSub: "Quran.com темасы, тығыздық, бет/скролл, аят белгісі, мәтін өлшемі.",
    quranSectionArabic: "Араб мәтіні",
    quranSectionArabicSub: "Имла нұсқасы (Мадина / Unicode) және қаріп пресеті.",
    quranSectionAudio: "Дыбыс",
    quranSectionAudioSub: "Аят ойнату үшін қари немесе аударма дауысы.",
    quranAudioOfflineTitle: "Құран аудиосын офлайн жүктеу",
    quranAudioOfflineSub:
      "Барлық қарилардың MP3 файлдары фонмен кезекке түседі. Wi‑Fi әдепкі, мобильді интернетті бөлек қосасыз.",
    quranAudioAutoDownload: "Автожүктеу",
    quranAudioAutoDownloadHint: "Қолданба ашылғанда және фондық мүмкіндік болғанда жүктеу жалғасады.",
    quranAudioAllowMobileData: "Мобильді интернетке рұқсат",
    quranAudioAllowMobileDataHint: "Өшірулі болса, тек Wi‑Fi/ethernet арқылы жүктейді.",
    quranAudioStatus: "Күйі",
    quranAudioStatusIdle: "дайын",
    quranAudioStatusRunning: "жүктелуде",
    quranAudioStatusPaused: "тоқтатылды",
    quranAudioStatusBlocked: "күтіп тұр",
    quranAudioStatusComplete: "толық жүктелді",
    quranAudioStatusError: "қате",
    quranAudioProgress: (done: number, total: number, mb: string) => `${done} / ${total} файл · ${mb} МБ`,
    quranAudioCacheStats: (files: number, mb: string) => `Cache: ${files} файл · ${mb} МБ`,
    quranAudioCurrent: (label: string) => `Қазір: ${label}`,
    quranAudioPause: "Пауза",
    quranAudioResume: "Жалғастыру",
    quranAudioClear: "Cache тазалау",
    quranSectionTajweed: "Тәжуид",
    quranSectionTajweedSub: "Түсті тәжуид белгілері және оқулық.",
    quranSectionShortcuts: "Жылдам өту",
    quranSectionShortcutsSub: "Сүрелер, хатым, сақталған орынды тазалау.",
    quranAllowRotation: "Экранды бұруға рұқсат",
    quranAllowRotationHint: "Құран оқу экранында құрылғыны көлденең ұстауға болады.",
    quranReaderInSurahNote:
      "Қосымша: сүре ішіндегі оқу баптамалары (жазбалар, тәжуид легендасы) сол экранның ⚙️ түймесінде де бар.",
    quranListSavedAt: (when: string) => `Соңғы сүре тізімі сақталған уақыт: ${when}`,
    hadithSectionDisplay: "Тізім көрінісі",
    hadithSectionDisplaySub: "Қайталанусыз / толық режим және әдепкі қойынды.",
    hadithSectionCorpus: "Офлайн корпус",
    hadithSectionCorpusSub: "Құрылғыдағы хадис саны және бандлдан қайта жүктеу.",
    hadithSectionShortcuts: "Жылдам өту",
    hadithDefaultTab: "Тізім ашылғанда қойынды",
    hadithIntroExpanded: "Кіріспе блогын ашу",
    hadithIntroExpandedHint: "Хадис тізімінің үстіндегі «Кіріспе» мәтіні әдепкі көрінсін бе.",
    hadithCorpusStatus: "Құрылғыдағы корпус",
    hadithCorpusOther: (n: number) => `Басқа жинақтар: ${n.toLocaleString("kk-KZ")}`,
    hadithReloadBundled: "Бандлдан қайта жүктеу",
    hadithReloadOk: "Корпус жаңартылды.",
    hadithReloadFail: "Жүктеу сәтсіз — қайта көріңіз.",
    hadithClearReseed: "Сақтауды тазалау және қайта сидинг",
    hadithClearReseedOk: "Корпус тазаланды, бандл қайта орнатылды.",
    hadithClearReseedFail: "Тазалау сәтсіз.",
    hadithCorpusMaintenanceHint:
      "Көбіне қажет емес. Тізім бос немесе бүлінген болса ғана «тазалау» қолданыңыз; содан кейін қолданбаны қайта ашуға болады.",
    contentDataOnline: "Онлайн синхрон қосулы",
    contentDataOfflineOnly: "Тек офлайн дерек көрсетіледі",
    contentDataAdvanced: "Қосылу мәліметтері",
    contentSyncSince: "Соңғы синхрон белгісі",
    hadithOpenListSub: "Сахих хадистер тізіміне өту.",
    openHadithList: "Хадис тізімі",
    quranDataSection: "Құран деректері",
    quranDataSectionSub: "Офлайн сүре тізімі және платформадан синхрон.",
    hadithDataSection: "Хадис деректері",
    hadithDataSectionSub: "Офлайн корпус және платформадан синхрон.",
    headerPrayerSettingsA11y: "Намаз баптаулары",
    headerQuranSettingsA11y: "Құран баптаулары",
    headerHadithSettingsA11y: "Хадис баптаулары",
    sectionPlatformAi: `Қызметке қосылу және ${IMAM_AI_BRAND_KK}`,
    sectionPlatformAiSub:
      "Қызмет мекенжайы, байланыс күйі, Fatua/Muftyat индексі және AI күту уақыты.",
    platformApiHint:
      "Мысал: өз HTTPS доменіңізді немесе бекітілген қызмет мекенжайын енгізіңіз. «Сақтау» → «Тексеру».",
    platformApiSave: "Сақтау",
    openImamAi: "Сұрақ-жауап чатына өту",
    accountSectionSub: "Кіру болса — жеке AI тарихы және синхрон.",
    languageSection: "Тіл",
    languageSectionSub: "Мәзір мен навигация қазақ, орыс және ағылшын тілінде жұмыс істейді.",
    languageKk: "Қазақша",
    languageRu: "Русский",
    languageEn: "English",
    sectionAppearance: "Көрініс",
    sectionAppearanceSub: "Фон түсі: 6 жарық және 6 қараңғы. Төменде — акцент палитрасы.",
    sectionLocationPrayer: "Орын және намаз",
    sectionLocationPrayerSub: "Қала, уақыт көзі және намаз кестесі.",
    sectionNotifications: "Хабарламалар",
    sectionNotificationsSub: "Намаз уақыты ескертулері мен дыбыс.",
    sectionQibla: "Құбыла",
    sectionQiblaSub: "Компас жауап беру жылдамдығы (барлық экрандарда).",
    sectionAi: IMAM_AI_BRAND_KK,
    sectionLinks: "Бөлімдер",
    sectionLinksSub: "Telegram, халал, Имам AI және экожүйе.",
    sectionSupport: "Қолдау",
    sectionAdvanced: "Қосымша",
    sectionAdvancedSub: "Қосылу күйі, контент синхроны және офлайн дерек.",
    advancedShow: "Қосымша баптауларды ашу",
    advancedHide: "Жасыру",
    cityPickerTitle: "Қала таңдау",
    cityPickerSearch: "Қала іздеу…",
    cityPickerRecent: "Соңғы таңдаулар",
    cityChange: "Қаланы өзгерту",
    openPrayerTimes: "Намаз уақыты",
    openQuranList: "Құран сүрелері",
    qiblaMotionBalanced: "Теңгерілген",
    qiblaMotionFast: "Жылдам",
    /** Басты экран header оң жақ түйме */
    headerSettingsA11y: "Баптаулар",
    accountLinkPhoneTitle: "Телефон",
    accountLinkPhoneSub:
      "Нөмірді енгізіп «Код алу (SMS)» — хабарламадағы кодты төменгі өріске жазыңыз, содан кейін «Растау және кіру».",
    accountLinkGmailTitle: "Gmail (Google)",
    accountLinkGmailSub:
      "Батырманы басыңыз — Google терезесінде Gmail есебіңізбен кіріңіз (бұл жолда SMS код қолданбада емес).",
    accountLinkIcloudTitle: "iCloud (Apple)",
    accountLinkIcloudSub:
      "Тек iOS: Apple ID / iCloud кіру терезесі ашылады (SMS кодсыз).",
    accountOrPassword: "немесе логин / құпия сөз",
    accountLoginCompactHint: "Gmail, Apple немесе телефон — бір карточкада. Хатым және AI тарихы синхрондалады.",
    accountPhoneExpand: "Телефон (SMS)",
    accountPasswordShort: "логин",
    phoneInvalidHint: "Телефонды E.164 форматында енгізіңіз (мысалы +77001234567).",
    phoneCodeSentHint: "SMS жіберілді — кодты төменге енгізіңіз.",
    phoneNeedCodeHint: "Алдымен «Код алу» батырмасын басыңыз.",
    linksSection: "Сілтемелер",
    theme: "Түс темасы",
    themeBackgroundTitle: "Фон түсі",
    themeBackgroundCompactHint: "Жарық және қараңғы түстер",
    themeBackgroundLightGroup: "Жарық",
    themeBackgroundDarkGroup: "Қараңғы",
    themeSchemeNoir: "Қараңғы",
    themeSchemeForest: "Қою жасыл",
    themeSchemeTeal: "Тиел",
    themeSchemeOcean: "Көк",
    themeSchemeWine: "Қою қызыл",
    themeSchemeMidnight: "Түн",
    themeSchemeLight: "Жарық",
    themeSchemeMeadow: "Жасыл жарық",
    themeSchemeMintDay: "Тиел жарық",
    themeSchemeSky: "Аспан",
    themeSchemeSand: "Құм",
    themeSchemeBlush: "Алма",
    themeDark: "Қараңғы",
    themeLight: "Жарық",
    themeSystem: "Жүйе бойынша",
    colorPaletteTitle: "Акцент түсі",
    colorPaletteHint: "Батырмалар мен белгілер түсі.",
    themePaletteDefault: "Әдепкі",
    themePaletteSapphire: "Көк",
    themePaletteViolet: "Күлгін",
    themePaletteRose: "Қызғылт",
    themePaletteForest: "Жасыл",
    themePaletteEmber: "Қызыл сары",
    themePaletteGold: "Алтын",
    themePaletteIndigo: "Индиго",
    themePaletteMint: "Тиел",
    themePaletteLavender: "Лаванда",
    themePaletteCrimson: "Қанық қызыл",
    themePaletteOcean: "Мұхит",
    themePaletteCoral: "Маралжан",
    themePalettePlum: "Қарақат",
    themePaletteSand: "Құм",
    themePaletteMidnight: "Түн",
    quranReadSection: "Құран оқу",
    quranReadLastPos: "Соңғы орынын сақтау",
    quranReadLastPosHint:
      "Сүре ашылғанда соңғы қараған аятқа скролл жасалады. Оқу орны құрылғыда сақталады; желіден синхрондалмайды.",
    quranReadClear: "Сақталған оқу орнын жою",
    quranReadClearHint: "Барлық сүрелер үшін сақталған аят орны тазартылады.",
    quranMushafDensityTitle: "Мұсаф тығыздығы",
    quranMushafDensityHint:
      "Хатым кітап көрінісіндегі араб жолдары арасы. Құран оқу баптамаларымен бір AsyncStorage кілті — қай экраннан өзгертсеңіз де синхрондалады.",
    quranMushafDensityOption: (id: "tight" | "medium" | "comfort") =>
      id === "tight" ? "Тығыз" : id === "medium" ? "Орташа" : "Жайлы",
    quranReaderInterfaceTitle: "Құран оқу интерфейсі",
    quranReaderInterfaceHint:
      "Сүре/мұсаф экранына кіргенде қолданылады (AsyncStorage; баптамалар синхрондалады).",
    quranReaderNavScrollShort: "Тік скролл",
    quranReaderNavPageShort: "Кітап беттері",
    quranReaderMarkerRing: "SVG сақина",
    quranReaderMarkerClassic: "Классикалық",
    quranReaderMushafPageHint:
      "Бет нөмірі бір ғана Хафс 604 картасымен есептеледі (Мадина King Fahd / KFGQPC және көптеген түрік 604 басылымдары осымен сәйкес келеді).",
    prayerLocationAutoTitle: "Автоматты орын",
    prayerLocationAutoSub: "GPS, Wi‑Fi және интернет арқылы қала, ауа райы мен құбыла жаңартылады.",
    cityTitle: "Негізгі қала",
    androidPrayerWidgetTitle: "Бастапқы экран виджеті (Android)",
    androidPrayerWidgetHint:
      `Үй экранында бос орынға ұзақ басыңыз → «Виджеттер» → ${APP_BRAND_KK} → «Басты бет намаз» (5 намаз қатары, санау, құбыла). Кесте қолданба ашылғанда жаңарады.`,
    notifPermission: "Хабарлама рұқсаты сұралған жоқ немесе берілмеді.",
    notifScheduleEmpty:
      "Намаз уақыты хабарламасы жоспарланбады. Қаланы тексеріңіз. Android 12+ құрылғыда: Параметрлер → Қолданбалар → RAHAT OMIR → «Дәл оятқыштар» рұқсатын қосыңыз; батареяны шектеуден шығарыңыз.",
    notifOpenSystemSettings: "Жүйе баптауларын ашу",
    prayerNotifDiagnosticsTitle: "Хабарлама диагностикасы",
    prayerNotifDiagnosticsHint: "Fresh install қабылдауында рұқсат, channel және жоспарланған намаз санын осы жерден тексеріңіз.",
    prayerNotifDiagnosticsRefresh: "Диагностиканы жаңарту",
    prayerNotifDiagnosticsNoData: "Диагностика әлі жүктелмеді.",
    prayerNotifDiagnosticPermission: "Рұқсат",
    prayerNotifDiagnosticScheduled: "Жоспарланған намаз",
    prayerNotifDiagnosticSound: "Дыбыс",
    prayerNotifDiagnosticChannel: "Android channel",
    prayerNotifDiagnosticMuted: "Дыбысы өшкен намаз",
    prayerNotifAcceptanceTitle: "Телефонда соңғы тексеріс",
    prayerNotifAcceptanceItems: [
      "1. Fresh install → хабарлама рұқсатын беріңіз.",
      "2. Бір намазды қосып/өшіріп, жоспарланған сан өзгергенін тексеріңіз.",
      "3. Android 12+ exact alarm және Android 14+ full-screen intent рұқсаттарын қосыңыз.",
      "4. «Батареяны үнемдеуден босату» — Samsung/Xiaomi-де RAQAT-ты шектеусіз қалдырыңыз.",
      "5. «Locked-screen QA (90 сек)» → экранды құлыптаңыз → азan экраны + дыбыс.",
      "6. Телефонды қайта қосып, channel sound сақталғанын тексеріңіз.",
    ],
    prayerAzanBatteryTitle: "Азан кепілдігі — батарея",
    prayerAzanBatteryHint:
      "Samsung, Xiaomi және басқа Android телефондар азанды «Батареяны үнемдеу» режимінде кешіктіруі мүмкін. RAQAT үшін шектеусіз рұқсат беріңіз.",
    prayerAzanBatterySamsungSteps:
      "Samsung: Баптаулар → Қолданбалар → RAQAT → Батарея → «Шектеусіз» (Unrestricted).",
    prayerAzanBatteryXiaomiSteps:
      "Xiaomi / Redmi / POCO: Баптаулар → Қолданбалар → RAQAT → Батарея → «Шектеу жоқ»; қажет болса «Автозапуск» қосыңыз.",
    prayerAzanOpenBatterySettings: "Батареяны үнемдеуден босату",
    prayerAzanOpenBatterySettingsA11y: "Android батарея үнемдеу баптауын ашу",
    prayerAzanOpenFullScreenSettings: "Full-screen intent баптауын ашу",
    prayerAzanQaSchedule90s: "Locked-screen QA (90 сек)",
    prayerAzanQaScheduling: "Жоспарлануда…",
    prayerAzanQaFailed: "QA азan жоспарланбады — exact alarm/full-screen рұқсаттарын тексеріңіз.",
    platformApi: "Қызметке қосылу",
    platformApiNotConfigured: "Мекенжай қойылмаған — жоғарыдағы нұсқауларды қараңыз.",
    platformApiChecking: "Тексерілуде…",
    platformApiOk: "Қосулы",
    platformApiError: "Қызметке қосыла алмадық (толығырақ жоғарыдағы жолда)",
    platformApiErrorHint:
      "HTTP + IP: release APK үшін `mobile/android/app/src/main/res/xml/network_security_config.xml` ішіне сол хост қосылып қайта жиналады. Эмулятор: API `http://10.0.2.2:8787`. Телефон браузерінен `/health` ашылады ма; HTTPS доменде сертификат пен nginx тексеріңіз.",
    platformApiBrowserCheck: (base: string) =>
      `Телефон браузерінен ашыңыз: ${base}/health — JSON көрінсе желі жақсы; ашылмаса IP немесе cleartext (APK қайта жинау) тексеріңіз.`,
    /** Мобильді интернет / басқа желі үшін нұсқалар */
    platformApiInternetModesHint:
      "Мобильді интернет (4G/5G) немесе басқа Wi‑Fi: 192.168.x сияқты жеке IP жұмыс істемейді.\n\n" +
      "• Нақты сервер / VPS — домен + HTTPS (мысалы https://api.сіздіңдомен.kz), брандмауэрде порт ашық.\n" +
      "• Уақытша туннель (әзірлеу) — ngrok, Cloudflare Tunnel, localtunnel: үйдегі 8787 сыртқа HTTPS URL болып шығады, Баптауларға сол URL жазасыз.\n" +
      "• Сынақ үшін — телефон мен компьютер бір Wi‑Fi-да; сыртқа шыққанда туннель немесе VPS.",
    platformApiProbeTimeout:
      "Қызмет уақытында жауап бермеді. Желі мен VPN күйін тексеріңіз.",
    platformApiProbeNetwork:
      "Желі қатесі — телефон интернетке шыға алмай тұр немесе қызмет мекенжайы қолжетімсіз.",
    platformApiProbeSsl: "SSL/сертификат қатесі — HTTPS доменін немесе сертификаттың жарамдылығын тексеріңіз.",
    platformApiProbeCleartext:
      "HTTP (шифрланбаған) Android release APK-да тыйым салынуы мүмкін — network_security_config қайта жинаңыз немесе HTTPS қолданыңыз.",
    platformApiProbeHttp: (n: number) =>
      n > 0
        ? `Қызмет қате қайтарды (${n}). Мекенжай мен кіру рұқсатын тексеріңіз.`
        : "Қызмет қате қайтарды.",
    platformApiProbeNotJson:
      "Жауап күтілген форматта емес. Қызмет мекенжайы дұрыс қойылғанын тексеріңіз.",
    platformApiProbeUnexpected:
      "Жауап күтпеген форматта. Қызмет нұсқасы жаңартылғанын тексеріңіз.",
    platformApiRefresh: "Қайталау",
    accountSection: "Аккаунт",
    accountUsername: "Логин",
    accountPassword: "Құпия сөз",
    accountLogin: "Кіру",
    accountLogout: "Шығу",
    accountLoginOk: "Кірдіңіз. Хатым прогресі сақталады.",
    accountLoginFail: "Кіру сәтсіз — логин мен құпия сөзді тексеріңіз.",
    accountLoggedInAs: (id: string) => `Кірулі: ${id.slice(0, 8)}…`,
    platformApiVersion: (v: string) => `Нұсқа: ${v}`,
    platformHadithLine: (rows: number, pct: number) =>
      `Хадис: ${rows} жазба · қазақша ${pct}%`,
    platformQuranLine: (rows: number, pct: number) =>
      `Құран: ${rows} жол · қазақша ${pct}%`,
    platformReadyHint: (backend: string) =>
      backend === "postgresql"
        ? "Дерекқор: PostgreSQL (ready)"
        : "Дерекқор: SQLite (ready)",
    platformReadyFail: "Дерекқорға қосылу жоқ (/ready)",
    contentSync: "Контентті синхрондау",
    contentSyncHint:
      "Метадерек (ETag) және инкременттік өзгерістер: Құран кеші мен хадис жаңартылады. Интернет қажет.",
    contentSyncDone: (q: number, h: number) =>
      `Дайын: Құран ${q} аят жаңартылды, хадис ${h} жазба.`,
    contentSyncUnchanged: "Өзгеріс жоқ (304) немесе жаңарту қажет емес.",
    contentSyncError: "Синхрон сәтсіз — API немесе желі.",
    offlineQualityTitle: "Офлайн сапа орталығы",
    offlineQualityHint:
      "Құрылғыдағы контент күйі: пакет толықтығы, соңғы sync белгісі және API қолжетімділігі.",
    offlineQualityApiStatus: "API күйі",
    offlineQualityApiOk: "қосулы",
    offlineQualityApiDown: "жоқ/өшік",
    offlineQualityHadithRows: "Хадис (жол саны)",
    offlineQualityQuranRows: "Құран (сүре саны)",
    offlineQualitySyncState: (since: string | null, etag: string | null) =>
      `Sync: since=${since ?? "—"} · etag=${etag ? `${etag.slice(0, 14)}…` : "—"}`,
    offlineQualitySavedAt: (quranSavedAt: string | null, checkedAt: string | null) =>
      `Құран кэші: ${quranSavedAt ?? "—"} · тексерілгені: ${checkedAt ?? "—"}`,
    offlineQualityRefresh: "Орталықты жаңарту",
    /** Ең астындағы «жобаға үлес» блогы */
    supportProjectTitle: "Жобаға үлес",
    supportProjectBody:
      "Қолданба мен деректерді дамытуға қолдау көрсетуге болады. Төменде шот немесе Telegram сілтемесі көрсетілуі мүмкін (build кезінде қосылады).",
    supportProjectOpen: "Қолдау сілтемесін ашу",
    supportAccountLabel: "Төлем реквизиті (шот)",
    supportAccountCopy: "Көшіру",
    supportAccountCopied: "Көшірілді",
    /** iPhone: Siri / Жарлықтар — қолданба жабық кезде дауыспен ояту үшін бір реттік баптау */
    siriShortcutsTitle: "iPhone: Siri және Жарлықтар",
    siriShortcutsHint:
      "Apple үшінші тарапқа «телефон құлпы тұрғанда әрқашан тыңда» деген Siri сияқты арна бермейді. Қолданба жабық немесе экран өшік кезде дауыспен ашу үшін:\n\n" +
      "1) Төмендегі батырма «Жарлықтар» қолданбасын ашады.\n" +
      `2) + → «Қолданбаны ашу» → ${APP_BRAND_KK} таңдаңыз.\n` +
      "3) Жарлықты сақтаңыз; Siri үшін «Қосу» / Add to Siri деп өз фразаңызды бекітіңіз (мысалы «Имам ай» немесе ескі фразаларыңыз).\n" +
      "4) Содан кейін: «Hey Siri, [сіздің фразаңыз]» — қолданба іске қосылады.\n\n" +
      "Қолданба ішінде барлық бөлімдерді экрандағы түймелер мен меню арқылы басқара аласыз.",
    siriShortcutsOpen: "Жарлықтар қолданбасын ашу",
    siriShortcutsTeaser:
      "Қолданба жабық немесе экран өшік кезде «Hey Siri» арқылы ашу үшін бір рет Жарлық қосыңыз. Толық қадамдар — келесі экранда.",
    siriShortcutsFullGuide: "Толық нұсқау",
    siriShortcutsAndroidNote:
      "Бұл мүмкіндік Apple Siri және «Жарлықтар» қолданбасына байланысты; Android құрылғысында осы экрандағы қадамдар қолданылмайды. Қолданба ішінде дауыспен командалар жоқ — бөлімдерді экрандағы түймелер арқылы ашыңыз.",
    supportAccountDisclaimer:
      "Төлем жасамас бұрын деректерді жоба иесімен тексеріңіз; қолданба тек көрсетеді.",
    aiLongTimeoutsTitle: "AI: ұзақ күту",
    aiLongTimeoutsHint:
      "Қосылғанда AI сұрауларының timeout мерзімі ұзарады (желі баяу немесе үлкен жауап үшін).",
  },
  more: {
    intro: `${APP_BRAND_KK} экожүйесінің бір бөлігі: Құран, дұғалар, баптаулар және Telegram осында.`,
    settings: "Баптаулар",
    settingsSub: "Көрініс, орын, намаз, Құран, құбыла",
  },
  ecosystem: {
    title: `${APP_BRAND_KK} экожүйесі`,
    cardTitle: "Экожүйе",
    cardSub: "Миссия, бағыт, келесі қадамдар",
    mission:
      "Біздің мақсат — пайдалы құралдар және әр дерек үшін түпнұсқа: қай көзден алынғаны, дәлел және сақтау қолданбада көрініп тұруы. Экожүйенің алғашқы терезесі — бұл қолданба.",
    pillarsTitle: "Үш тірек",
    pillar1Title: "Қолданба",
    pillar1Body:
      "Намаз уақыты, құбыла, Құран, дұғалар — күнделікті ібадат пен оқуға қолайлы.",
    pillar2Title: "Дерек және әріптестік",
    pillar2Body:
      "Университеттер мен орталықтардан дерек қосылғанда әр жазбада түпнұсқа мен дәлел болады; метадерек құрылғыда сақталады.",
    pillar3Title: "Ашықтық",
    pillar3Body:
      "Дерек жаңартылуы, лицензия және құпиялылық саясаты анық болады.",
    roadmap:
      "Келесі қадамдар: институттық API, әріптестер тізімі, мазмұн сапасын бақылау — кезең-кезеңімен қосылады.",
    versionLine: (version: string, stage: string) =>
      `Экожүйе нұсқасы ${version} · ${stage}`,
    catalogTitle: "Дерек көздері (бастапқы каталог)",
    catalogHint:
      "Тізімдегі әр жазба үшін: қай көзден алынғаны, дәлел сілтемесі көрсетіледі. Түпнұсқа метадерек қолданбада сақталады.",
    localStoreNote: "Түпнұсқа метадерек (provenance) құрылғыңызда сақталады.",
    provenanceTitle: "Түпнұсқа және дәлел",
    originLabel: "Көз:",
    recordedAtLabel: "Тіркелген:",
    licenseLabel: "Лицензия / шарт:",
    evidenceLabel: "Дәлел:",
    instTypeUniversity: "Университет",
    instTypeResearch: "Зерттеу",
    instTypeMedia: "БАҚ",
    instTypeOpenData: "Ашық дерек",
    instTypeOther: "Басқа",
    howTitle: "Дерек пен дәлелді қалай жинаймыз",
    howIntro:
      "Мақсат — әр дерек үшін қай көзден екені және дәлел бірге жүріп, сіздің экожүйеңізде сақталуы.",
    howSteps: [
      "Көзді тіркеу: атауы, түрі, күні және дәлел сілтемесі бірге сақталады.",
      "Алу: ашық дерек, әріптес берген файл немесе келісілген жүктеме арқылы қосылады.",
      "Тексеру: лицензия, сілтеменің жұмысы және мазмұн сәйкестігі қаралады.",
      "Байлау: әр дерек бумасына қайдан алынғаны, дәлелі және жазылған күні тіркеледі.",
      "Сақтау: қолданбада расталған метадерек пен мазмұн сақталады.",
      "Тарату: жаңарту келгенде қолданба тек расталған деректі көрсетеді.",
    ],
  },
};
