/**
 * Сира — офлайн оқу бағдарламасы (38 сабақ, 7 кезең).
 * Мәтін қолданбаға кірген; бейне — опциялық YouTube сілтемесі.
 */
import type { ComponentProps } from "react";
import type MaterialIcons from "@expo/vector-icons/MaterialIcons";

export type SeerahPhaseIcon = ComponentProps<typeof MaterialIcons>["name"];

export type SeerahPhase = {
  id: string;
  titleKk: string;
  subtitleKk: string;
  introKk: string;
  icon: SeerahPhaseIcon;
};

export type SeerahLessonEntry = {
  n: number;
  phaseId: string;
  titleKk: string;
  summaryKk: string;
  focusKk: string;
};

export const SEERAH_PHASES: SeerahPhase[] = [
  {
    id: "pre",
    titleKk: "1. Арабия мен Мекке алдындағы дүние",
    subtitleKk: "сабақ 1–4",
    introKk:
      "Пайғамбар ﷺ дүниеге келгенге дейінгі Арабия мен Меккенің қоғамдық, экономикалық және рухани ортасы.",
    icon: "public",
  },
  {
    id: "childhood",
    titleKk: "2. Балалық · жастық",
    subtitleKk: "сабақ 5–9",
    introKk:
      "Туылу, Халима, атасы мен анасының қайтыс болуы, Шам сапары, саудадағы адалдығы және «ас-Садиқ» атануы.",
    icon: "child-care",
  },
  {
    id: "before",
    titleKk: "3. Пайғамбарлық алдындағы өмір",
    subtitleKk: "сабақ 10–14",
    introKk: "Хадиджа ﷼мен неке, Хира үңгірі, алғашқы уаһи, алғашқы мұсылмандар мен ашық дауат.",
    icon: "mosque",
  },
  {
    id: "mekka",
    titleKk: "4. Меккедегі дауат · қуғын",
    subtitleKk: "сабақ 15–22",
    introKk:
      "Құрайыш қысымы, Хабаша сапары, Әбу Талиб шырағы, Таиф, Исра мен Миғраж, алғашқы байғат.",
    icon: "warning",
  },
  {
    id: "hijra",
    titleKk: "5. Хижра · Мединеге қоныс",
    subtitleKk: "сабақ 23–27",
    introKk: "Хижра жоспары, Мединеге көшу, ансар мен мүһәжирлер бірлігі, Мәсжид ән-Нәбәуи.",
    icon: "flight-takeoff",
  },
  {
    id: "medina",
    titleKk: "6. Медине · мемлекет · соғыс",
    subtitleKk: "сабақ 28–34",
    introKk: "Бәдр, Ухуд, Хандақ, Худәйбия, Меккенің ашылуы, Тәбук — иман мен бірлік сынақтары.",
    icon: "home",
  },
  {
    id: "farewell",
    titleKk: "7. Қоштасу · мұра",
    subtitleKk: "сабақ 35–38",
    introKk: "Қоштасу қажылығы, қоштасу хутбасы, діннің кемелденуі, Пайғамбар ﷺ өмірден өтуі.",
    icon: "star",
  },
];

export const SEERAH_LESSONS: SeerahLessonEntry[] = [
  {
    n: 1,
    phaseId: "pre",
    titleKk: "Арабия мен дүние",
    summaryKk:
      "VI ғасырдағы Арабия саясаты, сауда жолдары және рухани орта. Пайғамбар ﷺ дүниеге келгенге дейінгі әлемдік контекст.",
    focusKk: "Контекст",
  },
  {
    n: 2,
    phaseId: "pre",
    titleKk: "Мекке · Қағба",
    summaryKk:
      "Меккенің қасиеті, Қағба орталығы, Құрайыш руы және қала экономикасы. Мекке — сауда мен діннің қиылысқан орны.",
    focusKk: "Мекке",
  },
  {
    n: 3,
    phaseId: "pre",
    titleKk: "Әмина · Абдулла",
    summaryKk:
      "Пайғамбар ﷺ отбасы шежіресі: Бану Хашим, Абдулла мен Әминаның некесі. Нұрлы шежіре мен сенімді ру.",
    focusKk: "Шежіре",
  },
  {
    n: 4,
    phaseId: "pre",
    titleKk: "Туылу алдындағы белгілер",
    summaryKk:
      "Уаһи алдындағы рухани дайындық пен Меккедегі күтулер. Алла Тағала Пайғамбар ﷺ келуін дайындаған.",
    focusKk: "Белгілер",
  },
  {
    n: 5,
    phaseId: "childhood",
    titleKk: "Туылу · Халима",
    summaryKk:
      "571 жылы туылу, Халима бинт Әбд әл-Узза қамқорлығы, емізу дәстүрі. Балалықтағы бақыт пен табиғат.",
    focusKk: "Туылу",
  },
  {
    n: 6,
    phaseId: "childhood",
    titleKk: "Шам сапары · Бахира",
    summaryKk:
      "Сапар барысында монах Бахирамен кездесу, керемет белгілер. Жастықтағы алғашқы рухани ілтипат.",
    focusKk: "Сапар",
  },
  {
    n: 7,
    phaseId: "childhood",
    titleKk: "Ата-ананың қайтыс болуы",
    summaryKk:
      "Абдулла мен Әминаның ерте қайтыс болуы; Әбд әл-Мутталиб қамқорлығы. Жетімдік — сабыр мен мейірім сабағы.",
    focusKk: "Жетімдік",
  },
  {
    n: 8,
    phaseId: "childhood",
    titleKk: "«Ас-Садиқ» · адалдық",
    summaryKk:
      "Жастықтағы адалдық, «Шыншыл» атануы, сенімділік. Меккеде Пайғамбар ﷺ әділдікпен танылған.",
    focusKk: "Адалдық",
  },
  {
    n: 9,
    phaseId: "childhood",
    titleKk: "Хилф әл-Фудул",
    summaryKk:
      "Зұлымдыққа қарсы біріккен келісім — әділдікке берік тұру. Жастықта зұлымдыққа қарсы бірлік.",
    focusKk: "Әділдік",
  },
  {
    n: 10,
    phaseId: "before",
    titleKk: "Хадиджа ﷼мен неке",
    summaryKk:
      "Жиырма бес жасында неке, отбасы мейірімі, саудадағы сенім. Хадиджа ﷼ — алғашқы иман қолдаушысы.",
    focusKk: "Неке",
  },
  {
    n: 11,
    phaseId: "before",
    titleKk: "Хира үңгірі",
    summaryKk:
      "Жалғыз ғибадат, ойлану, рухани дайындық. Хира — алғашқы уаһи алдындағы тыныштық орны.",
    focusKk: "Ғибадат",
  },
  {
    n: 12,
    phaseId: "before",
    titleKk: "Алғашқы уаһи",
    summaryKk:
      "Қырық жасында Жәбірейіл ﷺ, «Оқы!» аяты, Хадиджа ﷼ қолдауы. Пайғамбарлықтың басталуы.",
    focusKk: "Уаһи",
  },
  {
    n: 13,
    phaseId: "before",
    titleKk: "Алғашқы мұсылмандар",
    summaryKk:
      "Хадиджа, Әли, Зәйд, Әбу Бәкір — алғашқы иман. Бірінші жамағат отбасынан басталды.",
    focusKk: "Сахаба",
  },
  {
    n: 14,
    phaseId: "before",
    titleKk: "Ашық дауат",
    summaryKk:
      "Әс-Сафа тауы, Құрайыш қарсылығы басталады. Ашық дауат — бірлік пен сабыр сынамасы.",
    focusKk: "Дауат",
  },
  {
    n: 15,
    phaseId: "mekka",
    titleKk: "Құрайыш қысымы",
    summaryKk:
      "Мұсылмандарға қиянат, бойкот, азап. Иман — қиыншылықта түзу тұру.",
    focusKk: "Қиянат",
  },
  {
    n: 16,
    phaseId: "mekka",
    titleKk: "Хабаша сапары",
    summaryKk:
      "Негізгі мұсылмандар Нәжаши қорғауында. Бірінші хижра — Хабаша жері.",
    focusKk: "Хабаша",
  },
  {
    n: 17,
    phaseId: "mekka",
    titleKk: "Әбу Талиб шырағы",
    summaryKk:
      "Үш жылдық бойкот, аштық жылдары. Бірлік — қиын жылдарда қорғау.",
    focusKk: "Бойкот",
  },
  {
    n: 18,
    phaseId: "mekka",
    titleKk: "Қайғы жылы",
    summaryKk:
      "Әбу Талиб пен Хадиджаның қайтыс болуы — қайғы жылы. Сабыр мен тәуекел.",
    focusKk: "Қайғы",
  },
  {
    n: 19,
    phaseId: "mekka",
    titleKk: "Таиф сапары",
    summaryKk:
      "Таиф қабылдамады, бірақ жәннат періштелері көмектеседі. Қайтару — дауат жанашыры.",
    focusKk: "Таиф",
  },
  {
    n: 20,
    phaseId: "mekka",
    titleKk: "Исра мен Миғраж",
    summaryKk:
      "Түнгі сапарда Әл-Қудс зияраты, бес намаз. Миғраж — иманның күнілік тірегі.",
    focusKk: "Миғраж",
  },
  {
    n: 21,
    phaseId: "mekka",
    titleKk: "Бес намаз",
    summaryKk:
      "Намаз — иманның күнілік тірегі. Миғраждан кейін намаз — мұсылман өмірінің негізі.",
    focusKk: "Намаз",
  },
  {
    n: 22,
    phaseId: "mekka",
    titleKk: "Бірінші байғат",
    summaryKk:
      "Медине азаматтарымен келісім. Ақаба байғаты — Мединеге дайындық.",
    focusKk: "Байғат",
  },
  {
    n: 23,
    phaseId: "hijra",
    titleKk: "Хижраны жоспарлау",
    summaryKk:
      "Құрайыш қудалауы, мұсылмандар Мединеге көшеді. Хижра — жаңа бастау.",
    focusKk: "Хижра",
  },
  {
    n: 24,
    phaseId: "hijra",
    titleKk: "Хижра · көшу",
    summaryKk:
      "Әбу Бәкір мен Әли қалып, Пайғамбардың көшуі. Хижра — иман және бірлік.",
    focusKk: "Көшу",
  },
  {
    n: 25,
    phaseId: "hijra",
    titleKk: "Мединенің қабылдауы",
    summaryKk:
      "Ансар мен мүһәжирлер бірлігі. Медине — мұсылман қаласы.",
    focusKk: "Ансар",
  },
  {
    n: 26,
    phaseId: "hijra",
    titleKk: "Мәсжид ән-Нәбәуи",
    summaryKk:
      "Мешіт — бірлік пен білім орталығы. Мединедегі бірінші жамағат орталығы.",
    focusKk: "Мешіт",
  },
  {
    n: 27,
    phaseId: "hijra",
    titleKk: "Муахат",
    summaryKk:
      "Бауырластық шарт — ансар мен мүһәжирлер. Бірлік — Медине қаласындағы негіз.",
    focusKk: "Бауырластық",
  },
  {
    n: 28,
    phaseId: "medina",
    titleKk: "Бәдр оқиғасы",
    summaryKk:
      "624 ж. — иманның жауынгерлігі. Бәдр — бірінші үлкен жеңіс.",
    focusKk: "Бәдр",
  },
  {
    n: 29,
    phaseId: "medina",
    titleKk: "Ухуд",
    summaryKk:
      "Сабыр сынамасы, Хамза ﷼ шәһид. Ухуд — сабыр мен тәубе сабағы.",
    focusKk: "Ухуд",
  },
  {
    n: 30,
    phaseId: "medina",
    titleKk: "Хандақ",
    summaryKk:
      "Қала қорғауы, Салман әл-Фариси идеясы. Бірлік — қала қорғауындағы жауапкершілік.",
    focusKk: "Хандақ",
  },
  {
    n: 31,
    phaseId: "medina",
    titleKk: "Худәйбия",
    summaryKk:
      "Бейбітшілік шарты — стратегиялық жеңіс. Сабыр — ұзақ мерзімді пайда.",
    focusKk: "Худәйбия",
  },
  {
    n: 32,
    phaseId: "medina",
    titleKk: "Меккенің ашылуы",
    summaryKk:
      "630 ж. — кешірім мен азат ету. Фатх — кешірім мен әділдік.",
    focusKk: "Фатх",
  },
  {
    n: 33,
    phaseId: "medina",
    titleKk: "Тәбук",
    summaryKk:
      "Соңғы үлкен сапар, сабыр. Тәбук — иман мен жауапкершілік.",
    focusKk: "Тәбук",
  },
  {
    n: 34,
    phaseId: "medina",
    titleKk: "Қажылықты үйрету",
    summaryKk:
      "Намаз, зекет, қажылық — толық дін. Дін — күнделікті өмірге ену.",
    focusKk: "Қажылық",
  },
  {
    n: 35,
    phaseId: "farewell",
    titleKk: "Қоштасу қажылығы",
    summaryKk:
      "632 ж. — соңғы қажылық. Қоштасу қажылығы — мұсылмандарға соңғы насихат.",
    focusKk: "Қоштасу",
  },
  {
    n: 36,
    phaseId: "farewell",
    titleKk: "Қоштасу хутбасы",
    summaryKk:
      "Адамдар тең, қан үстінде қан жоқ. Хутба — әділдік пен бірлік.",
    focusKk: "Хутба",
  },
  {
    n: 37,
    phaseId: "farewell",
    titleKk: "Дін кемелденді",
    summaryKk:
      "Дін кемелденді — сақтауды ұмытпа. Құран — мұсылмандарға мұра.",
    focusKk: "Құран",
  },
  {
    n: 38,
    phaseId: "farewell",
    titleKk: "Пайғамбардың өмірден өтуі",
    summaryKk:
      "632 ж. 12 Рабиғ әл-әууәл — мұсылмандарға мұра. Пайғамбар ﷺ — барша үмметке үлгі.",
    focusKk: "Мұра",
  },
];

export function getSeerahLessonsForPhase(phaseId: string): SeerahLessonEntry[] {
  return SEERAH_LESSONS.filter((l) => l.phaseId === phaseId);
}

export function getSeerahLesson(n: number): SeerahLessonEntry | undefined {
  return SEERAH_LESSONS.find((l) => l.n === n);
}

export function seerahOfflineCharCount(): number {
  return (
    SEERAH_PHASES.reduce((s, p) => s + p.introKk.length, 0) +
    SEERAH_LESSONS.reduce((s, l) => s + l.titleKk.length + l.summaryKk.length + l.focusKk.length, 0)
  );
}
