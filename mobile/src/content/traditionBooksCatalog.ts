import { KAZAKH_TRADITION_ORAZA_AIT_BLOCK_TITLE } from "./kazakhTraditionAnchors";
import {
  TRADITION_TOPIC_BLOCK_COUNT,
  TRADITION_TOPIC_COUNT_BY_CATEGORY,
  type TraditionTopicCategory,
} from "./kazakhTraditionTopicStats";
import type { MainTabParamList, MoreStackParamList, RootStackParamList } from "../navigation/types";
import {
  countEntriesForAuthor,
  getGreatWordsAuthors,
  getGreatWordsStats,
} from "./greatWordsCatalog";
import { getOfficialBooks, getOfficialBooksBySite } from "./officialBooksCatalog";

export type TraditionBookGroup = "wisdom" | "faith" | "tradition" | "ait";

/** Дін оқулықтарының жүйелі топтары (кітаптар каталогы). */
export type FaithBookShelfId = "ibada" | "quran" | "ilm" | "tools";

export type CatalogBookSectionId =
  | "faith-ibada"
  | "faith-quran"
  | "faith-ilm"
  | "faith-tools"
  | "official-fatua"
  | "official-muftyat"
  | "tradition-guides";

const FAITH_SHELF_BY_ID: Record<string, FaithBookShelfId> = {
  "prayer-times": "ibada",
  qibla: "ibada",
  namaz: "ibada",
  duas: "ibada",
  tasbih: "ibada",
  quran: "quran",
  tajweed: "quran",
  hatim: "quran",
  seerah: "ilm",
  hajj: "ilm",
  asma: "ilm",
  halal: "tools",
  "islamic-kb": "tools",
  "imam-ai": "tools",
};

const FAITH_SHELF_ORDER: Record<FaithBookShelfId, string[]> = {
  ibada: ["prayer-times", "qibla", "namaz", "duas", "tasbih"],
  quran: ["quran", "tajweed", "hatim"],
  ilm: ["seerah", "hajj", "asma"],
  tools: ["halal", "islamic-kb", "imam-ai"],
};

const BOOKS_SCREEN_EXCLUDED_FAITH_IDS = new Set<string>([
  "prayer-times",
  "qibla",
  "namaz",
  "duas",
  "tasbih",
  "quran",
  "tajweed",
  "hatim",
  "seerah",
  "hajj",
  "asma",
  /** Басты бет / мазмұн хабынан — кітаптар каталогында қайталанбауы керек */
  "halal",
  "islamic-kb",
  "imam-ai",
]);

const TRADITION_GUIDE_ORDER = [
  "tradition-topics",
  "tradition-family",
  "tradition-social",
  "tradition-ceremony",
  "tradition-faith-topics",
];

export type TraditionBookAction =
  | { kind: "screen"; screen: keyof MoreStackParamList; params?: MoreStackParamList[keyof MoreStackParamList] }
  | {
      kind: "rootScreen";
      screen: keyof Pick<RootStackParamList, "PrayerTimes" | "Qibla" | "AsmaAlHusna">;
      params?: RootStackParamList["PrayerTimes"] | RootStackParamList["Qibla"] | RootStackParamList["AsmaAlHusna"];
    }
  | { kind: "mainTab"; tab: keyof Pick<MainTabParamList, "Tasbih" | "Duas">; params?: MainTabParamList["Tasbih"] | MainTabParamList["Duas"] }
  | { kind: "scrollBlock"; blockTitle: string }
  | { kind: "scrollTopics" }
  | { kind: "scrollTopicsCategory"; category: TraditionTopicCategory }
  | { kind: "externalUrl"; url: string };

export type TraditionBookEntry = {
  id: string;
  group: TraditionBookGroup;
  title: string;
  subtitle: string;
  /** Тізімдегі қысқа белгі (мысалы «35 тақырып») */
  badge?: string;
  summary: string;
  contents: string[];
  religionLink: string;
  howToRead: string[];
  action: TraditionBookAction;
};

function greatWordsBadge(): string {
  const { authors, entries } = getGreatWordsStats();
  return `${entries} сөз · ${authors} автор`;
}

const WISDOM_BOOK_TITLES: Partial<Record<string, string>> = {
  abai: "Абай Құнанбаев. Қара сөздері",
  shokan: "Шоқан Уәлиханов. Ойлар мен зерттеулер",
  makhambet: "Махамбет Өтемісұлы. Өлең мен нақыл",
  ybyray: "Ыбырай Алтынсарин. Ағартушылық сөздері",
  shakarim: "Шәкәрім Құдайбердіұлы. Ой-толғам",
  mirzhakyp: "Міржақып Дулатов. Қоғам мен білім",
  akhmet: "Ахмет Байтұрсынұлы. Тіл мен мәдениет",
  magzhan: "Мағжан Жұмабаев. Поэзия мен ой",
  zhuban: "Жұбан Молдағалиев. Ақындық мұра",
  tulen: "Төлеген Қайыркенов. Дана сөздер",
  omarkhan: "Омархан Әбікеев. Өсиет пен нақыл",
  zeynolla: "Зейнолла Шүкіров. Ой мен өлең",
  folk: "Халық даналығы мен нақылдар",
  sheshei: "Шешейдің өсиеті",
  mystic: "Рухани дәстүр сөздері",
  bokey: "Әлихан Бөкейханов. Ойшылдық мұра",
  alkey: "Әлкей Марғұқан. Ақындық жинақ",
  toraygirov: "Сұлтанмахмұт Торайғыров. Өлең мен ой",
  birzhan: "Біржан-сал. Ақындық мұра",
  korkyt: "Қорқыт ата. Дастан мен даналық",
  kulash: "Құлаш Байсейітова. Өлең мен өсиет",
};

function wisdomWorksLabel(n: number): string {
  return n === 1 ? "1 сөз" : `${n} сөз`;
}

function buildWisdomAuthorBooks(): TraditionBookEntry[] {
  return getGreatWordsAuthors()
    .filter((a) => a.id !== "editorial")
    .map((author) => {
      const n = countEntriesForAuthor(author.id);
      const title = WISDOM_BOOK_TITLES[author.id] ?? author.name;
      const bioShort =
        author.bio.length > 220 ? `${author.bio.slice(0, 217).trim()}…` : author.bio;
      return {
        id: `wisdom-${author.id}`,
        group: "wisdom",
        title,
        subtitle: author.period,
        badge: n > 0 ? wisdomWorksLabel(n) : "жинақта",
        summary: bioShort,
        contents: [
          n > 0 ? `${n} толық мәтін жинақта` : "Жинақтағы автор бетінен қараңыз",
          "Қазақ мәтін, қысқа мағына және қолданыс идеясы",
          "Іздеу арқылы нақты жолды табуға болады",
        ],
        religionLink:
          "Игі өнеге, сабыр, білім және отбасы әдебі туралы сөздер дінмен үйлеседі; күмәнді тұжырымды ұстазбен ақылдаңыз.",
        howToRead: [
          "Күніне бір-екі сөзді оқып, отбада қысқа талқылау.",
          "Қажет болса «Барлық жинақ» бөлімінен іздеу.",
          "Ғылыми жұмыс үшін түпнұсқа басылымды қараңыз.",
        ],
        action: {
          kind: "screen",
          screen: "KazakhGreatWordsAuthor",
          params: { authorId: author.id },
        },
      };
    });
}

/** Танымал шығарма — автор жинағына сілтеме (керемет кітаптар тізімінің үсті). */
const KAZAKH_WONDERFUL_BOOK_HIGHLIGHTS: TraditionBookEntry[] = [
  {
    id: "highlight-abai-kara-soz",
    group: "wisdom",
    title: "Абай. Қара сөз",
    subtitle: "45 прозалық сөз · толық мәтін",
    badge: "45 сөз",
    summary:
      "Өнеге, білім, еңбек, сыни ой және қоғамдық өрлеу туралы классикалық проза. Қазақ руханияты мен білім салтының негізгі кітаптарының бірі.",
    contents: ["45 «Қара сөз» толық мәтіні", "Әр сөзге қысқа мағына", "Іздеу және күндік оқуға ыңғайлы"],
    religionLink:
      "Игі өнеге, сабыр, білім туралы ойлар дінмен үйлеседі; күмәнді тұжырымды ұстазбен ақылдаңыз.",
    howToRead: ["Күніне бір сөз оқып, отбада талқылау.", "Түпнұсқа басылыммен салыстыру."],
    action: { kind: "screen", screen: "KazakhGreatWordsAuthor", params: { authorId: "abai" } },
  },
  {
    id: "highlight-folk",
    group: "wisdom",
    title: "Халық даналығы мен нақылдар",
    subtitle: "Ұлттық нақыл · өсиет",
    badge: "жинақ",
    summary: "Ұрпақтан-ұрпаққа жеткен нақылдар: отбасы, еңбек, бірлік, сабыр және әдеп туралы.",
    contents: ["Халық нақылдары жинағы", "Қысқа мағына", "Күнделікті өмірге қолданыс"],
    religionLink: "Игі өнеге мен шариғатқа қайшы емес нақылдар — ортақ тіл; ырымдық түсінікті ажыратыңыз.",
    howToRead: ["Күніне бір-екі нақыл.", "Балаларға қарапайым талқылау."],
    action: { kind: "screen", screen: "KazakhGreatWordsAuthor", params: { authorId: "folk" } },
  },
  {
    id: "highlight-sheshei",
    group: "wisdom",
    title: "Шешейдің өсиеті",
    subtitle: "Отбалық тәрбие · әдеп",
    badge: "өсиет",
    summary: "Ана әулетінің тәрбие сөзі: ізет, еңбек, сабыр, көрші мен үлкенге құрмет.",
    contents: ["Өсиет нақылдары", "Отбалық талқылауға ыңғайлы", "Қысқа жолдар"],
    religionLink: "Отбалық әдеп пен ислам әдебі үйлеседі; сенімге қайшы ырымнан сақтану керек.",
    howToRead: ["Үй ішінде бір өсиетті оқып, мысалмен түсіндіру.", "Жастарға жазып беру."],
    action: { kind: "screen", screen: "KazakhGreatWordsAuthor", params: { authorId: "sheshei" } },
  },
  {
    id: "highlight-korkyt",
    group: "wisdom",
    title: "Қорқыт ата. Дастан мен даналық",
    subtitle: "Рухани мұра · халық эпосы",
    badge: "дастан",
    summary: "Қорқыт ата дәстүрі — қазақтың рухани және музыкалық мұрасы; даналық пен өнер сөздері.",
    contents: ["Дастан мен даналық сөздер", "Рухани мұра контексті", "Іздеу арқылы табу"],
    religionLink: "Эпос — мәдени мұра; таухид пен сүннетке қайшы мифологиялық сенімнен ажыратыңыз.",
    howToRead: ["Қысқа үзінді оқып, мәдени мағынасын талқылау.", "Ғылыми зерттеу үшін түпнұсқа."],
    action: { kind: "screen", screen: "KazakhGreatWordsAuthor", params: { authorId: "korkyt" } },
  },
];

export const TRADITION_BOOK_GROUPS: { id: TraditionBookGroup; label: string; hint: string }[] = [
  {
    id: "wisdom",
    label: "Қазақтың керемет кітаптары",
    hint: "Абай «Қара сөз», Шоқан, Ыбырай, халық нақылы, шешей өсиеті және басқа дана авторлар.",
  },
  {
    id: "faith",
    label: "Дін оқулықтары",
    hint: "Құран, намаз уақыты, құбыла, хадис, дұға, тәспі, 99 есім, хатим, сира, қажылық, халал, сұрақ-жауап",
  },
  {
    id: "ait",
    label: "Айт жинақ",
    hint: "Ораза айт және Құрбан айт — күн жоспары мен құттықтау;",
  },
  {
    id: "tradition",
    label: "Дәстүр нұсқаулықтары",
    hint: `${TRADITION_TOPIC_BLOCK_COUNT} тақырып: отбасы, қоғам, рәсім, дін тәлімі — шариғатпен салыстыру`,
  },
];

export const TRADITION_BOOKS: TraditionBookEntry[] = [
  {
    id: "great-words",
    group: "wisdom",
    title: "Қазақтың керемет сөздері (барлық жинақ)",
    subtitle: "Барлық автор · іздеу · Абай «Қара сөз»",
    badge: greatWordsBadge(),
    summary:
      "Дана сөздер бөлімін басқанда: жоғарыда іздеуді немесе автор жолын қолданыңыз → қажетті мәтінді ашыңыз. Абайдың «Қара сөздері», өсиет, халық нақылы — жолдың астында түсініктеме тұрады; тәлім мен отбасы талқысына ыңғайлы.",
    contents: [
      "Абай, Шоқан, Ыбырай және тағы авторлар тізімі",
      "Әр жол: толық мәтін, қысқа мағына және қолданыс идеясы",
      "Іздеу: қажетті сөз не авторды бірден табады",
    ],
    religionLink:
      "Нақылдар исламдық руханиятпен қайшы келмейтін игі өнеге, сабыр, бірлік, білім туралы болса — дін мен дәстүрдің ортақ тілі болады. Күмәнді тұжырымдарды ұстазбен ақылдаңыз.",
    howToRead: [
      "Алдымен бір авторды таңдаңыз немесе іздеуден бастаңыз — жол бағыты бірнеше кітаптан да қарапайым.",
      "Күніне бір-екі жолды түгел оқып, қысқа талқылау.",
      "Ғылыми салыстыру үшін қайта түп нұсқаны қараңыз.",
    ],
    action: { kind: "screen", screen: "KazakhGreatWords" },
  },
  ...KAZAKH_WONDERFUL_BOOK_HIGHLIGHTS,
  ...buildWisdomAuthorBooks(),
  {
    id: "tradition-topics",
    group: "tradition",
    title: "Дін мен дәстүр: барлық тақырыптар",
    subtitle: `${TRADITION_TOPIC_BLOCK_COUNT} тақырып · қалта-қалта нұсқау`,
    badge: `${TRADITION_TOPIC_BLOCK_COUNT} тақырып`,
    summary:
      "Қазақ игі дәстүрін Құран мен сүннетпен салыстыратын оқулық карточкалары: сәлем, қонақ, бата, мереке, жаназа, зекет, ырым шегі және заманауи медиа әдебі.",
    contents: [
      "Қысқаша → Қайдан шықты → Ұштасуы → Шариғи шек → Қадамдар",
      "Жағдайлар мен мысалдар (виньетка) + түйін",
      "Іздеу, санат сүзгісі, таңдаулы тақырыптар",
    ],
    religionLink:
      "Әр тақырыпта аят/сүннет бағыты берілеген; нақты фиқһ пен ресми норманы мешіт пен ұстазбен толықтырыңыз.",
    howToRead: [
      "Бір уақытта бір тақырыпты ашып, ішкі қалталарды ретімен оқыңыз.",
      "Күнделікті жағдай талдауымен байланыстырып қолданыңыз.",
      "Таңдаулыға қосып, жеке оқу маршрутын құрыңыз.",
    ],
    action: { kind: "scrollTopics" },
  },
  {
    id: "tradition-family",
    group: "tradition",
    title: "Отбасы дәстүрі",
    subtitle: "Тәрбие · туыстық · үй іші әдеп",
    badge: `${TRADITION_TOPIC_COUNT_BY_CATEGORY.family} тақырып`,
    summary:
      "Отбасы, туыстық, бата, бесік, үйлену, ата-ана құрметі және үй іші әдебі — дінмен үйлесетін жағын сүзіп, күмәнді ырымнан сақтану.",
    contents: [
      "Сәлем, бата, жеті ата, шілдехана, бесік",
      "Отбасылық мереке және тәрбие",
      "Жағдай талдауы және 7 күн жоспары",
    ],
    religionLink: "Отбалық әдеп — сүннет пен шариғаттың маңызды бөлігі; ырымдық сенімнен ажыратыңыз.",
    howToRead: [
      "Отбасы профилін таңдап, бір тақырыпты ашыңыз.",
      "Апталық жоспармен бекіту.",
      "Күрделі жағдайда ұстазбен ақылдасу.",
    ],
    action: { kind: "scrollTopicsCategory", category: "family" },
  },
  {
    id: "tradition-social",
    group: "tradition",
    title: "Қоғамдық дәстүр",
    subtitle: "Қонақ · көрші · асар · бірлік",
    badge: `${TRADITION_TOPIC_COUNT_BY_CATEGORY.social} тақырып`,
    summary:
      "Қонақжайлық, асар, көрші құқығы, қоғамдық бірлік және әлеуметтік әдеп — ысырапсыз, адал ниетпен қолдану.",
    contents: ["Қонақ күту және дастарқан", "Асар мен көршіге көмек", "Қоғамдық татулық"],
    religionLink: "Қоғамдық игілік сүннетпен үйлеседі; мақтан және ысырап — шариғатқа қайшы.",
    howToRead: ["Бір тақырыпты күнделікті өмірмен салыстыру.", "Отбада қысқа талқылау."],
    action: { kind: "scrollTopicsCategory", category: "social" },
  },
  {
    id: "tradition-ceremony",
    group: "tradition",
    title: "Рәсімдер мен мерекелер",
    subtitle: "Наурыз · той · жаназа · айт",
    badge: `${TRADITION_TOPIC_COUNT_BY_CATEGORY.ceremony} тақырып`,
    summary:
      "Ұлттық мереке, той, жаназа, айт әдебі — шариғи шек пен қазақы ізетті бірге ұстау; сенімге қайшы ырымнан сақтану.",
    contents: ["Наурыз және отбасылық мереке", "Жаназа және қаза", "Айт пен құрбан дәстүрі"],
    religionLink: "Мереке игі ниетпен болса құпталады; харам және ырымдық элементтерден аулақ болыңыз.",
    howToRead: ["Мереке алдында тақырыпты толық оқу.", "Имаммен уақыт пен шартты растау."],
    action: { kind: "scrollTopicsCategory", category: "ceremony" },
  },
  {
    id: "tradition-faith-topics",
    group: "tradition",
    title: "Дін мен салт қиылысы",
    subtitle: "Зекет · ораза · медиа · шариғи шек",
    badge: `${TRADITION_TOPIC_COUNT_BY_CATEGORY.faith} тақырып`,
    summary:
      "Зекет, ораза, намаз мәдениеті, жаңа технология әдебі және дәстүрдің шариғат шегі — сауатты салыстыру карталары.",
    contents: ["Зекет және садақа", "Ораза және айт әдебі", "Заманауи медиа және сенім шегі"],
    religionLink: "Дін — негіз; дәстүр — онымен үйлесетін тәжірибе ғана құпталады.",
    howToRead: ["Тақырыпты «Дін мен дәстүр» бөлімінде ашып, қалталарды ретімен оқу.", "Фиқһты ұстазбен нақтылау."],
    action: { kind: "scrollTopicsCategory", category: "faith" },
  },
  {
    id: "prayer-times",
    group: "faith",
    title: "Намаз уақыты",
    subtitle: "Бес уақыт · ескерту · күнтізбе",
    badge: "5 уақыт",
    summary:
      "Таңдалған қала бойынша бес уақыт намаз кестесі, күнтізбе, виджет және ескертулер; азан дыбысы мен сүйемел.",
    contents: [
      "Күндік және апталық кесте",
      "Ескерту баптамалары",
      "Виджет (Android)",
      "Қала мен уақыт белдеуі",
    ],
    religionLink: "Намаз уақытын сақтау — парыздың шарты; дәстүрдегі уақыт құрметі осымен үйлеседі.",
    howToRead: [
      "Қаланы дұрыс таңдап, мешіт кестесімен салыстыру.",
      "Ескертулерді қосып, тұрақты ұстау.",
      "Саяхатта қала өзгерту.",
    ],
    action: { kind: "rootScreen", screen: "PrayerTimes" },
  },
  {
    id: "qibla",
    group: "faith",
    title: "Құбыла",
    subtitle: "Компас · камера · бағыт",
    summary:
      "Телефон сенсорларымен Қағбаға бағыт; компас және камера режимі; орынды жаңарту.",
    contents: ["Компас көрінісі", "Камера режимі", "Бағыт калибрлеу", "Қысқа нұсқау"],
    religionLink: "Намазда құбыла — шариғат шарты; саяхатта да қолданылады.",
    howToRead: ["Намаз алдында бағытты тексеру.", "Металл жақын болмасын.", "Камера режимін жарықта қолдану."],
    action: { kind: "rootScreen", screen: "Qibla" },
  },
  {
    id: "quran",
    group: "faith",
    title: "Құран Кәрім",
    subtitle: "Мұсафа оқу · қазақша мағына · кітап беті",
    summary:
      "114 сүре, араб мәтін, қазақша аударма, транслитерация. Мұсафа режимінде 604-беттік баспа бойынша беттер; хатиммен байланысты оқу.",
    contents: [
      "Сүре тізімі және іздеу",
      "Мұсафа/скролл режимі, оқу баптамалары",
      "Бетбелгі, хатимге жалғастыру",
    ],
    religionLink: "Құран — мұсылманның негізгі кітабы; оқу, тыңдау және үйрену — иман мен әдептің ортасы.",
    howToRead: [
      "Күндік мөлшерді кіші бастап, тұрақты ұстау.",
      "Мұсафа режимінде тек араб мәтініне назар аударуға болады.",
      "Түсінік үшін тәфсир мен ұстаз кеңесін қосу.",
    ],
    action: { kind: "screen", screen: "QuranList" },
  },
  {
    id: "namaz",
    group: "faith",
    title: "Намаз нұсқаулығы",
    subtitle: "Дәрет · 5 уақыт · саяхат · қажылық",
    summary:
      "Намаз орындау қадамдары, дәрет, жуыну, саяхат намазы, қажылық намаздары; суреттер мен қысқа түсініктемелер.",
    contents: [
      "Дәрет және таяммум",
      "5 уақыт намазы (еркек/әйел)",
      "Жұма, науқас, саяхат, қажылық",
      "Намаздан кейінгі зікірге сілтеме",
    ],
    religionLink: "Намаз — Исламның второй столп; дәстүрдегі уақыт сақтау мәдениеті намазбен үйлеседі.",
    howToRead: ["Бастапқыда бір рәкатты қадамдармен үйрену.", "Мешітте имаммен салыстыру.", "Балаларға қадам-қадам көрсету."],
    action: { kind: "screen", screen: "NamazGuide" },
  },
  {
    id: "tajweed",
    group: "faith",
    title: "Тәжуид оқулығы",
    subtitle: "KMDA · «Құран оқып - үйренейік!»",
    summary:
      "KMDA «Тәжуид» оқулығы: харакаттар, мәдд, уақф және Құран оқу ережелері — тек тәжуид бөлімі.",
    contents: ["Харакаттар", "Тәжуид ережелері", "Мәдд", "Уақф"],
    religionLink: "Құранды әдеппен оқу — сүннет; ана тілін құрметтеумен қайшы келмейді.",
    howToRead: ["Мазмұннан бөлім таңдап ашыңыз.", "Бет суретін басып толық экранда оқыңыз.", "Ұстаздан тыңдап, қайталау."],
    action: { kind: "screen", screen: "TajweedGuide" },
  },
  {
    id: "hatim",
    group: "faith",
    title: "Хатм кітабы",
    subtitle: "Жоспар · прогресс · мұсафа оқу",
    summary:
      "Құранды аяқтау жоспары, күнделікті мөлшер, оқылған беттерді белгілеу; мұсафа көрінісімен жалғастыру.",
    contents: ["Хатим жоспары", "Күнделікті мөлшер", "Оқу прогрессі", "Мұсафадан жалғастыру"],
    religionLink: "Құранды түгел оқу — ұзақ мерзімді ғибадат; сабыр мен тұрақтылық керек.",
    howToRead: ["Реалистік күндік мөлшер таңдау.", "Қолданбадағы ескертулерді қосу.", "Үзіліс болса қайта бастамау, жалғастыру."],
    action: { kind: "screen", screen: "Hatim" },
  },
  {
    id: "tasbih",
    group: "faith",
    title: "Намаздан кейінгі тәспі",
    subtitle: "33+33+34 · зікір тараулары",
    badge: "220 зікір",
    summary:
      "Намаздан кейінгі сүннет зікірлер: СубханАллаһ, Әлхамдулиллаһ, Аллаһу акбар; тарау бойынша толық жинақ.",
    contents: ["Тәспі санағышы", "Зікір тараулары", "Араб мәтін және мағына", "Мақсат белгілеу"],
    religionLink: "Зікір — иманның күші; намаздан кейінгі тәспі — кең таралған сүннет.",
    howToRead: ["Намаздан кейін тәспіні аяқтау.", "Күніне бір тарауды үйрену.", "Мағынасын оқып, қайталау."],
    action: { kind: "mainTab", tab: "Tasbih", params: { screen: "TasbihList" } },
  },
  {
    id: "asma",
    group: "faith",
    title: "Алланың 99 есімі",
    subtitle: "Есім · мағына · зікір",
    badge: "99 есім",
    summary:
      "Есм-әл-Хусна: әр есімнің арабша жазылымы, транскрипция және қазақша түсініктемесі; зікір ретінде оқуға ыңғайлы.",
    contents: ["99 есім тізімі", "Түсініктеме", "Іздеу", "Зікірге қолдану"],
    religionLink: "Алла есімдерін үйрену және зікір — Құран мен сүннетте мадақталған.",
    howToRead: ["Күніне бірнеше есім оқу.", "Мағынасын жаттау.", "Намаздан кейін қысқа зікір ретінде қайталау."],
    action: { kind: "rootScreen", screen: "AsmaAlHusna" },
  },
  {
    id: "duas",
    group: "faith",
    title: "Дұғалар жинағы",
    subtitle: "Күнделікті · саяхат · зікір",
    summary:
      "Күнделікті, дәрет, саяхат, қажылық дұғалары; араб мәтін, оқылуы, қазақша мағына; топтар бойынша қалталар.",
    contents: ["Бөлімдер бойынша дұғалар", "Араб + транскрипция + мағына", "Жиі қайталанатын қысқа дұғалар"],
    religionLink: "Дұға — құлдың Алламен сөйлесуі; дәстүрдегі бата осы руханиятпен үйлесуі керек.",
    howToRead: ["Күндік дұғаны таңдап, мағынасын үйрену.", "Намаз ішіндегі дұғаларды намаз нұсқаулығынан қарау."],
    action: { kind: "screen", screen: "Duas" },
  },
  {
    id: "seerah",
    group: "faith",
    title: "Пайғамбар сирасы",
    subtitle: "Өмірбаян · видео · хронология",
    summary:
      "Пайғамбар Мұхаммед ﷺ өмірбаяны: кезеңдер, оқиғалар, бейне материалдар; отбасылық оқуға арналған қысқа түсініктемелер.",
    contents: ["Хронология", "Тақырыптық бөлімдер", "Бейне сабақтар (бар болса)"],
    religionLink: "Сира — сүннетті түсінудің негізі; дәстүрдегі әдеп көп жағдайда сирадан үйреніледі.",
    howToRead: ["Кезең-кезең оқу.", "Балаларға қысқа эпизод таңдап түсіндіру.", "Сұрақтарды сира контекстінде жауаптау."],
    action: { kind: "screen", screen: "Seerah" },
  },
  {
    id: "hajj",
    group: "faith",
    title: "Қажылық",
    subtitle: "muftyat.kz · тәлбия · Мекке · Мина",
    summary:
      "ҚМДБ «Қажылық» кітабы (2010): ихрам, тәлбия, тауаф, сағи, Арафа, жәмарат, Медина — толық мазмұн.",
    contents: [
      "Тәлбия (әдепкі ашық)",
      "Ихрам · Мекке · Қағба",
      "Тауаф · сағи · Мина · Арафа",
      "Қоштасу тауафы · Медина",
    ],
    religionLink: "Қажылық — Исламның бесінші столпы; қазақ қоғамында да қасиетті сапар ретінде құрметтеледі.",
    howToRead: [
      "Сапар алдында толық оқу.",
      "Ресми нұсқаулық пен ұстазбен фиқһты растау.",
      "Жолда қадамдарды қайталау.",
    ],
    action: { kind: "screen", screen: "Hajj" },
  },
  {
    id: "halal",
    group: "faith",
    title: "Халал Даму",
    subtitle: "Сертификат · мекемелер · штрих-код",
    summary:
      "Халал сертификатталған өнімдер мен мекемелер каталогы; штрих-код сканерлеу; жақын маңдағы кәсіпорындар.",
    contents: ["Мекемелер тізімі", "Өнім іздеу", "Штрих-код", "Таңдаулылар"],
    religionLink: "Халал тағам — шариғат талабы; қазақ дастарқанында да халалдық стандартын сақтау маңызды.",
    howToRead: ["Сатып алмас бұрын сканерлеу.", "Күмәнді өнімде ұстазға сұрау.", "Отбасылық тағам тізімін жасау."],
    action: { kind: "screen", screen: "Halal" },
  },
  {
    id: "kurban-ait",
    group: "ait",
    title: "Құрбан айт",
    subtitle: "Намаз · құрбан · қазақи ізет",
    badge: "4 бағыт",
    summary:
      "Құрбан айт: намаз, құрбандық, етті бөлісу, қазақы құттықтау және ысырапсыз қонақтық — алты бағытта күн жоспары.",
    contents: [
      "Мереке жоспары (ғибадат, құрбан, көрші, дастарқан)",
      "Күн бойынша қадамдар",
      "Қазақы құттықтау сөздері",
      "Инфографика және терең қалталар",
    ],
    religionLink: "Құрбан — ниет пен шариғат шегімен орындалатын ғибадат; қазақы қонақжайлық онымен үйлеседі.",
    howToRead: [
      "Мереке алдында алты бағытты отбамен оқу.",
      "Имаммен уақыт пен мал шарттарын растау.",
      "Күн соңында ысырап пен мұқтажды тексеру.",
    ],
    action: { kind: "screen", screen: "KurbanAit" },
  },
  {
    id: "oraza-ait",
    group: "ait",
    title: KAZAKH_TRADITION_ORAZA_AIT_BLOCK_TITLE,
    subtitle: "Намаз · фитр · құттықтау",
    summary:
      "Ораза айт (айт әл-фитр): намаз, фитр садақасы, құттықтау, дастарқан әдебі; оразды бұзатын ұсынудан сақтану.",
    contents: ["Намаз уақыты мен жоспар", "Фитр садақасы", "Қонақ және көрші әдебі", "Балалар мен желідегі құпиялық"],
    religionLink: "Ораза айт — шүкір мен жамағат бірлігі; фитр мен намаз шарттарын ұстазбен нақтылау.",
    howToRead: ["Айт алдында мешіт хабарламасын оқу.", "Фитрді мерзімінде орындау.", "Қысқа, шынайы құттықтау."],
    action: { kind: "scrollBlock", blockTitle: KAZAKH_TRADITION_ORAZA_AIT_BLOCK_TITLE },
  },
  {
    id: "islamic-kb",
    group: "faith",
    title: "Fatua / Muftyat іздеу",
    subtitle: "Локальды база · сілтеме",
    summary:
      "Fatua.kz және Muftyat.kz материалдарынан офлайн іздеу; сұраққа сәйкес үзінділер мен сілтемелер.",
    contents: ["Толық мәтін іздеу", "Fatua.kz нәтижелері", "Muftyat.kz нәтижелері", "Сілтеме арқылы ашу"],
    religionLink: "Ресми фетуа базасы — анықтау көзі; жеке жағдайды ұстазбен толықтырыңыз.",
    howToRead: ["Нақты сөздермен іздеу.", "Түпнұсқа сілтемені ашып оқу.", "Күрделі мәселеде имамға жүгіну."],
    action: { kind: "screen", screen: "OfficialKnowledgePortal" },
  },
  {
    id: "imam-ai",
    group: "faith",
    title: "Сұрақ-жауап (RAQAT AI)",
    subtitle: "Дін мен дәстүр туралы сауатты сұрақ",
    summary:
      "Дәстүр мен шариғат шегін, отбасылық әдепті, намаз мен ораза сияқты тақырыптар бойынша сауатты сұрақ қоюға көмектеседі; нақты фиқһ — ұстазға.",
    contents: ["Текст сұрақ", "Контекст бойынша жауап", "Көп тақырыпты сұрақ"],
    religionLink: "AI жауабы оқулық емес; шешімді мешіт пен білікті ұстазбен растау керек.",
    howToRead: [
      "Нақты, қысқа сұрақ қою.",
      "Жауапты отбада талқылау.",
      "Күрделі жағдайда имамға жүгіну.",
    ],
    action: {
      kind: "screen",
      screen: "ImamAI",
      params: {
        initialPrompt:
          "Қазақ салты мен ислам әдебі қалай үйлеседі? Мысал: қонақ күту, бата, мереке.",
        autoSend: false,
      },
    },
  },
];

export function traditionBookSearchBlob(book: TraditionBookEntry): string {
  return [
    book.title,
    book.subtitle,
    book.badge ?? "",
    book.summary,
    book.contents.join(" "),
    book.religionLink,
    book.howToRead.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

export function getTraditionBooksByGroup(group: TraditionBookGroup): TraditionBookEntry[] {
  return TRADITION_BOOKS.filter((b) => b.group === group);
}

/** Кітаптар бөлімі: дін + айт. */
export const TRADITION_FAITH_AIT_GROUPS = TRADITION_BOOK_GROUPS.filter(
  (g) => g.id === "faith" || g.id === "ait"
);

/** Асыл сөздер бөлімі. */
export const TRADITION_WISDOM_GROUP = TRADITION_BOOK_GROUPS.find((g) => g.id === "wisdom");

export function getFaithBooks(): TraditionBookEntry[] {
  return TRADITION_BOOKS.filter((b) => b.group === "faith");
}

export function getFaithBookShelf(book: TraditionBookEntry): FaithBookShelfId | undefined {
  if (book.group !== "faith") return undefined;
  return FAITH_SHELF_BY_ID[book.id];
}

export function getFaithBooksByShelf(shelf: FaithBookShelfId): TraditionBookEntry[] {
  const order = FAITH_SHELF_ORDER[shelf];
  const byId = new Map(getFaithBooks().map((b) => [b.id, b]));
  return order.map((id) => byId.get(id)).filter((b): b is TraditionBookEntry => b != null);
}

function getBooksScreenFaithBooks(): TraditionBookEntry[] {
  return getFaithBooks().filter((b) => !BOOKS_SCREEN_EXCLUDED_FAITH_IDS.has(b.id));
}

export type CatalogBookSection = {
  id: CatalogBookSectionId;
  books: TraditionBookEntry[];
};

/** Кітаптар экраны: басты бетте қайталанбайтын құралдар + ресми кітаптар + дәстүр нұсқаулықтары. */
export function getCatalogBookSections(): CatalogBookSection[] {
  const traditionById = new Map(getTraditionGuideBooks().map((b) => [b.id, b]));
  const traditionBooks = TRADITION_GUIDE_ORDER.map((id) => traditionById.get(id)).filter(
    (b): b is TraditionBookEntry => b != null
  );

  const officialFatua = getOfficialBooksBySite("fatua");
  const officialMuftyat = getOfficialBooksBySite("muftyat");

  return [
    ...(officialFatua.length ? [{ id: "official-fatua" as const, books: officialFatua }] : []),
    ...(officialMuftyat.length ? [{ id: "official-muftyat" as const, books: officialMuftyat }] : []),
    { id: "tradition-guides", books: traditionBooks },
  ];
}

export function getCatalogBooksForShelf(
  shelf: FaithBookShelfId | "tradition" | "all"
): TraditionBookEntry[] {
  if (shelf === "all") return getCatalogBooksForBooksScreen();
  if (shelf === "tradition") return getTraditionGuideBooks();
  return getFaithBooksByShelf(shelf).filter((b) => !BOOKS_SCREEN_EXCLUDED_FAITH_IDS.has(b.id));
}

export function getAitBooks(): TraditionBookEntry[] {
  return TRADITION_BOOKS.filter((b) => b.group === "ait");
}

/** Кітаптар экраны: басты бетте жоқ құралдар + ресми кітапханалар + дәстүр. */
export function getCatalogBooksForBooksScreen(): TraditionBookEntry[] {
  return [...getBooksScreenFaithBooks(), ...getOfficialBooks(), ...getTraditionGuideBooks()];
}

export function getFaithAitBooks(): TraditionBookEntry[] {
  return [...getFaithBooks(), ...getAitBooks()];
}

export function getWisdomBooks(): TraditionBookEntry[] {
  return TRADITION_BOOKS.filter((b) => b.group === "wisdom");
}

/** Экранда көрсету: алдымен жинақ хабы, керемет шығармалар, содан автор кітаптары. */
export function getKazakhWonderfulBooksForDisplay(): TraditionBookEntry[] {
  const hub = getGreatWordsCatalogBook();
  const highlights = KAZAKH_WONDERFUL_BOOK_HIGHLIGHTS;
  const authors = buildWisdomAuthorBooks();
  const highlightIds = new Set(highlights.map((b) => b.id));
  const hubId = hub?.id;
  return [
    ...(hub ? [hub] : []),
    ...highlights,
    ...authors.filter((b) => b.id !== hubId && !highlightIds.has(b.id)),
  ];
}

export function getTraditionGuideBooks(): TraditionBookEntry[] {
  return TRADITION_BOOKS.filter((b) => b.group === "tradition");
}

/** Кітаптар экранының шолуы: дін + дәстүр (бабалар мен айт жеке). */
export const TRADITION_BOOK_CATALOG_GROUPS = TRADITION_BOOK_GROUPS.filter(
  (g) => g.id === "faith" || g.id === "tradition"
);

export function getTraditionCatalogBooks(): TraditionBookEntry[] {
  return TRADITION_BOOKS;
}

export function getGreatWordsCatalogBook(): TraditionBookEntry | undefined {
  return TRADITION_BOOKS.find((b) => b.id === "great-words");
}

export function getWisdomAuthorBooks(): TraditionBookEntry[] {
  return TRADITION_BOOKS.filter((b) => b.group === "wisdom" && b.id.startsWith("wisdom-"));
}

export function traditionBooksCountByGroup(): Record<TraditionBookGroup, number> {
  return {
    faith: getTraditionBooksByGroup("faith").length,
    ait: getTraditionBooksByGroup("ait").length,
    wisdom: getTraditionBooksByGroup("wisdom").length,
    tradition: getTraditionBooksByGroup("tradition").length,
  };
}
