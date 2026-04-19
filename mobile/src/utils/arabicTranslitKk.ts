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
  return /[аеёиоуыіәөүұү]$/i.test(last);
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
    .filter((ch) => !MARK_RE.test(ch) && !STOP_MARKS.has(ch) && ch !== "ـ")
    .join("");
  const collapsed = markless.replace(/\s+/g, " ").trim();
  if (collapsed === BASMALA) return "бисмилләһир-рахманир-рахим";

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
  result = result.replace(/[\u0600-\u06FF\uFE70-\uFEFF]+/g, "");
  result = result.replace(/\s{2,}/g, " ").trim();
  return result;
}
