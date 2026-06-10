/**
 * Al Quran Cloud `quran-tajweed` нұсқасының тақырыпшалы мәтінін
 * (мысалы `[g[`, `[n[`, `[h:1[`) — түс бойынша оқу үшін сегменттерге бөлу.
 * @see https://alquran.cloud/tajweed-guide
 */
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

/** Түсті топтар: легенда үшін (Sajda-style топтау) */
export type TajweedColorGroup = "madd" | "qalqalah" | "ghunnahIkhfa" | "silent" | "hamzaWasl" | "lamShamsi" | "other";

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
    case "w":
    case "i":
    case "a":
    case "u":
    case "d":
    case "b":
      return "ghunnahIkhfa";
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

export function tajweedColorForGroup(group: TajweedColorGroup, isDark: boolean): string {
  if (isDark) {
    switch (group) {
      case "madd":
        return "#fdba74";
      case "qalqalah":
        return "#7dd3fc";
      case "ghunnahIkhfa":
        return "#6ee7b7";
      case "silent":
        return "#b6bcc6";
      case "hamzaWasl":
        return "#c4c4c8";
      case "lamShamsi":
        return "#67e8f9";
      default:
        return "#f0f0f3";
    }
  }
  switch (group) {
    case "madd":
      return "#ea580c";
    case "qalqalah":
      return "#2563eb";
    case "ghunnahIkhfa":
      return "#16a34a";
    case "silent":
      return "#5f6b7a";
    case "hamzaWasl":
      return "#5c6370";
    case "lamShamsi":
      return "#0284c7";
    default:
      return "#27272a";
  }
}
