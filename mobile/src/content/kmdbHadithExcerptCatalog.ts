/**
 * ҚМДБ хадис/риуаят үзінділері — мобиль UI үшін жалғыз офлайн каталог (P0).
 * Runtime API жоқ: сапа/толықтығы bundled JSON + release pipeline арқылы бекітіледі.
 */
import {
  getExtractedHadithMuftyatBundle,
  getExtractedHadithMuftyatItems,
  findExtractedHadithMuftyat,
  type ExtractedHadithMuftyatBundle,
  type ExtractedHadithMuftyatItem,
} from "./extractedHadithMuftyat";
import { findScrapedHadithMuftyat } from "./scrapedHadithMuftyat";

export type KmdbHadithExcerptDelivery = "offline_bundled";

export type KmdbHadithExcerptCatalogMeta = {
  delivery: KmdbHadithExcerptDelivery;
  /** Жаңарту тек scrape → export → extract → validate релиз pipeline арқылы */
  refreshPolicy: "release_pipeline_only";
  pipelineVersion: 1;
  /** UI-да көрсетілмейтін build-only қабат */
  rawArticleArchive: "scraped-hadith-muftyat.json";
  curatedBundles: readonly ["extracted-hadith-muftyat.json", "external-hadith-kk.json"];
};

export const KMDB_HADITH_EXCERPT_CATALOG_META: KmdbHadithExcerptCatalogMeta = {
  delivery: "offline_bundled",
  refreshPolicy: "release_pipeline_only",
  pipelineVersion: 1,
  rawArticleArchive: "scraped-hadith-muftyat.json",
  curatedBundles: ["extracted-hadith-muftyat.json", "external-hadith-kk.json"],
};

function excerptBlob(item: ExtractedHadithMuftyatItem): string {
  return [
    item.title,
    item.text,
    item.meaningKk ?? "",
    item.narrator,
    item.collectionHint,
    item.sourceTitle ?? "",
    item.sourceContext ?? "",
    item.arabicText ?? "",
  ]
    .join("\n")
    .toLowerCase();
}

/** Жалғыз bundle — hub, list, search, detail (curated). */
export function getKmdbHadithExcerptBundle(): ExtractedHadithMuftyatBundle {
  return getExtractedHadithMuftyatBundle();
}

export function getKmdbHadithExcerptItems(): ExtractedHadithMuftyatItem[] {
  return getExtractedHadithMuftyatItems();
}

/** Ескі scraped deep link үшін fallback; жаңа UI тек curated id көрсетеді. */
export function findKmdbHadithExcerpt(id: string): ExtractedHadithMuftyatItem | undefined {
  return findExtractedHadithMuftyat(id) ?? findScrapedHadithMuftyat(id);
}

export function searchKmdbHadithExcerpts(query: string, limit = 120): ExtractedHadithMuftyatItem[] {
  const q = query.trim().toLowerCase();
  const items = getKmdbHadithExcerptItems();
  if (!q) return items.slice(0, limit);
  const out: ExtractedHadithMuftyatItem[] = [];
  for (const item of items) {
    if (excerptBlob(item).includes(q)) {
      out.push(item);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function kmdbHadithExcerptSiteCounts(
  bundle: ExtractedHadithMuftyatBundle = getKmdbHadithExcerptBundle()
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of bundle.items) {
    const site = item.sourceSite?.trim() || "unknown";
    counts[site] = (counts[site] ?? 0) + 1;
  }
  return counts;
}

export function kmdbHadithExcerptCatalogIsOffline(): boolean {
  return KMDB_HADITH_EXCERPT_CATALOG_META.delivery === "offline_bundled";
}
