import type { RootStackParamList } from "../navigation/types";

/**
 * Дауыспен нәтиже: навигация, артқа, немесе бос.
 * Кеңейту: RULES-қа қосу (алдымен нақты тіркестер, сосын қысқалар).
 * Siri-тәрізді бүкіл қосымша орталығы: осыны бірден кеңейту керек.
 */
export type VoiceCommandOutcome =
  | {
      kind: "navigate";
      screen: keyof RootStackParamList;
      params?: Record<string, unknown>;
    }
  | { kind: "back" }
  | { kind: "none" };

type Rule = {
  id: string;
  keywords: string[];
  /** Егер true болса, keywords-тың бәрі болуы керек */
  requireAll?: boolean;
  outcome: () => VoiceCommandOutcome;
};

function nav(
  screen: keyof RootStackParamList,
  params?: Record<string, unknown>
): VoiceCommandOutcome {
  return { kind: "navigate", screen, params };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ё/g, "е")
    .replace(/[’'`"]/g, "")
    .replace(/[.,!?;:()[\]{}]/g, " ");
}

/** Қазақ/орыс аралас тану үшін жұмсартылған нұсқа */
function foldForVoice(s: string): string {
  return norm(s)
    .replace(/[ә]/g, "а")
    .replace(/[і]/g, "и")
    .replace(/[ң]/g, "н")
    .replace(/[ғ]/g, "г")
    .replace(/[үұ]/g, "у")
    .replace(/[қ]/g, "к")
    .replace(/[ө]/g, "о")
    .replace(/[һ]/g, "х")
    .replace(/\s+/g, " ")
    .trim();
}

function hasRuleMatch(t: string, tf: string, rule: Rule): boolean {
  if (!rule.keywords.length) return false;
  const checks = rule.keywords.map((k) => {
    const nk = norm(k);
    const fk = foldForVoice(k);
    return t.includes(nk) || tf.includes(fk);
  });
  return rule.requireAll ? checks.every(Boolean) : checks.some(Boolean);
}

const RULES: readonly Rule[] = [
  {
    id: "back",
    keywords: ["артқа", "кері", "назад", "артка", "return back", "go back"],
    outcome: () => ({ kind: "back" }),
  },
  { id: "qibla", keywords: ["құбыла", "кыбла", "кібла", "qibla", "кыбыла", "кибла", "قبلة"], outcome: () => nav("Qibla") },
  {
    id: "prayer_times",
    keywords: [
      "намаз уақыт",
      "уақыт намаз",
      "намаз вак",
      "намаз уақыты",
      "prayer time",
      "время молитв",
      "время намаз",
    ],
    outcome: () => nav("PrayerTimes"),
  },
  {
    id: "prayer_times_short",
    keywords: ["уақыт", "время", "намаз"],
    requireAll: false,
    outcome: () => nav("PrayerTimes"),
  },
  {
    id: "duas",
    keywords: ["дұға", "дуға", "дуа", "дұғалар", "dua", "дұғам"],
    outcome: () => nav("Main", { screen: "Duas", params: { screen: "DuasHome" } }),
  },
  {
    id: "tasbih",
    keywords: ["тәспі", "таспих", "тасbih", "tasbih", "зікір", "зикр", "субха"],
    outcome: () => nav("Main", { screen: "Tasbih", params: { screen: "TasbihList" } }),
  },
  { id: "asma", keywords: ["99 есім", "тоқсан тоғыз", "есімдер", "asma", "аль-асма", "аль асма", "99 имен"], outcome: () => nav("AsmaAlHusna") },
  {
    id: "home",
    keywords: ["басты бет", "үйге", "домой", "главная", "home", "raqat басы"],
    outcome: () => nav("Main", { screen: "Home" }),
  },
  {
    id: "ai_extra",
    keywords: ["raqat ai", "рақат аи", "көмекші", "помощник", "assistant", "чат"],
    outcome: () => nav("MoreStack", { screen: "RaqatAI" }),
  },
  { id: "halal", keywords: ["халал", "харам", "helal", "halal", "харам емес"], outcome: () => nav("MoreStack", { screen: "Halal" }) },
  { id: "halal_scan", keywords: ["скан", "scan", "штрихкод", "barcode", "этикетка"], outcome: () => nav("MoreStack", { screen: "Halal" }) },
  { id: "quran", keywords: ["құран", "куран", "quran", "коран", "сура"], outcome: () => nav("MoreStack", { screen: "QuranList" }) },
  { id: "hadith", keywords: ["хадис", "hadith", "hadis", "әдис"], outcome: () => nav("MoreStack", { screen: "HadithList" }) },
  { id: "tajweed", keywords: ["тәжуид", "тажвид", "tajweed", "тәжуід", "араб әріп"], outcome: () => nav("MoreStack", { screen: "TajweedGuide" }) },
  {
    id: "namaz_guide",
    keywords: ["намаз нұсқау", "намаз оқу", "намаз үйрен", "wudu", "уәду", "вуду", "ғұсыл", "у инструкц"],
    outcome: () => nav("MoreStack", { screen: "NamazGuide" }),
  },
  { id: "settings", keywords: ["баптау", "параметр", "настройк", "settings", "setting"], outcome: () => nav("MoreStack", { screen: "Settings" }) },
  { id: "content", keywords: ["мазмұн", "контент", "тізім", "hub"], outcome: () => nav("MoreStack", { screen: "ContentHub" }) },
  { id: "seerah", keywords: ["сира", "сийра", "sira", "seerah", "өмірі пайғамбар"], outcome: () => nav("MoreStack", { screen: "Seerah" }) },
  { id: "hatim", keywords: ["хатим", "хатым", "hatim", "хатм"], outcome: () => nav("MoreStack", { screen: "Hatim" }) },
  { id: "hajj", keywords: ["хадж", "hajj", "қажылық", "паломнич"], outcome: () => nav("MoreStack", { screen: "Hajj" }) },
  { id: "community_dua", keywords: ["қауым дұғас", "community dua", "жалпы дұға"], outcome: () => nav("MoreStack", { screen: "CommunityDua" }) },
  { id: "ecosystem", keywords: ["экожүйе", "ecosystem", "экосистем", "тұтас"], outcome: () => nav("MoreStack", { screen: "Ecosystem" }) },
  { id: "telegram", keywords: ["телеграм", "telegram", "канал", "тг"], outcome: () => nav("MoreStack", { screen: "TelegramInfo" }) },
  { id: "voice_settings", keywords: ["микрофон", "дауыс", "voice control", "голос"], outcome: () => nav("MoreStack", { screen: "Settings" }) },
];

function hasTokenAi(t: string): boolean {
  if (t.includes("raqat") && t.includes("ai")) return true;
  return /(^|[\s,;:])(аи|ai)($|[\s,.;:!?])/i.test(t);
}

/**
 * Мәтін → команда. Қазақ / орыс / ағылшын түйін сөздер.
 */
export function matchVoiceCommand(transcript: string): VoiceCommandOutcome {
  const t = norm(transcript);
  const tf = foldForVoice(transcript);
  if (!t) return { kind: "none" };

  if (t === "басты" || t.startsWith("басты ")) {
    return nav("Main", { screen: "Home" });
  }

  if (hasTokenAi(t)) {
    return nav("MoreStack", { screen: "RaqatAI" });
  }

  for (const rule of RULES) {
    if (hasRuleMatch(t, tf, rule)) {
      return rule.outcome();
    }
  }
  if ((t.includes("ai") || t.includes("аи")) && t.length < 20) {
    return nav("MoreStack", { screen: "RaqatAI" });
  }

  return { kind: "none" };
}

/**
 * Siri-стил навигациялық контекст: қысқа мерзім жад тану.
 * (Expo start contextualStrings)
 */
export const VOICE_RECOGNITION_CONTEXT_HINTS: string[] = Array.from(
  new Set(
    RULES.flatMap((r) => r.keywords)
      .concat([
        "RAQAT",
        "мазмұн",
        "басты",
        "құран",
        "сура",
        "көмекші",
        "сыра",
        "хатим",
      ])
      .map((s) => s.trim())
      .filter((s) => s.length > 1)
  )
);

/** Дауыспен растау: kk.voiceAssistant кілті (артқа — контекстте бөлек) */
export function confirmationPhraseFor(outcome: VoiceCommandOutcome): string | null {
  if (outcome.kind !== "navigate") return null;
  const { screen, params } = outcome;
  if (screen === "Qibla") return "voiceAssistant.openedQibla";
  if (screen === "PrayerTimes") return "voiceAssistant.openedPrayerTimes";
  if (screen === "AsmaAlHusna") return "voiceAssistant.openedAsma";
  if (screen === "Main") {
    const tab = (params?.screen as string | undefined) ?? "";
    if (tab === "Home") return "voiceAssistant.openedHome";
    if (tab === "Duas") return "voiceAssistant.openedDuas";
    if (tab === "Tasbih") return "voiceAssistant.openedTasbih";
  }
  if (screen === "MoreStack") {
    const s = (params?.screen as string | undefined) ?? "";
    if (s === "RaqatAI") return "voiceAssistant.openedAi";
    if (s === "Halal") return "voiceAssistant.openedHalal";
    if (s === "QuranList") return "voiceAssistant.openedQuran";
    if (s === "HadithList") return "voiceAssistant.openedHadith";
    if (s === "TajweedGuide") return "voiceAssistant.openedTajweed";
    if (s === "NamazGuide") return "voiceAssistant.openedNamazGuide";
    if (s === "Settings") return "voiceAssistant.openedSettings";
    if (s === "ContentHub") return "voiceAssistant.openedContentHub";
    if (s === "Seerah") return "voiceAssistant.openedSeerah";
    if (s === "Hatim") return "voiceAssistant.openedHatim";
    if (s === "Hajj") return "voiceAssistant.openedHajj";
    if (s === "CommunityDua") return "voiceAssistant.openedCommunityDua";
    if (s === "Ecosystem") return "voiceAssistant.openedEcosystem";
    if (s === "TelegramInfo") return "voiceAssistant.openedTelegram";
  }
  return null;
}
