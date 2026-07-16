/** flutter_html `<font color="...">` тәжуид мәтіні — React Native Text span-дарына бөлу. */

import { tajweedStdColor, type TajweedStdColorKey } from "../content/tajweedColorPalette";

export type HtmlFontTajweedRun = { text: string; color?: string };

const FONT_OPEN = /<font\s+color\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))\s*>/gi;

/** Al Quran Cloud HTML `<font color>` → 4 стандарт түс. */
const HTML_HEX_TO_STD: Record<string, TajweedStdColorKey> = {
  dd2c00: "madd",
  dd0000: "madd",
  dd0008: "madd",
  ea580c: "madd",
  ff7e1e: "madd",
  "000ebc": "madd",
  "2144c1": "madd",
  "4050ff": "madd",
  "537fff": "madd",
  "00c853": "ghunnahIkhfa",
  "009900": "ghunnahIkhfa",
  "16a34a": "ghunnahIkhfa",
  "169777": "ghunnahIkhfa",
  "169200": "ghunnahIkhfa",
  "58b800": "ghunnahIkhfa",
  "9400a8": "ghunnahIkhfa",
  aa00ff: "ghunnahIkhfa",
  d500b7: "ghunnahIkhfa",
  "26bffd": "ghunnahIkhfa",
  "1a237e": "qalqalah",
  "2563eb": "qalqalah",
  ffd600: "idgham",
  ffff00: "idgham",
  ffcc00: "idgham",
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

/** HTML түсті 4 халықаралық стандартқа жинақтау. */
export function classifyTajweedHtmlHex(hex: string | undefined): TajweedStdColorKey {
  if (!hex) return "neutral";
  const key = htmlHexKey(hex);
  if (HTML_HEX_TO_STD[key]) return HTML_HEX_TO_STD[key]!;
  if (/^dd/i.test(key)) return "madd";
  if (/^00c8|^0099|^16a3|^169|^58b8|^94|^aa00|^d500|^26bf/i.test(key)) return "ghunnahIkhfa";
  if (/^1a23|^2563/i.test(key)) return "qalqalah";
  if (/^ffd6|^ffff|^ffcc/i.test(key)) return "idgham";
  return "neutral";
}

export function normalizeTajweedHtmlColor(
  raw: string | undefined,
  isDark: boolean
): string | undefined {
  const hex = normalizeHtmlColor(raw);
  if (!hex) return undefined;
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
