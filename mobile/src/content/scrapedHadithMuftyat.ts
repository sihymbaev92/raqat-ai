/** Fatua.kz + Muftyat.kz хадис/риуаят үзінділері — scripts/export_scraped_hadith_mobile.py */
import bundled from "../../assets/bundled/scraped-hadith-muftyat.json";
import { kk } from "../i18n/kk";

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

const BUNDLE = bundled as ScrapedHadithMuftyatBundle;

export function getScrapedHadithMuftyatBundle(): ScrapedHadithMuftyatBundle {
  return BUNDLE;
}

export function getScrapedHadithMuftyatItems(): ScrapedHadithMuftyatItem[] {
  return BUNDLE.items ?? [];
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

export function searchScrapedHadithMuftyat(query: string, limit = 80): ScrapedHadithMuftyatItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return getScrapedHadithMuftyatItems().slice(0, limit);
  const out: ScrapedHadithMuftyatItem[] = [];
  for (const item of getScrapedHadithMuftyatItems()) {
    const blob = `${item.title}\n${item.text}\n${item.narrator}`.toLowerCase();
    if (blob.includes(q)) {
      out.push(item);
      if (out.length >= limit) break;
    }
  }
  return out;
}
