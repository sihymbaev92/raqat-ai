/**
 * Араб мәтінді қазақ кириллицасына жақын транскрипциялау.
 * Сервердегі services/quran_translit.py әдепкі жолының қысқартылған порты
 * (хадис/қысқа үзінділер үшін; Фатиха педагогикалық үлгісі жоқ).
 */

const BASE_MAP: Record<string, string> = {
  ء: "'",
  أ: "а",
  إ: "и",
  ؤ: "у",
  ئ: "и",
  ا: "а",
  آ: "аа",
  ٱ: "а",
  ب: "б",
  ة: "а",
  ت: "т",
  ث: "с",
  ج: "ж",
  ح: "х",
  خ: "х",
  د: "д",
  ذ: "з",
  ر: "р",
  ز: "з",
  س: "с",
  ش: "ш",
  ص: "с",
  ض: "д",
  ط: "т",
  ظ: "з",
  ع: "'",
  غ: "ғ",
  ف: "ф",
  ق: "қ",
  ك: "к",
  ل: "л",
  م: "м",
  ن: "н",
  ه: "һ",
  و: "у",
  ي: "й",
  ى: "а",
  پ: "п",
  چ: "ч",
  ژ: "ж",
  گ: "г",
};

const VOWEL_MAP: Record<string, string> = {
  "\u064e": "а",
  "\u064f": "у",
  "\u0650": "и",
  "\u064b": "ан",
  "\u064c": "ун",
  "\u064d": "ин",
  "\u0670": "а",
};

const IGNORED = new Set(["\u0652"]);
const STOP_MARKS = new Set([
  "ۖ",
  "ۗ",
  "ۘ",
  "ۙ",
  "ۚ",
  "ۛ",
  "ۜ",
  "۝",
  "۞",
  "\u06e9",
]);

const PUNCT_MAP: Record<string, string> = {
  "،": ",",
  "؛": ";",
  "؟": "?",
};

const BASMALA = "بسم الله الرحمن الرحيم";

/** Құран басмаласының қазақ транскрипциясы (барлық жолдарда бір нұсқа). */
export const BASMALA_KK_TRANSLIT_CANON = "бисмилләһир рахманир рахиим";

/** ٱ (U+0671) және т.б. Uthmani нұсқаларын эталон салыстыру үшін біркелкілеу. */
function canonicalArabicMarklessForCompare(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/\ufeff/g, "")
    .split("")
    .filter((ch) => !MARK_RE.test(ch) && !STOP_MARKS.has(ch) && ch !== "ـ")
    .join("")
    .replace(/\u0671/g, "\u0627")
    .replace(/\s+/g, " ")
    .trim();
}

const SUN_LETTERS = ["т", "с", "ш", "д", "з", "р", "н"] as const;
const MOON_AFTER_AL = ["ф", "қ", "к", "б", "ж", "х", "ғ", "м", "һ", "'", "у", "й"] as const;
const VOWEL_ENDINGS = ["а", "у", "и"] as const;
const PAUSAL_KEEP_WORDS = new Set([
  "бисми",
  "бисмилләһи",
  "бисмилләһир",
  "рахманир",
  "рахиим",
  "мадина",
  "медина",
  "әр-рахмани",
  "әр-рахим",
  "әр-рахман",
]);
const PAUSAL_EXACT_REPLACE: Record<string, string> = {
  аһдина: "иһдин",
  "ас-сирата": "ас-сират",
  сирата: "сират",
};
const GRAMMAR_WA_FA_PARTICLES: Array<[string, string]> = [
  ["уалақад", "үә лақад"],
  ["уалакинна", "үә лакинна"],
  ["уалакин", "үә лакин"],
  ["уалау", "үә лау"],
  ["уаинна", "үә инна"],
  ["уаиза", "үә иза"],
  ["уақул", "үә қул"],
  ["уама", "үә ма"],
  ["уала", "үә ла"],
  ["уақад", "үә қад"],
  ["уаби", "үә би"],
  ["уали", "үә ли"],
  ["уанна", "үә анна"],
  ["уаһуа", "үә һуа"],
  ["уаһум", "үә һум"],
  ["уаһунна", "үә һунна"],
  ["уаһи", "үә һи"],
  ["фаинна", "фа инна"],
  ["фаиза", "фа иза"],
  ["фалам", "фа лам"],
  ["фаман", "фа ман"],
  ["фама", "фа ма"],
  ["фала", "фа ла"],
];

const MARK_RE = /\p{M}/u;

function splitClusters(text: string): { base: string; marks: string[] }[] {
  const clusters: { base: string; marks: string[] }[] = [];
  let base = "";
  let marks: string[] = [];

  for (const char of text) {
    if (char === "\ufeff") continue;
    if (char === " " || char === "\n" || char === "\t") {
      if (base) {
        clusters.push({ base, marks });
        base = "";
        marks = [];
      }
      clusters.push({ base: char === " " ? " " : " ", marks: [] });
      continue;
    }
    if (MARK_RE.test(char)) {
      if (base) marks.push(char);
      continue;
    }
    if (base) {
      clusters.push({ base, marks });
    }
    base = char;
    marks = [];
  }
  if (base) clusters.push({ base, marks });
  return clusters;
}

function repeatShadda(core: string, hasShadda: boolean): string {
  if (!hasShadda || !core || core === "'") return core;
  return core[0] + core;
}

function endsWithVowel(parts: string[]): boolean {
  if (!parts.length) return false;
  const last = parts[parts.length - 1];
  return VOWEL_ENDINGS.some((v) => last.endsWith(v));
}

function escapeRegExp(v: string): string {
  return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** JS `\\b` тек ascii \\w үшін; кирилл транскрипциясында Unicode шекара. */
const CYR_WB_START = "(?<![\\p{L}\\p{M}])";
const CYR_WB_END = "(?![\\p{L}\\p{M}])";

function applyPausalIrabTrim(text: string): string {
  if (!text) return text;
  const trimWord = (word: string): string => {
    if (PAUSAL_KEEP_WORDS.has(word) || word.length < 3) return word;
    if (PAUSAL_EXACT_REPLACE[word]) return PAUSAL_EXACT_REPLACE[word];
    let w = word;
    for (const [oldSuf, newSuf] of [
      ["ими", "им"],
      ["ани", "ан"],
      ["ини", "ин"],
      ["има", "им"],
      ["ину", "ин"],
      ["ина", "ин"],
      ["ики", "ик"],
    ] as Array<[string, string]>) {
      if (w.length > oldSuf.length + 1 && w.endsWith(oldSuf)) {
        w = w.slice(0, -oldSuf.length) + newSuf;
        break;
      }
    }
    if (w.endsWith("ми") && w.length > 4 && !PAUSAL_KEEP_WORDS.has(w)) {
      w = `${w.slice(0, -2)}м`;
    }
    return w;
  };
  return text
    .split(/(\s+)/)
    .map((chunk) => (chunk.trim() ? trimWord(chunk) : chunk))
    .join("");
}

function transliterateCluster(base: string, marks: string[], parts: string[]): string {
  if (base === " " || base === "\n") return " ";
  const punct = PUNCT_MAP[base];
  if (punct) return punct;
  if (STOP_MARKS.has(base) || base === "ـ") return "";

  const hasShadda = marks.includes("\u0651");
  const hasSukun = marks.includes("\u0652");
  let vowel = "";
  if (!hasSukun) {
    for (const m of marks) {
      if (VOWEL_MAP[m]) {
        vowel = VOWEL_MAP[m];
        break;
      }
      if (IGNORED.has(m)) continue;
    }
  }

  if (base === "آ") return "аа";
  if (base === "ا" || base === "ٱ" || base === "ى") {
    return vowel || "а";
  }
  if (base === "و") {
    if (vowel) return repeatShadda("у", hasShadda) + vowel;
    return "у";
  }
  if (base === "ي") {
    if (vowel) return repeatShadda("й", hasShadda) + vowel;
    return endsWithVowel(parts) ? "и" : "й";
  }
  if (base === "ة") return vowel ? "т" + vowel : "а";

  const core = BASE_MAP[base];
  if (core === undefined) return base;

  return repeatShadda(core, hasShadda) + vowel;
}

/** Арабтан қазақ транскрипциясы (оқуға көмек; ғылыми транскрипция емес). */
export function transliterateArabicToKazakh(text: string): string {
  const normalized = (text || "").normalize("NFKC");
  const markless = [...normalized]
    .filter((ch) => ch !== "\ufeff" && !MARK_RE.test(ch) && !STOP_MARKS.has(ch) && ch !== "ـ")
    .join("");
  const collapsed = markless.replace(/\s+/g, " ").trim();
  if (canonicalArabicMarklessForCompare(collapsed) === canonicalArabicMarklessForCompare(BASMALA)) {
    return BASMALA_KK_TRANSLIT_CANON;
  }

  const parts: string[] = [];
  for (const { base, marks } of splitClusters(normalized)) {
    const piece = transliterateCluster(base, marks, parts);
    if (!piece) continue;
    if (piece === " " && (!parts.length || parts[parts.length - 1] === " ")) continue;
    parts.push(piece);
  }

  let result = parts.join("").trim();
  result = result.replace(/([аәеёиоөұүыі])\1+/gi, "$1");
  result = result.replace(/ии(?=й)/g, "и");
  result = result.replace(/(.)\1{2,}/g, "$1$1");
  for (const letter of SUN_LETTERS) {
    const re = new RegExp(`${CYR_WB_START}ал${letter}${letter}`, "gu");
    result = result.replace(re, `ә${letter}-${letter}`);
  }
  for (const moon of MOON_AFTER_AL) {
    const esc = escapeRegExp(moon);
    result = result.replace(new RegExp(`${CYR_WB_START}биал${esc}`, "gu"), `би әл-${moon}`);
    result = result.replace(new RegExp(`${CYR_WB_START}уал${esc}`, "gu"), `уа әл-${moon}`);
    result = result.replace(new RegExp(`(^|[\\s،؛(])ал${esc}`, "g"), `$1әл-${moon}`);
    result = result.replace(new RegExp(`${CYR_WB_START}лил${esc}`, "gu"), `ли әл-${moon}`);
  }
  result = result.replace(new RegExp(`${CYR_WB_START}биалл`, "gu"), "би алл");
  result = result.replace(new RegExp(`${CYR_WB_START}абиалл`, "gu"), "а би алл");
  result = result.replace(new RegExp(`${CYR_WB_START}лилл`, "gu"), "ли алл");
  result = result.replace(new RegExp(`${CYR_WB_START}калл`, "gu"), "ка алл");
  result = result.replace(new RegExp(`${CYR_WB_START}уабиалл`, "gu"), "уа би алл");
  result = result.replace(new RegExp(`${CYR_WB_START}фабиалл`, "gu"), "фа би алл");
  result = result.replace(new RegExp(`${CYR_WB_START}уалилл`, "gu"), "уа ли алл");
  result = result.replace(new RegExp(`${CYR_WB_START}фалилл`, "gu"), "фа ли алл");
  for (const [src, dst] of GRAMMAR_WA_FA_PARTICLES) {
    result = result.replace(
      new RegExp(`${CYR_WB_START}${escapeRegExp(src)}${CYR_WB_END}`, "gu"),
      dst
    );
  }
  result = applyPausalIrabTrim(result);
  result = result.replace(new RegExp(`${CYR_WB_START}фиа${CYR_WB_END}`, "gu"), "фи");
  result = result.replace(new RegExp(`${CYR_WB_START}уамин${CYR_WB_END}`, "gu"), "үә мин");
  /* بِسْمِ + اللَّهِ — «бисми алләһи» бір сөзге жақындау */
  result = result.replace(new RegExp(`${CYR_WB_START}бисми\\s+алләһи${CYR_WB_END}`, "gui"), "бисмилләһи");
  result = result.replace(new RegExp(`${CYR_WB_START}бисми\\s+аллаһи${CYR_WB_END}`, "gui"), "бисмилләһи");
  result = result.replace(/\s+([,;?.])/g, "$1");
  result = result.replace(/[\u0600-\u06FF\uFE70-\uFEFF]+/g, "");
  result = result.replace(/\s{2,}/g, " ").trim();
  return result;
}
