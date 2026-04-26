export type RecitationBlock = {
  id: string;
  label: string;
  arabic: string;
  transliterationKk: string;
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
  transliterationKk:
    "Subhanakallohumma wa bihamdika wa tabaarokasmuka wa ta'aalaa jadduka wa laa ilaaha ghoyruk.",
  meaningKk:
    "Уа, Алла, Сен пәксің, мадақ Саған тән. Есімің берекелі, ұлылығың аса биік. Сенен басқа құлшылыққа лайық тәңір жоқ.",
};

const FATIHA: RecitationBlock = {
  id: "fatiha",
  label: "Фатиха сүресі",
  arabic:
    "بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
  transliterationKk:
    "Bismillaahir-Rohmaanir-Rohiim... Alhamdu lillaahi rabbil-'aalamiin... Ar-rohmaanir-rohiim... Maaliki yawmid-diin... Iyyaaka na'budu wa iyyaaka nasta'iin... Ihdinas-sirootal-mustaqiim... Sirootal-laziina an'amta 'alayhim ghoyril-maghduubi 'alayhim wa lad-dooolliin.",
  meaningKk:
    "Барлық мадақ әлемдердің Раббысы Аллаға тән. Тек Саған құлшылық қыламыз, тек Сенен жәрдем тілейміз. Бізді тура жолға сала гөр.",
};

const ATTAHIYYAT: RecitationBlock = {
  id: "attahiyyat",
  label: "Әт-тахият",
  arabic:
    "التَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلٰى عِبَادِ اللّٰهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
  transliterationKk:
    "Attahiyyaatu lillaahi was-solawaatu wat-toyyibaat. Assalaamu 'alayka ayyuhan-nabiyyu wa rohmatulloohi wa barokaatuh. Assalaamu 'alaynaa wa 'alaa 'ibaadillahis-soolihiin. Ashhadu an laa ilaaha illalloh wa ashhadu anna Muhammadan 'abduhu wa rosuuluh.",
  meaningKk:
    "Барлық дұға-мадақ, құлшылық пен игі сөздер Аллаға тән. Уа, Пайғамбар, саған Алланың сәлемі, рақымы және берекесі болсын. Бізге және Алланың ізгі құлдарына сәлем болсын.",
};

const SALAWAT_ALLAHUMMA_SALLI: RecitationBlock = {
  id: "salawat-salli",
  label: "Салауат (Аллаһумма салли)",
  arabic:
    "اللَّهُمَّ صَلِّ عَلٰى مُحَمَّدٍ وَعَلٰى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلٰى إِبْرَاهِيمَ وَعَلٰى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
  transliterationKk:
    "Alloohumma solli 'alaa Muhammadin wa 'alaa aali Muhammad. Kamaa sollayta 'alaa Ibroohiima wa 'alaa aali Ibroohiim. Innaka hamiidum majiid.",
  meaningKk:
    "Уа, Алла, Мұхаммедке және оның әулетіне Ибраһим мен оның әулетіне салауат айтқандай салауат айт.",
};

const SALAWAT_ALLAHUMMA_BARIK: RecitationBlock = {
  id: "salawat-barik",
  label: "Салауат (Аллаһумма барик)",
  arabic:
    "اللَّهُمَّ بَارِكْ عَلٰى مُحَمَّدٍ وَعَلٰى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلٰى إِبْرَاهِيمَ وَعَلٰى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
  transliterationKk:
    "Alloohumma baarik 'alaa Muhammadin wa 'alaa aali Muhammad. Kamaa baarokta 'alaa Ibroohiima wa 'alaa aali Ibroohiim. Innaka hamiidum majiid.",
  meaningKk:
    "Уа, Алла, Мұхаммедке және оның әулетіне Ибраһим мен оның әулетіне береке бергендей береке бер.",
};

const RABBANA_ATINA: RecitationBlock = {
  id: "rabbana-atina",
  label: "Қорытынды дұға",
  arabic:
    "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْاٰخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
  transliterationKk:
    "Robbanaa aatinaa fid-dunyaa hasanatan wa fil-aakhirati hasanatan wa qinaa 'azaaban-naar.",
  meaningKk:
    "Раббымыз, бізге дүниеде де, ақыретте де жақсылық бер және тозақ азабынан сақта.",
};

export const NAMAZ_WUDU_LEARNING_MODULES: LearningModule[] = [
  {
    id: "wudu",
    title: "Дәрет (Ханафи, beginner mode)",
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
            transliterationKk: "Bismillaah",
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
              "Ashhadu an laa ilaaha illallohu wahdahu laa shariika lah, wa ashhadu anna Muhammadan 'abduhu wa rasuuluh.",
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
    title: "Намаз (Ханафи, beginner mode)",
    intro:
      "Бұл бөлім ниеттен сәлемге дейін бірізді жүргізеді. Әр қадамда әрекет, оқылатын мәтін, транскрипция, мағына және қателер беріледі.",
    steps: [
      {
        id: "namaz-1-niyyah-takbir",
        title: "Ниет және алғашқы тәкбір",
        action: "Қыблаға қарап тұрып, намазға кіріңіз: қолды көтеріп «Аллаһу әкбар» деңіз.",
        bodyPositionHint: "Ер адам қолын құлақ деңгейіне, әйел иық тұсына дейін көтереді.",
        genderNoteHanafi: "Ханафиде әйелдің қимылы жинақы болады.",
        recitations: [
          {
            id: "takbir",
            label: "Тәкбір тахрима",
            arabic: "اللَّهُ أَكْبَرُ",
            transliterationKk: "Alloohu akbar",
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
            transliterationKk: "Subhaana robbiyal-'azyym",
            meaningKk: "Ұлы Раббым пәк.",
          },
          {
            id: "samiallah",
            label: "Рүкуғтан тұрған кезде",
            arabic: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ",
            transliterationKk: "Sami'allahu liman hamidah",
            meaningKk: "Алла Өзін мадақтағанды естиді.",
          },
          {
            id: "rabbana-lakal-hamd",
            label: "Тік тұрғандағы жауап",
            arabic: "رَبَّنَا لَكَ الْحَمْدُ",
            transliterationKk: "Robbanaa lakal-hamd",
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
            transliterationKk: "Subhaana robbiyal-a'laa",
            meaningKk: "Ең Жоғары Раббым пәк.",
          },
          {
            id: "rabbighfirli",
            label: "Екі сәжде арасындағы дұға",
            arabic: "رَبِّ اغْفِرْ لِي",
            transliterationKk: "Robbighfir lii",
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
            transliterationKk: "Assalaamu 'alaykum wa rohmatullooh",
            meaningKk: "Сіздерге Алланың сәлемі мен рақымы болсын.",
          },
        ],
        commonMistakes: ["Екінші сәлемді тастап кету.", "Сөздерді бұрмалау."],
        checkpoint: ["Оңға сәлем берілді.", "Солға сәлем берілді.", "Намаз аяқталды."],
      },
    ],
  },
];

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
