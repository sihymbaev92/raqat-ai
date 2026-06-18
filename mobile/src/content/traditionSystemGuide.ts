import type { TraditionTopicCategory } from "./kazakhTraditionTopicStats";
import {
  getTraditionTopics,
  traditionCategoryLabel,
  type TraditionTopic,
} from "./traditionTopicsCatalog";

export type TraditionPracticeLaneId = "family" | "ceremony" | "social" | "faith";

export type TraditionPracticeLane = {
  id: TraditionPracticeLaneId;
  category: TraditionTopicCategory;
  title: string;
  subtitle: string;
  method: string;
  topicCount: number;
  topicIds: string[];
};

export type TraditionUnderstandingStep = {
  id: "purpose" | "religion" | "limit" | "apply";
  title: string;
  body: string;
  action: string;
};

const LANE_RECOMMENDATIONS: Record<TraditionPracticeLaneId, string[]> = {
  family: ["besikke-salu", "tusaukeser", "qudalyk", "qyz-uzatu"],
  ceremony: ["shildehana", "at-qoyu-aqiqa", "sundet-toi", "betashar", "nauryz"],
  social: ["qonaq-kutu", "asar", "salem-beru", "bata-beru", "qurban-et-bolisu"],
  faith: ["bata-beru", "salem-beru", "qurban-et-bolisu", "at-qoyu-aqiqa", "sundet-toi"],
};

const LANE_META: Record<
  TraditionPracticeLaneId,
  Pick<TraditionPracticeLane, "category" | "title" | "subtitle" | "method">
> = {
  family: {
    category: "family",
    title: "Отбасылық тәрбие",
    subtitle: "Бала, ата-ана, жеті ата, неке алдындағы жауапкершілік",
    method: "Мақсатын түсін → отбасыға зиян келтірме → батамен бекіт",
  },
  ceremony: {
    category: "ceremony",
    title: "Рәсім мен той әдебі",
    subtitle: "Шілдехана, сүндет, құдалық, беташар сияқты жиындарды реттеу",
    method: "Қауіпсіздік → келісім → ысырапсыз формат → қысқа дұға",
  },
  social: {
    category: "social",
    title: "Қоғамдық әдеп",
    subtitle: "Қонақ, көрші, асар, сәлем, көппен қатынас",
    method: "Адам құқығын сақта → риясыз көмектес → ренжітпе",
  },
  faith: {
    category: "faith",
    title: "Дінмен үндес тұсы",
    subtitle: "Аят, хадис, дұға, шариғи шек және күмәнді ырымды ажырату",
    method: "Ақидаға қайшы емес пе? Ғибадатты бұзбай ма? Әдеп сақтала ма?",
  },
};

export function getTraditionPracticeLanes(topics: TraditionTopic[] = getTraditionTopics()): TraditionPracticeLane[] {
  return (Object.keys(LANE_META) as TraditionPracticeLaneId[]).map((id) => {
    const meta = LANE_META[id];
    const categoryTopics = topics.filter((topic) => topic.categories.includes(meta.category));
    const availableIds = new Set(topics.map((topic) => topic.id));
    const recommended = LANE_RECOMMENDATIONS[id].filter((topicId) => availableIds.has(topicId));
    const fallback = categoryTopics.map((topic) => topic.id).filter((topicId) => !recommended.includes(topicId));
    return {
      id,
      ...meta,
      topicCount: categoryTopics.length,
      topicIds: [...recommended, ...fallback].slice(0, 6),
    };
  });
}

export function getTraditionUnderstandingChecklist(): string[] {
  return getTraditionUnderstandingSteps().map((step) => `${step.title}: ${step.body}`);
}

export function getTraditionUnderstandingSteps(): TraditionUnderstandingStep[] {
  return [
    {
      id: "purpose",
      title: "Мақсаты",
      body: "Салт адамға қандай тәрбие, мейірім немесе жауапкершілік береді?",
      action: "Ниетін анықта",
    },
    {
      id: "religion",
      title: "Дінмен байланысы",
      body: "Дұға, тазалық, туыстық, жәрдем немесе әдеппен қалай ұштасады?",
      action: "Ізгі мағынасын тап",
    },
    {
      id: "limit",
      title: "Шегі",
      body: "Ырым, ысырап, мәжбүрлеу, мақтан немесе харам араласпай ма?",
      action: "Қауіпті тұсын ажырат",
    },
    {
      id: "apply",
      title: "Қолдану",
      body: "Бүгін отбасыда қысқа, түсінікті, қауіпсіз түрде қалай жасаймыз?",
      action: "Отбасына бейімде",
    },
  ];
}

export function traditionLaneCategoryLabel(lane: TraditionPracticeLane): string {
  return traditionCategoryLabel(lane.category);
}
