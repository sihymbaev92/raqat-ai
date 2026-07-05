/** flutter_html `<font color="...">` тәжуид мәтіні — React Native Text span-дарына бөлу. */

export type HtmlFontTajweedRun = { text: string; color?: string };

const FONT_OPEN = /<font\s+color\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))\s*>/gi;

function normalizeHtmlColor(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const c = raw.trim();
  if (!c) return undefined;
  return c.startsWith("#") ? c : `#${c}`;
}

/** `<font color>` тегтерін span сегменттерге ayır; width шектемей inline рендер. */
export function htmlFontTajweedRuns(input: string): HtmlFontTajweedRun[] {
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
    const color = normalizeHtmlColor(m[1] ?? m[2] ?? m[3]);
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
