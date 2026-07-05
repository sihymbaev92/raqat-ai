/** Fatua.kz + Muftyat.kz хадис/риуаят үзінділері — scripts/export_scraped_hadith_mobile.py */
import { kk } from "../i18n/kk";
import { tryLoadBundledJson } from "../utils/loadBundledJson";

export type ScrapedHadithMuftyatItem = {
  id: string;
  title: string;
  text: string;
  narrator: string;
  collectionHint: string;
  sourceUrl: string;
  /** muftyat | fatua */
  sourceSite?: string;
  scrapedAt: string;
};

export type ScrapedHadithMuftyatBundle = {
  version: number;
  sourceOrg: string;
  licenseNote: string;
  itemCount: number;
  countsBySite?: { muftyat?: number; fatua?: number };
  items: ScrapedHadithMuftyatItem[];
};

const EMPTY_BUNDLE: ScrapedHadithMuftyatBundle = {
  version: 0,
  sourceOrg: "",
  licenseNote: "",
  itemCount: 0,
  items: [],
};

let bundleCache: ScrapedHadithMuftyatBundle | null = null;
let loadPromise: Promise<ScrapedHadithMuftyatBundle | null> | null = null;

export async function ensureScrapedHadithMuftyatLoaded(): Promise<ScrapedHadithMuftyatBundle | null> {
  if (bundleCache) return bundleCache;
  if (!loadPromise) {
    loadPromise = tryLoadBundledJson<ScrapedHadithMuftyatBundle>("scraped-hadith-muftyat.json")
      .then((data) => {
        if (data?.items?.length) bundleCache = data;
        return bundleCache;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function getScrapedHadithMuftyatBundle(): ScrapedHadithMuftyatBundle {
  return bundleCache ?? EMPTY_BUNDLE;
}

export function getScrapedHadithMuftyatItems(): ScrapedHadithMuftyatItem[] {
  return getScrapedHadithMuftyatBundle().items ?? [];
}

export function findScrapedHadithMuftyat(id: string): ScrapedHadithMuftyatItem | undefined {
  return getScrapedHadithMuftyatItems().find((x) => x.id === id);
}

export function scrapedHadithSourceLabel(site?: string): string {
  return site === "fatua"
    ? kk.hadith.muftyatExcerpts.sourceBadgeFatua
    : kk.hadith.muftyatExcerpts.sourceBadgeMuftyat;
}

export function scrapedHadithOpenOriginalLabel(site?: string): string {
  return site === "fatua"
    ? kk.hadith.muftyatExcerpts.openOriginalFatua
    : kk.hadith.muftyatExcerpts.openOriginalMuftyat;
}

export function searchScrapedHadithMuftyat(query: string, limit = 40): ScrapedHadithMuftyatItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return getScrapedHadithMuftyatItems().slice(0, limit);
  const out: ScrapedHadithMuftyatItem[] = [];
  for (const item of getScrapedHadithMuftyatItems()) {
    const hay = `${item.title} ${item.text} ${item.narrator}`.toLowerCase();
    if (hay.includes(q)) out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}
