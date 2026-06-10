import { FATUA_KZ_LABEL_KK, MUFTYAT_KZ_LABEL_KK } from "../i18n/kk";
import {
  FATUA_KK_HOME_URL,
  MUFTYAT_KK_HOME_URL,
  OFFICIAL_ISLAMIC_SOURCES,
} from "../config/officialIslamicSources";
import { upgradeRemoteFeedImageUrl } from "../utils/remoteImageUrlQuality";

export type OfficialHomeFeedItem = {
  site: "fatua" | "muftyat";
  sourceLabel: string;
  title: string;
  subtitle: string;
  url: string;
  imageUrl: string;
};

const FATUA_HOME = FATUA_KK_HOME_URL;
const MUFTYAT_HOME = MUFTYAT_KK_HOME_URL;
const FATUA_ORIGIN = OFFICIAL_ISLAMIC_SOURCES.fatua.origin;
const MUFTYAT_ORIGIN = OFFICIAL_ISLAMIC_SOURCES.muftyat.origin;
const FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "kk,ru;q=0.8",
  "User-Agent": "RAQAT-Mobile/1.0 (+https://raqat.ai)",
};

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function absUrl(origin: string, href: string): string {
  const h = href.trim();
  if (!h) return origin;
  if (/^https?:\/\//i.test(h)) return h;
  if (h.startsWith("//")) return `https:${h}`;
  try {
    return new URL(h, `${origin.replace(/\/$/, "")}/`).href;
  } catch {
    return origin;
  }
}

function isUsableImage(url: string): boolean {
  const low = url.toLowerCase();
  if (!low || low.startsWith("data:")) return false;
  if (low.endsWith(".svg")) return false;
  if (low.includes("logo") || low.includes("флаш_баннер") || low.includes("flash")) return false;
  return (
    low.includes("/media/") ||
    low.includes("imgs.muftyat.kz") ||
    low.includes("/upload/")
  );
}

function pushUnique(
  out: OfficialHomeFeedItem[],
  seen: Set<string>,
  item: OfficialHomeFeedItem
): void {
  const key = item.url.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  out.push(item);
}

/** fatua.kz/kk — `<article class="article">` карточкалары. */
export function parseFatuaHomeHtml(html: string, limit = 8): OfficialHomeFeedItem[] {
  const out: OfficialHomeFeedItem[] = [];
  const seen = new Set<string>();
  const blocks = html.match(/<article class="article">[\s\S]*?<\/article>/gi) ?? [];

  for (const block of blocks) {
    if (out.length >= limit) break;
    const imgM = block.match(/<img[^>]+src=["']([^"']+)["']/i);
    const hrefM = block.match(/<div class="article__title">\s*<a href=["']([^"']+)["']/i);
    const titleM = block.match(/<div class="article__title">\s*<a[^>]*>([\s\S]*?)<\/a>/i);
    const catM = block.match(/<div class="article__subtitle">\s*([\s\S]*?)\s*<\/div>/i);
    const dateM = block.match(/<div class="article__date">\s*([\s\S]*?)\s*<\/div>/i);

    const imageUrl = imgM?.[1]
      ? upgradeRemoteFeedImageUrl(absUrl(FATUA_ORIGIN, imgM[1]))
      : "";
    const url = hrefM?.[1] ? absUrl(FATUA_ORIGIN, hrefM[1]) : "";
    const title = decodeHtml(titleM?.[1] ?? "");
    const altTitle = decodeHtml(
      block.match(/<img[^>]+alt=["']([^"']*)["']/i)?.[1] ?? ""
    );
    const finalTitle = title || altTitle;
    if (!url || !finalTitle || !isUsableImage(imageUrl)) continue;

    const subtitleParts = [
      decodeHtml(catM?.[1] ?? ""),
      decodeHtml(dateM?.[1] ?? ""),
    ].filter(Boolean);

    pushUnique(out, seen, {
      site: "fatua",
      sourceLabel: FATUA_KZ_LABEL_KK,
      title: finalTitle,
      subtitle: subtitleParts.join(" · "),
      url,
      imageUrl,
    });
  }

  return out;
}

/** muftyat.kz/kk — slider `block_for` + `jeg_post` жаңалықтары. */
export function parseMuftyatHomeHtml(html: string, limit = 8): OfficialHomeFeedItem[] {
  const out: OfficialHomeFeedItem[] = [];
  const seen = new Set<string>();

  const sliderRe =
    /<div class="block_for">\s*<a href=["']([^"']+)["']>\s*<img src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = sliderRe.exec(html)) !== null && out.length < limit) {
    const url = absUrl(MUFTYAT_ORIGIN, m[1] ?? "");
    const imageUrl = upgradeRemoteFeedImageUrl(absUrl(MUFTYAT_ORIGIN, m[2] ?? ""));
    const title = decodeHtml(m[4] ?? m[3] ?? "");
    if (!url || !title || !isUsableImage(imageUrl)) continue;
    pushUnique(out, seen, {
      site: "muftyat",
      sourceLabel: MUFTYAT_KZ_LABEL_KK,
      title,
      subtitle: "",
      url,
      imageUrl,
    });
  }

  const jegRe =
    /<article class="jeg_post[\s\S]*?<a href=["']([^"']+)["']>[\s\S]*?<img src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][\s\S]*?<h3 class="jeg_post_title">\s*<a[^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = jegRe.exec(html)) !== null && out.length < limit) {
    const url = absUrl(MUFTYAT_ORIGIN, m[1] ?? "");
    const imageUrl = upgradeRemoteFeedImageUrl(absUrl(MUFTYAT_ORIGIN, m[2] ?? ""));
    const title = decodeHtml(m[4] ?? m[3] ?? "");
    if (!url || !title || !isUsableImage(imageUrl)) continue;
    const cat = decodeHtml(
      m[0].match(/class="category-[^"]*">([^<]+)</i)?.[1] ?? ""
    );
    pushUnique(out, seen, {
      site: "muftyat",
      sourceLabel: MUFTYAT_KZ_LABEL_KK,
      title,
      subtitle: cat,
      url,
      imageUrl,
    });
  }

  return out.slice(0, limit);
}

export function interleaveOfficialHomeFeeds(
  fatua: OfficialHomeFeedItem[],
  muftyat: OfficialHomeFeedItem[]
): OfficialHomeFeedItem[] {
  const out: OfficialHomeFeedItem[] = [];
  const max = Math.max(fatua.length, muftyat.length);
  for (let i = 0; i < max; i += 1) {
    if (fatua[i]) out.push(fatua[i]!);
    if (muftyat[i]) out.push(muftyat[i]!);
  }
  return out;
}

async function fetchHomeHtml(url: string, timeoutMs: number): Promise<string | null> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: FETCH_HEADERS, signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

/** Басты беттерден тікелей жаңалықтар (суретпен). */
export async function fetchOfficialSiteHomeFeeds(
  limitPerSite = 6,
  timeoutMs = 12_000
): Promise<OfficialHomeFeedItem[]> {
  const [fatuaHtml, muftyatHtml] = await Promise.all([
    fetchHomeHtml(FATUA_HOME, timeoutMs),
    fetchHomeHtml(MUFTYAT_HOME, timeoutMs),
  ]);

  const fatua = fatuaHtml ? parseFatuaHomeHtml(fatuaHtml, limitPerSite) : [];
  const muftyat = muftyatHtml ? parseMuftyatHomeHtml(muftyatHtml, limitPerSite) : [];
  return interleaveOfficialHomeFeeds(fatua, muftyat);
}
