/** flutter_html `<font color="...">` тәжуид мәтіні — React Native Text span-дарына бөлу. */

import {
  tajweedOfficialColorFromHex,
  tajweedStdColor,
  type TajweedStdColorKey,
} from "../content/tajweedColorPalette";

export type HtmlFontTajweedRun = { text: string; color?: string };

const FONT_OPEN = /<font\s+color\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))\s*>/gi;

/**
 * Белгісіз / ескі hex → топтық өкіл (Al Quran Cloud топтары).
 * Ресми hex үшін `tajweedOfficialColorFromHex` қолданылады.
 */
const HTML_HEX_TO_STD: Record<string, TajweedStdColorKey> = {
  // мәдд (көк)
  "537fff": "madd",
  "4050ff": "madd",
  "000ebc": "madd",
  "2144c1": "madd",
  dd2c00: "madd",
  dd0000: "madd",
  ea580c: "madd",
  // қалқала (қызыл) — Al Quran Cloud #DD0008
  dd0008: "qalqalah",
  "1a237e": "qalqalah",
  "2563eb": "qalqalah",
  // ғунна / ихфа / иқлаб
  ff7e1e: "ghunnahIkhfa",
  "00c853": "ghunnahIkhfa",
  "009900": "ghunnahIkhfa",
  "16a34a": "ghunnahIkhfa",
  "9400a8": "ghunnahIkhfa",
  aa00ff: "ghunnahIkhfa",
  d500b7: "ghunnahIkhfa",
  "26bffd": "ghunnahIkhfa",
  // идғам
  "169777": "idgham",
  "169200": "idgham",
  "58b800": "idgham",
  ffd600: "idgham",
  ffff00: "idgham",
  ffcc00: "idgham",
  // нейтрал
  aaaaaa: "neutral",
  a1a1a1: "neutral",
};

function normalizeHtmlColor(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const c = raw.trim();
  if (!c) return undefined;
  return c.startsWith("#") ? c : `#${c}`;
}

function htmlHexKey(hex: string): string {
  return hex.replace(/^#/, "").toLowerCase();
}

/** HTML түсті Al Quran Cloud тобына жинақтау (ресми емес hex үшін). */
export function classifyTajweedHtmlHex(hex: string | undefined): TajweedStdColorKey {
  if (!hex) return "neutral";
  const key = htmlHexKey(hex);
  if (HTML_HEX_TO_STD[key]) return HTML_HEX_TO_STD[key]!;
  if (/^53|^40|^00[0-9a-f]e|^21|^dd2|^dd0[0-7]|^ea58/i.test(key)) return "madd";
  if (/^dd0008|^1a23|^2563/i.test(key)) return "qalqalah";
  if (/^ff7e|^00c8|^0099|^16a3|^94|^aa00|^d500|^26bf/i.test(key)) return "ghunnahIkhfa";
  if (/^169|^58b8|^ffd6|^ffff|^ffcc/i.test(key)) return "idgham";
  return "neutral";
}

export function normalizeTajweedHtmlColor(
  raw: string | undefined,
  isDark: boolean
): string | undefined {
  const hex = normalizeHtmlColor(raw);
  if (!hex) return undefined;
  const official = tajweedOfficialColorFromHex(hex, isDark);
  if (official) return official;
  return tajweedStdColor(classifyTajweedHtmlHex(hex), isDark);
}

/** `<font color>` тегтерін span сегменттерге ayır; width шектемей inline рендер. */
export function htmlFontTajweedRuns(input: string, isDark = false): HtmlFontTajweedRun[] {
  const out: HtmlFontTajweedRun[] = [];
  let i = 0;
  const s = input ?? "";
  while (i < s.length) {
    const rest = s.slice(i);
    FONT_OPEN.lastIndex = 0;
    const m = FONT_OPEN.exec(rest);
    if (!m || m.index !== 0) {
      const nextOpen = rest.search(/<font\s+color/i);
      const end = nextOpen >= 0 ? nextOpen : rest.length;
      if (end > 0) out.push({ text: rest.slice(0, end) });
      i += nextOpen >= 0 ? nextOpen : rest.length;
      continue;
    }
    const rawColor = m[1] ?? m[2] ?? m[3];
    const color = normalizeTajweedHtmlColor(rawColor, isDark);
    const contentStart = i + m[0].length;
    const closeIdx = s.indexOf("</font>", contentStart);
    if (closeIdx < 0) {
      out.push({ text: s.slice(i) });
      break;
    }
    const content = s.slice(contentStart, closeIdx);
    if (content.length) out.push({ text: content, color });
    i = closeIdx + "</font>".length;
  }
  return out.filter((r) => r.text.length > 0);
}

export function stripHtmlFontTajweedTags(input: string): string {
  return htmlFontTajweedRuns(input).map((r) => r.text).join("");
}

export function isHtmlFontTajweedText(input: string | null | undefined): boolean {
  return /<font\s+color/i.test(input ?? "");
}
