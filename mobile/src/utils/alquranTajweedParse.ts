/**
 * Al Quran Cloud `quran-tajweed` нұсқасының тақырыпшалы мәтінін
 * (мысалы `[g[`, `[n[`, `[h:1[`) — түс бойынша оқу үшін сегменттерге бөлу.
 * @see https://alquran.cloud/tajweed-guide
 */
import { tajweedStdColor, type TajweedStdColorKey } from "../content/tajweedColorPalette";

export type TajweedRuleKey =
  | "h"
  | "l"
  | "s"
  | "n"
  | "p"
  | "m"
  | "o"
  | "q"
  | "c"
  | "f"
  | "w"
  | "i"
  | "a"
  | "u"
  | "d"
  | "b"
  | "g";

export type TajweedSegment = { text: string; rule?: TajweedRuleKey };

const TAG_OPEN = /^\[([a-z])(?::(\d+))?\[/;

function isRuleKey(c: string): c is TajweedRuleKey {
  return /^[hlsnpmoqcfwiadbug]$/i.test(c);
}

/**
 * Тақырыпшалы мәтінді сегменттерге бөледі; тақырыпшасыз бөліктер rule жоқ.
 */
export function parseAlquranTajweedTaggedText(input: string): TajweedSegment[] {
  const out: TajweedSegment[] = [];
  let i = 0;
  while (i < input.length) {
    if (input[i] !== "[") {
      let j = i;
      while (j < input.length && input[j] !== "[") j += 1;
      if (j > i) out.push({ text: input.slice(i, j) });
      i = j;
      continue;
    }
    const rest = input.slice(i);
    const m = TAG_OPEN.exec(rest);
    if (!m || !isRuleKey(m[1])) {
      out.push({ text: "[" });
      i += 1;
      continue;
    }
    const rule = m[1].toLowerCase() as TajweedRuleKey;
    const openLen = m[0].length;
    const contentStart = i + openLen;
    const closeIdx = input.indexOf("]", contentStart);
    if (closeIdx < 0) {
      out.push({ text: rest });
      break;
    }
    const content = input.slice(contentStart, closeIdx);
    if (content.length) out.push({ text: content, rule });
    i = closeIdx + 1;
  }
  return out;
}

type TajweedWordPart = { text: string; rule?: TajweedRuleKey };

/**
 * QCF4 glyph мәтінінде бір glyph көбіне тұтас сөз болып келеді.
 * Сондықтан тыныш/қосымша тегтерді тұтас сөзге жақпай, айқын ережені ғана көрсетеміз.
 */
/** Тақырыпшаларды алып тастап, оқылатын араб мәтінін қайтарады. */
export function stripTajweedTags(taggedText: string): string {
  return parseAlquranTajweedTaggedText(taggedText)
    .map((seg) => seg.text)
    .join("");
}

export type TajweedWordSpan = { text: string; rule?: TajweedRuleKey };
export type TajweedColoredRun = { text: string; rule?: TajweedRuleKey };

/**
 * Тәжуид тегтерін сегмент бойынша бояу — тек тег ішіндегі әріптер түс алады;
 * ереже келесі әріптерге тарамайды (бір түсте 4/5 әріп боялмауы керек).
 */
export function tajweedColoredRuns(taggedText: string): TajweedColoredRun[] {
  const raw = (taggedText ?? "").trim();
  if (!raw.includes("[")) return [];

  const runs: TajweedColoredRun[] = [];

  for (const segment of parseAlquranTajweedTaggedText(raw)) {
    const text = segment.text;
    let i = 0;
    while (i < text.length) {
      const ws = text.slice(i).match(/^\s+/u);
      if (ws) {
        runs.push({ text: ws[0] });
        i += ws[0].length;
        continue;
      }
      let j = i;
      while (j < text.length && !/\s/u.test(text[j]!)) j += 1;
      const chunk = text.slice(i, j);
      runs.push(segment.rule ? { text: chunk, rule: segment.rule } : { text: chunk });
      i = j;
    }
  }

  const merged: TajweedColoredRun[] = [];
  for (const run of runs) {
    const prev = merged[merged.length - 1];
    if (prev && prev.rule != null && prev.rule === run.rule) {
      prev.text += run.text;
      continue;
    }
    merged.push({ ...run });
  }
  return merged;
}

/**
 * Тәжуид түсін сөз деңгейінде қолдану — әр тег/сегментке жеке Text қоймау
 * (React Native араб байланысын үзіп, әріптерді «жеке-жеке» көрсетеді).
 */
export function tajweedWordColorSpans(
  taggedText: string,
  plainText?: string
): TajweedWordSpan[] {
  const raw = (taggedText ?? "").trim();
  if (!raw.includes("[")) return [];

  const plain = (plainText ?? stripTajweedTags(raw)).trim();
  const words = plain.split(/\s+/u).filter(Boolean);
  if (!words.length) return [];

  const rules = tajweedWholeWordRules(raw);
  return words.map((text, i) => ({
    text,
    rule: rules[i],
  }));
}

export function tajweedWholeWordRules(taggedText: string | null | undefined): Array<TajweedRuleKey | undefined> {
  const raw = (taggedText ?? "").trim();
  if (!raw.includes("[")) return [];

  const out: Array<TajweedRuleKey | undefined> = [];
  let parts: TajweedWordPart[] = [];

  const flush = () => {
    const meaningful = parts.filter((part) => part.text.trim().length > 0);
    if (!meaningful.length) {
      parts = [];
      return;
    }
    const visibleRule = meaningful.find(
      (part) => part.rule && part.rule !== "h" && part.rule !== "l" && part.rule !== "s"
    )?.rule;
    const helperRule = meaningful.find(
      (part) => part.rule === "h" || part.rule === "l" || part.rule === "s"
    )?.rule;
    out.push(visibleRule ?? helperRule);
    parts = [];
  };

  for (const segment of parseAlquranTajweedTaggedText(raw)) {
    for (const chunk of segment.text.split(/(\s+)/u)) {
      if (!chunk) continue;
      if (/^\s+$/u.test(chunk)) {
        flush();
        continue;
      }
      parts.push(segment.rule ? { text: chunk, rule: segment.rule } : { text: chunk });
    }
  }
  flush();
  return out;
}

/**
 * Әр сөз ішіндегі әріп/глиф бойынша тәжуид ережесі (QCF4 glyph түсі үшін).
 * Sajda COLR-ге толық тең емес, бірақ сөз ішіндегі әртүрлі ережелерді көрсетеді.
 */
export function tajweedRulesPerWordChar(
  taggedText: string | null | undefined
): Array<Array<TajweedRuleKey | undefined>> {
  const raw = (taggedText ?? "").trim();
  if (!raw.includes("[")) return [];

  const words: Array<Array<TajweedRuleKey | undefined>> = [];
  let currentWord: Array<TajweedRuleKey | undefined> = [];

  const pushWord = () => {
    if (currentWord.length) words.push(currentWord);
    currentWord = [];
  };

  for (const segment of parseAlquranTajweedTaggedText(raw)) {
    for (const ch of segment.text) {
      if (/\s/u.test(ch)) {
        pushWord();
        continue;
      }
      currentWord.push(segment.rule ?? undefined);
    }
  }
  pushWord();
  return words;
}

export function tajweedRuleForWordGlyph(
  taggedText: string | null | undefined,
  wordIndex: number,
  glyphIndexInWord = 0
): TajweedRuleKey | undefined {
  const perWord = tajweedRulesPerWordChar(taggedText);
  const chars = perWord[wordIndex];
  if (!chars?.length) return tajweedWholeWordRules(taggedText ?? "")[wordIndex];
  const idx = Math.min(Math.max(0, glyphIndexInWord), chars.length - 1);
  if (chars[idx]) return chars[idx];
  for (let i = idx - 1; i >= 0; i -= 1) {
    if (chars[i]) return chars[i];
  }
  return undefined;
}

/** Бір сөз ішіндегі әріптерді тәжуид ережесі бойынша қысқа runs-қа біріктіреді. */
export function tajweedWordCharRuns(
  taggedText: string | null | undefined,
  wordIndex: number,
  plainWord?: string
): TajweedColoredRun[] {
  const raw = (taggedText ?? "").trim();
  if (!raw.includes("[")) return [];

  const word =
    plainWord ??
    stripTajweedTags(raw)
      .split(/\s+/u)
      .filter(Boolean)[wordIndex];
  if (!word) return [];

  const chars = Array.from(word);
  const rules = tajweedRulesPerWordChar(raw)[wordIndex] ?? [];
  const runs: TajweedColoredRun[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const rule = i < rules.length ? rules[i] : undefined;
    const prev = runs[runs.length - 1];
    if (prev && prev.rule === rule) {
      prev.text += ch;
    } else {
      runs.push(rule ? { text: ch, rule } : { text: ch });
    }
  }
  return runs;
}

/** Сөз ішінде тек бірнеше әріп түстелсе — QCF4 glyph орнына әріп бойынша бояу керек. */
export function tajweedWordHasPerLetterColoring(
  taggedText: string | null | undefined,
  wordIndex: number
): boolean {
  const rules = tajweedRulesPerWordChar(taggedText)[wordIndex];
  if (!rules?.length) return false;
  const normalized = rules.map((rule) => rule ?? null);
  const tagged = normalized.filter((rule) => rule != null);
  if (!tagged.length) return false;
  return !(tagged.length === normalized.length && new Set(tagged).size === 1);
}

/** Түсті топтар: легенда/fallback үшін (Al Quran Cloud топтары). */
export type TajweedColorGroup =
  | "madd"
  | "qalqalah"
  | "ghunnahIkhfa"
  | "idgham"
  | "silent"
  | "hamzaWasl"
  | "lamShamsi"
  | "other";

export function tajweedRuleToColorGroup(rule: TajweedRuleKey): TajweedColorGroup {
  switch (rule) {
    case "n":
    case "p":
    case "m":
    case "o":
      return "madd";
    case "q":
      return "qalqalah";
    case "g":
    case "f":
    case "c":
    case "i":
      return "ghunnahIkhfa";
    case "a":
    case "u":
    case "w":
    case "d":
    case "b":
      return "idgham";
    case "s":
      return "silent";
    case "h":
      return "hamzaWasl";
    case "l":
      return "lamShamsi";
    default:
      return "other";
  }
}

function groupToStdKey(group: TajweedColorGroup): TajweedStdColorKey {
  switch (group) {
    case "madd":
      return "madd";
    case "qalqalah":
      return "qalqalah";
    case "ghunnahIkhfa":
      return "ghunnahIkhfa";
    case "idgham":
      return "idgham";
    case "silent":
    case "hamzaWasl":
    case "lamShamsi":
    case "other":
    default:
      return "neutral";
  }
}

export function tajweedColorForGroup(group: TajweedColorGroup, isDark: boolean): string {
  return tajweedStdColor(groupToStdKey(group), isDark);
}
