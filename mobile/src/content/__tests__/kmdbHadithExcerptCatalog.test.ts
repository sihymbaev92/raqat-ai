import {
  KMDB_HADITH_EXCERPT_CATALOG_META,
  getKmdbHadithExcerptBundle,
  getKmdbHadithExcerptItems,
  kmdbHadithExcerptCatalogIsOffline,
  kmdbHadithExcerptSiteCounts,
  searchKmdbHadithExcerpts,
} from "../kmdbHadithExcerptCatalog";

describe("kmdbHadithExcerptCatalog", () => {
  it("serves offline curated bundles only (no runtime API tier)", () => {
    expect(kmdbHadithExcerptCatalogIsOffline()).toBe(true);
    expect(KMDB_HADITH_EXCERPT_CATALOG_META.refreshPolicy).toBe("release_pipeline_only");
    expect(KMDB_HADITH_EXCERPT_CATALOG_META.curatedBundles).toEqual([
      "extracted-hadith-muftyat.json",
      "external-hadith-kk.json",
    ]);
  });

  it("meets minimum curated catalog size for release", () => {
    const bundle = getKmdbHadithExcerptBundle();
    expect(bundle.itemCount).toBeGreaterThanOrEqual(100);
    expect(bundle.items.length).toBe(bundle.itemCount);
    expect(getKmdbHadithExcerptItems().every((x) => x.sourceUrl.startsWith("http"))).toBe(true);
  });

  it("searches across title, text and article context", () => {
    const sample = getKmdbHadithExcerptItems()[0];
    const byTitle = searchKmdbHadithExcerpts(sample.title.slice(0, 12), 5);
    expect(byTitle.some((x) => x.id === sample.id)).toBe(true);
  });

  it("tracks per-site counts including external portals", () => {
    const counts = kmdbHadithExcerptSiteCounts();
    expect((counts.muftyat ?? 0) + (counts.fatua ?? 0)).toBeGreaterThan(0);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(getKmdbHadithExcerptBundle().itemCount);
  });
});
