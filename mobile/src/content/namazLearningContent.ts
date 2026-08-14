export type RecitationBlock = {
  id: string;
  label: string;
  arabic: string;
  /** Қазақ әрпімен оқылуы (мысалы: «Аллаһу әкбар»). */
  transliterationKk: string;
  /** Ағылшынша транскрипция (мысалы: «Allahu akbar»). */
  transliterationEn?: string;
  meaningKk: string;
  speakText?: string;
};

export type LearningStep = {
  id: string;
  title: string;
  action: string;
  bodyPositionHint: string;
  genderNoteHanafi?: string;
  recitations: RecitationBlock[];
  commonMistakes: string[];
  checkpoint: string[];
};

export type LearningModule = {
  id: "wudu" | "namaz";
  title: string;
  intro: string;
  steps: LearningStep[];
};

export type ScholarReviewChecklist = {
  madhhab: "hanafi";
  approvedForPublicRelease: boolean;
  reviewerName: string | null;
  reviewedAtIso: string | null;
  checklist: string[];
};

const SUBHANAKA: RecitationBlock = {
  id: "subhanaka",
  label: "Субханака",
  arabic:
    "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلٰهَ غَيْرُكَ",
  transliterationEn:
    "Subhanaka Allahumma wa bi hamdika wa tabarakas-muka wa ta'ala jadduka wa la ilaha ghayruka.",
  transliterationKk:
    "Субханәкаллаһумма уә биһамдика уә табәрәкасмука уә та'алә жаддука уә лә илаһа ғайрук.",
  meaningKk:
    "Аллаһ тағалам, Сен пәксің, мадақ Саған тән. Есімің берекелі, ұлылығың аса биік. Сенен басқа құлшылыққа лайық тәңір жоқ.",
};

const FATIHA: RecitationBlock = {
  id: "fatiha",
  label: "Фатиха сүресі",
  arabic:
    "بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
  transliterationEn:
    "Bismillahi ar-Rahmani ar-Rahim. Alhamdu lillahi Rabbi l-'alamin. Ar-Rahmani ar-Rahim. Maliki yawmi d-din. Iyyaka na'budu wa iyyaka nasta'in. Ihdina as-sirata l-mustaqim. Sirata alladhina an'amta 'alayhim ghayri l-maghdubi 'alayhim wa la d-dallin.",
  transliterationKk:
    "Бисмилләһир-Рахманир-Рахиим. Әлхамду лилләһи раббил-'әләмин. Ар-рахманир-рахиим. Малики йәумид-дин. Иййәкә нә'буду уә иййәкә нәста'ин. Иһдинәс-сыратәл-мүстақиим. Сыратәлләзина ән'амтә 'аләйһим ғайрыл-мағдууби 'аләйһим уә ләд-дәаллин.",
  meaningKk:
    "Барлық мадақ әлемдердің Раббысы Аллаға тән. Тек Саған құлшылық қыламыз, тек Сенен жәрдем тілейміз. Бізді тура жолға сала гөр.",
};

const ATTAHIYYAT: RecitationBlock = {
  id: "attahiyyat",
  label: "Әт-тахият",
  arabic:
    "التَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلٰى عِبَادِ اللّٰهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
  transliterationEn:
    "At-tahiyyatu lillahi wa salawatu wa tayyibat. As-salamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahi as-salihin. Ashhadu an la ilaha illallah wa ashhadu anna Muhammadan 'abduhu wa rasuluh.",
  transliterationKk:
    "Әт-тахийяту лилләһи уәс-сәләуәт уәт-таййибат. Әссәләму 'аләйкә әййухан-набийй уә рахматулләһи уә бәрәкәтуһ. Әссәләму 'аләйна уә 'алә 'ибәдилләһис-сәлиһин. Әшһаду ан лә илаһа илләлләһ, уә әшһаду анна Мұхаммедан 'абдуһу уә расулуһу.",
  meaningKk:
    "Барлық дұға-мадақ, құлшылық пен игі сөздер Аллаға тән. Уа, Пайғамбар, саған Алланың сәлемі, рақымы және берекесі болсын. Бізге және Алланың ізгі құлдарына сәлем болсын.",
};

const SALAWAT_ALLAHUMMA_SALLI: RecitationBlock = {
  id: "salawat-salli",
  label: "Салауат (Аллаһ тағалам, салли)",
  arabic:
    "اللَّهُمَّ صَلِّ عَلٰى مُحَمَّدٍ وَعَلٰى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلٰى إِبْرَاهِيمَ وَعَلٰى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
  transliterationEn:
    "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad, kama sallayta 'ala Ibrahim wa 'ala ali Ibrahim, innaka hamidun majid.",
  transliterationKk:
    "Аллаһумма, салли 'әля Мұхаммадин уә 'әля әли Мұхаммад. Кәма салләйта 'әля Ибраһиим уә 'әля әли Ибраһиим. Иннакә хамидум мәжид.",
  meaningKk:
    "Аллаһ тағалам, Мұхаммедке және оның әулетіне Ибраһим мен оның әулетіне салауат айтқандай салауат айт.",
};

const SALAWAT_ALLAHUMMA_BARIK: RecitationBlock = {
  id: "salawat-barik",
  label: "Салауат (Аллаһ тағалам, барик)",
  arabic:
    "اللَّهُمَّ بَارِكْ عَلٰى مُحَمَّدٍ وَعَلٰى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلٰى إِبْرَاهِيمَ وَعَلٰى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
  transliterationEn:
    "Allahumma barik 'ala Muhammadin wa 'ala ali Muhammad, kama barakta 'ala Ibrahim wa 'ala ali Ibrahim, innaka hamidun majid.",
  transliterationKk:
    "Аллаһумма, бәарик 'әля Мұхаммадин уә 'әля әли Мұхаммад. Кәма бәаракта 'әля Ибраһиим уә 'әля әли Ибраһиим. Иннакә хамидум мәжид.",
  meaningKk:
    "Аллаһ тағалам, Мұхаммедке және оның әулетіне Ибраһим мен оның әулетіне береке бергендей береке бер.",
};

const RABBANA_ATINA: RecitationBlock = {
  id: "rabbana-atina",
  label: "Қорытынды дұға",
  arabic:
    "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْاٰخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
  transliterationEn: "Rabbana atina fi d-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhab an-nar.",
  transliterationKk:
    "Раббана, атина фид-дунйә хасанәтән уә филь-әхирәти хасанәтән уә қина 'азабән-нар",
  meaningKk:
    "Раббымыз, бізге дүниеде де, ақыретте де жақсылық бер және тозақ азабынан сақта.",
};

export const NAMAZ_WUDU_LEARNING_MODULES: LearningModule[] = [
  {
    id: "wudu",
    title: "Дәрет (ханафи, бастауыш)",
    intro:
      "Бұл бөлім намазға дайындық ретінде дәретті нөлден үйретеді: парыздары, сүннеттері, тәртібі, жиі қателері және тексеру.",
    steps: [
      {
        id: "wudu-1-intent",
        title: "Ниет және Бисмиллә",
        action: "Дәрет алуға жүрекпен ниет етіңіз, «Бисмиллә» айтыңыз.",
        bodyPositionHint: "Суды ысырап етпей, таза жерде тұру.",
        recitations: [
          {
            id: "wudu-bismillah",
            label: "Бастау сөзі",
            arabic: "بِسْمِ اللَّهِ",
            transliterationKk: "Бисмилләһ",
            meaningKk: "Алланың атымен бастаймын.",
          },
        ],
        commonMistakes: ["Ниетті тілмен айту міндет деп ойлау.", "Суды шамадан тыс көп қолдану."],
        checkpoint: ["Ниет еттім.", "Бисмиллә айттым.", "Суды үнемдедім."],
      },
      {
        id: "wudu-2-wash-fard",
        title: "Парыз мүшелерді жуу",
        action: "Бет, екі қол (шынтақпен), басқа мәсіх, екі аяқ (тобықпен) ретімен орындалады.",
        bodyPositionHint: "Су әр парыз мүшеге толық жетуін қадағалау.",
        recitations: [],
        commonMistakes: ["Саусақ араларын өткізбей кету.", "Бастың аз бөлігіне мәсіх жасауды ұмыту."],
        checkpoint: [
          "Бет толық жуылды.",
          "Екі қол шынтақпен жуылды.",
          "Басқа мәсіх жасалды.",
          "Екі аяқ тобықпен жуылды.",
        ],
      },
      {
        id: "wudu-3-sunnah-completion",
        title: "Сүннет толықтыру және дұға",
        action: "Ауыз-мұрын шаю, ретті сақтау, соңында шәһадат дұғасы.",
        bodyPositionHint: "Үш рет жуу - сүннет, кемі бір рет парызды атқару керек.",
        recitations: [
          {
            id: "wudu-dua",
            label: "Дәреттен кейінгі дұға",
            arabic:
              "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
            transliterationKk:
              "Ашһаду ан лә илаһа илләлләһу уахдаһу лә шарика лаһу, уә ашһаду анна Мұхаммедан 'абдуһу уә расулуһу",
            meaningKk: "Алладан басқа құлшылыққа лайық тәңір жоқ, Мұхаммед - Оның құлы әрі елшісі.",
          },
        ],
        commonMistakes: ["Дәрет бұзатын амалдарды білмеу.", "Келесі намазға дейін тазалықты сақтамау."],
        checkpoint: ["Сүннет амалдарды орындадым.", "Дәрет дұғасын оқыдым.", "Дәрет бұзатындарды білемін."],
      },
    ],
  },
  {
    id: "namaz",
    title: "Намаз (ханафи, бастауыш)",
    intro:
      "Бұл бөлім ниеттен сәлемге дейін бірізді жүргізеді. Әр қадамда әрекет, оқылатын мәтін, транскрипция, мағына және қателер беріледі.",
    steps: [
      {
        id: "namaz-1-niyyah-takbir",
        title: "Ниет және алғашқы тәкбір",
        action: "Құбылаға қарап тұрып, намазға кіріңіз: қолды көтеріп «Аллаһу әкбар» деңіз.",
        bodyPositionHint: "Ер адам қолын құлақ деңгейіне, әйел иық тұсына дейін көтереді.",
        genderNoteHanafi: "Ханафиде әйелдің қимылы жинақы болады.",
        recitations: [
          {
            id: "takbir",
            label: "Тәкбір тахрима",
            arabic: "اللَّهُ أَكْبَرُ",
            transliterationEn: "Allahu akbar.",
            transliterationKk: "Аллаһу әкбар",
            meaningKk: "Алла - Ұлы.",
          },
        ],
        commonMistakes: [
          "Ниетті тек тілмен айтып, жүрекпен бекітпеу.",
          "Тәкбірді намаздан тыс күйде айту.",
        ],
        checkpoint: ["Ниет еттім.", "Алғашқы тәкбірмен намазға кірдім."],
      },
      {
        id: "namaz-2-qiyam",
        title: "Қиямда оқу (толық)",
        action: "Қолды байлап тік тұрып, Субханака, Фатиха және қысқа сүре оқыңыз.",
        bodyPositionHint: "Көз сәжде орнына бағытталады.",
        recitations: [SUBHANAKA, FATIHA],
        commonMistakes: ["Фатиханы асығыс оқу.", "Әріптерді бұзып оқу."],
        checkpoint: ["Субханака оқылды.", "Фатиха оқылды.", "Қосымша сүре оқылды."],
      },
      {
        id: "namaz-3-ruku",
        title: "Рүкуғ және рүкуғтан көтерілу",
        action: "Белді түзу ұстап иіліп, зікір айтыңыз. Кейін тік тұрыңыз.",
        bodyPositionHint: "Арқа түзу, алақандар тізеде, шынтақ сәл ашық.",
        recitations: [
          {
            id: "ruku-zikr",
            label: "Рүкуғ зікірі",
            arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
            transliterationEn: "Subhana rabbiyal-'azim.",
            transliterationKk: "Субханә раббиял-'әзим",
            meaningKk: "Ұлы Раббым пәк.",
          },
          {
            id: "samiallah",
            label: "Рүкуғтан тұрған кезде",
            arabic: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ",
            transliterationEn: "Sami' Allahu liman hamidah.",
            transliterationKk: "Сами'аллаһу лимән хамидәһ",
            meaningKk: "Алла Өзін мадақтағанды естиді.",
          },
          {
            id: "rabbana-lakal-hamd",
            label: "Тік тұрғандағы жауап",
            arabic: "رَبَّنَا لَكَ الْحَمْدُ",
            transliterationEn: "Rabbana wa lakal-hamd.",
            transliterationKk: "Раббана, ләкәл-хамд",
            meaningKk: "Раббымыз, барлық мадақ Саған тән.",
          },
        ],
        commonMistakes: ["Рүкуғта толық тынышталмау.", "Зікірді ұмыту."],
        checkpoint: ["Рүкуғ орындалды.", "Рүкуғ зікірі айтылды.", "Тік тұрып дұға айтылды."],
      },
      {
        id: "namaz-4-sujud",
        title: "Сәжде және екі сәжде арасы",
        action: "Екі рет сәжде жасап, арада отырып истиғфар айтыңыз.",
        bodyPositionHint: "Жеті мүше сәждеге тиюі керек.",
        recitations: [
          {
            id: "sujud-zikr",
            label: "Сәжде зікірі",
            arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
            transliterationEn: "Subhana rabbiyal-a'la.",
            transliterationKk: "Субханә раббиял-а'лә",
            meaningKk: "Ең Жоғары Раббым пәк.",
          },
          {
            id: "rabbighfirli",
            label: "Екі сәжде арасындағы дұға",
            arabic: "رَبِّ اغْفِرْ لِي",
            transliterationEn: "Rabb ighfir li.",
            transliterationKk: "Раббиғфир ли",
            meaningKk: "Раббым, мені кешір.",
          },
        ],
        commonMistakes: ["Сәждеде шынтақты жерге жайып жіберу.", "Тыныштық (туманина) сақтамау."],
        checkpoint: ["Екі сәжде орындалды.", "Арада отырыс жасалды."],
      },
      {
        id: "namaz-5-final-sitting",
        title: "Соңғы отырыс: Әт-тахият, салауат, дұға",
        action: "Соңғы отырыста толық ташаххуд, екі салауат және қорытынды дұға оқыңыз.",
        bodyPositionHint: "Отырыста тыныш қалып, мәтінді асықпай оқу.",
        recitations: [ATTAHIYYAT, SALAWAT_ALLAHUMMA_SALLI, SALAWAT_ALLAHUMMA_BARIK, RABBANA_ATINA],
        commonMistakes: ["Салауатты қысқартып тастау.", "Дұғаны мүлде оқымау."],
        checkpoint: ["Әт-тахият толық оқылды.", "Салауат толық оқылды.", "Қорытынды дұға оқылды."],
      },
      {
        id: "namaz-6-salam-end",
        title: "Сәлеммен аяқтау",
        action: "Оңға және солға қарап сәлем беріп намазды аяқтаңыз.",
        bodyPositionHint: "Әр сәлемде бас айқын бұрылады.",
        recitations: [
          {
            id: "salam",
            label: "Сәлем",
            arabic: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",
            transliterationEn: "As-salamu 'alaykum wa rahmatullah.",
            transliterationKk: "Әссәләму 'аләйкум уә рахматулләһ",
            meaningKk: "Сіздерге Алланың сәлемі мен рақымы болсын.",
          },
        ],
        commonMistakes: ["Екінші сәлемді тастап кету.", "Сөздерді бұрмалау."],
        checkpoint: ["Оңға сәлем берілді.", "Солға сәлем берілді.", "Намаз аяқталды."],
      },
    ],
  },
];

const NAMAZ_LEARNING_MODULE = NAMAZ_WUDU_LEARNING_MODULES.find((m) => m.id === "namaz")!;

/** Намаз нұсқауындағы сурет карточкасының `title` → оқулық `LearningStep.id` тізімі. */
export const NAMAZ_GUIDE_POSE_TITLE_TO_LEARNING_STEP_IDS: Record<string, string[]> = {
  "Ниет және алғашқы тәкбір": ["namaz-1-niyyah-takbir"],
  "Қиям": ["namaz-2-qiyam"],
  "Рукуғ": ["namaz-3-ruku"],
  "Сәжде": ["namaz-4-sujud"],
  "Соңғы отырыс": ["namaz-5-final-sitting", "namaz-6-salam-end"],
  "Аралық отырыс": ["namaz-5-final-sitting"],
  "Соңғы отырыс және сәлем": ["namaz-5-final-sitting", "namaz-6-salam-end"],
};

export function getNamazRecitationBlocksForGuidePose(poseTitle: string): RecitationBlock[] {
  const ids = NAMAZ_GUIDE_POSE_TITLE_TO_LEARNING_STEP_IDS[poseTitle];
  if (!ids?.length) return [];
  return ids.flatMap((id) => NAMAZ_LEARNING_MODULE.steps.find((s) => s.id === id)?.recitations ?? []);
}

export function getNamazLearningHintsForGuidePose(poseTitle: string): {
  actions: string[];
  hints: string[];
  genderNote?: string;
} | null {
  const ids = NAMAZ_GUIDE_POSE_TITLE_TO_LEARNING_STEP_IDS[poseTitle];
  if (!ids?.length) return null;
  const steps = ids
    .map((id) => NAMAZ_LEARNING_MODULE.steps.find((s) => s.id === id))
    .filter((s): s is LearningStep => !!s);
  if (!steps.length) return null;
  return {
    actions: steps.map((s) => s.action),
    hints: steps.map((s) => s.bodyPositionHint).filter(Boolean),
    genderNote: steps.map((s) => s.genderNoteHanafi).find(Boolean),
  };
}

export const NAMAZ_CONTENT_REVIEW: ScholarReviewChecklist = {
  madhhab: "hanafi",
  approvedForPublicRelease: false,
  reviewerName: null,
  reviewedAtIso: null,
  checklist: [
    "Дәрет парыз/сүннет тізімі Ханафи фиқһымен салыстырылды.",
    "Намаз қадамдарының реті имаммен тексерілді.",
    "Қиям, Әт-тахият, салауат мәтіні толық оқылыммен расталды.",
    "Транскрипция мен мағына тілдік редакциядан өтті.",
    "Ер/әйел ескертпелері жергілікті ұстаз нұсқауымен бекітілді.",
  ],
};
