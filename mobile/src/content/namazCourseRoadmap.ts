export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explainWhy: string;
  topic: "wudu" | "namaz" | "recitation";
};

export type LearningMetrics = {
  completionPct: number;
  streakDays: number;
  weakTopics: string[];
  lastQuizScorePct: number;
};

export type HafizDailyTask = {
  id: string;
  title: string;
  minutes: number;
  type: "memorize" | "review" | "recitation";
};

export type HafizTrackDayPlan = {
  day: number;
  tasks: HafizDailyTask[];
};

// Phase 2 foundation: micro-tests + feedback model
export const NAMAZ_PHASE2_QUIZ_BANK: QuizQuestion[] = [
  {
    id: "q-order-1",
    prompt: "Намаздың басында қай әрекет дұрыс?",
    options: ["Рүкуғқа бірден бару", "Ниеттен кейін алғашқы тәкбір айту", "Сәлем беру"],
    correctIndex: 1,
    explainWhy: "Намаз ниеттен соң тәкбір тахримамен басталады.",
    topic: "namaz",
  },
  {
    id: "q-wudu-break-1",
    prompt: "Төмендегінің қайсысы дәретті бұзады?",
    options: ["Тек күлу", "Терең ұйқы", "Құран тыңдау"],
    correctIndex: 1,
    explainWhy: "Ханафи фиқһында терең ұйқы дәретті бұзады.",
    topic: "wudu",
  },
  {
    id: "q-recitation-1",
    prompt: "Әт-тахияттан кейін қайсысы оқылады?",
    options: ["Салауат", "Азан", "Қамат"],
    correctIndex: 0,
    explainWhy: "Соңғы отырыста Әт-тахияттан кейін салауат оқылады.",
    topic: "recitation",
  },
];

// Phase 3 foundation: daily Hafiz path skeleton
export const HAFIZ_7_DAY_BOOTSTRAP: HafizTrackDayPlan[] = [
  {
    day: 1,
    tasks: [
      { id: "d1-mem", title: "Фатиханы жаттау", minutes: 15, type: "memorize" },
      { id: "d1-rev", title: "Субханака қайталау", minutes: 10, type: "review" },
    ],
  },
  {
    day: 2,
    tasks: [
      { id: "d2-mem", title: "Ықылас сүресін жаттау", minutes: 15, type: "memorize" },
      { id: "d2-rec", title: "Қиям оқуын дауыстап оқу", minutes: 10, type: "recitation" },
    ],
  },
];
