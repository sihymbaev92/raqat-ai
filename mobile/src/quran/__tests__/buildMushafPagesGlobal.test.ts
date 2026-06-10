import { ensureBundledQuranReaderLoaded } from "../../services/bundledQuranReader";
import {
  buildQcf4MushafPagesGlobal,
  buildQcf4MushafPagesGlobalLight,
  buildMushafPagesGlobal,
  buildMushafPagesGlobalLight,
  filterMushafBookPagesForSurah,
  findMushafBookPageIndexForAyah,
  resolveMushafBookAyah,
} from "../buildMushafPagesGlobal";
import { HAFS_MUSHAF_PAGE_COUNT } from "../../data/quranHafsPageFromGlobalAyah";

describe("buildMushafPagesGlobalLight", () => {
  it("builds 604 pages without bundled JSON", () => {
    const pages = buildMushafPagesGlobalLight();
    expect(pages).toHaveLength(HAFS_MUSHAF_PAGE_COUNT);
    expect(pages[0]!.ayahs).toHaveLength(7);
    expect(pages[0]!.ayahs[0]!.surahNumber).toBe(1);
  });
});

describe("buildQcf4MushafPagesGlobalLight", () => {
  it("uses QCF4 corpus ranges for pages that differ from the Hafs page-start table", () => {
    const pages = buildQcf4MushafPagesGlobalLight();
    const p597 = pages[596]!;

    expect(pages).toHaveLength(HAFS_MUSHAF_PAGE_COUNT);
    expect(p597.mushafPageNumber).toBe(597);
    expect(p597.ayahs[0]).toMatchObject({ surahNumber: 94, numberInSurah: 3 });
    expect(p597.ayahs[p597.ayahs.length - 1]).toMatchObject({
      surahNumber: 96,
      numberInSurah: 12,
    });
    expect(p597.ayahs.some((a) => a.surahNumber === 95 && a.numberInSurah === 1)).toBe(true);
  });
});

describe("buildMushafPagesGlobal", () => {
  beforeAll(async () => {
    await ensureBundledQuranReaderLoaded();
  });

  it("builds exactly 604 Hafs pages", () => {
    const pages = buildMushafPagesGlobal();
    expect(pages).toHaveLength(HAFS_MUSHAF_PAGE_COUNT);
    expect(pages[0]!.mushafPageNumber).toBe(1);
    expect(pages[603]!.mushafPageNumber).toBe(604);
  });

  it("page 1 contains Al-Fatiha ayahs only", () => {
    const pages = buildMushafPagesGlobal();
    const p1 = pages[0]!;
    expect(p1.ayahs.every((a) => a.surahNumber === 1)).toBe(true);
    expect(p1.ayahs).toHaveLength(7);
  });

  it("finds page index for known ayah", () => {
    const pages = buildMushafPagesGlobal();
    const ix = findMushafBookPageIndexForAyah(pages, 2, 255);
    expect(ix).toBeGreaterThanOrEqual(0);
    expect(pages[ix]!.ayahs.some((a) => a.surahNumber === 2 && a.numberInSurah === 255)).toBe(true);
  });

  it("page 2 — only Al-Baqarah ayahs 1–5 (Hafs 604)", () => {
    const pages = buildMushafPagesGlobal();
    const p2 = pages[1]!;
    const baqarah = p2.ayahs.filter((a) => a.surahNumber === 2);
    expect(p2.mushafPageNumber).toBe(2);
    expect(baqarah.map((a) => a.numberInSurah)).toEqual([1, 2, 3, 4, 5]);
    expect(baqarah.every((a) => (a.text ?? "").trim().length > 8)).toBe(true);
  });

  it("resolveMushafBookAyah enriches Arabic-only stubs with meaning and reading", () => {
    const enriched = resolveMushafBookAyah({
      surahNumber: 1,
      numberInSurah: 3,
      text: "الرَّحْمَٰنِ الرَّحِيمِ",
    });

    expect(enriched.text).toContain("الرَّحْمَٰنِ");
    expect(enriched.textKk?.trim().length).toBeGreaterThan(8);
    expect(enriched.translit?.trim().length).toBeGreaterThan(8);
  });

  it("filterMushafBookPagesForSurah — Al-Baqarah 286 ayahs on pages 2–49", () => {
    const pages = buildMushafPagesGlobal();
    const scoped = filterMushafBookPagesForSurah(pages, 2);
    expect(scoped.length).toBe(48);
    expect(scoped[0]!.mushafPageNumber).toBe(2);
    expect(scoped[scoped.length - 1]!.mushafPageNumber).toBe(49);
    const ayahCount = scoped.reduce(
      (n, pg) => n + pg.ayahs.filter((a) => a.surahNumber === 2).length,
      0
    );
    expect(ayahCount).toBe(286);
  });

  it("filterMushafBookPagesForSurah — An-Nas opens directly on page 604", () => {
    const pages = buildMushafPagesGlobal();
    const scoped = filterMushafBookPagesForSurah(pages, 114);
    expect(scoped).toHaveLength(1);
    expect(scoped[0]!.mushafPageNumber).toBe(604);
    expect(findMushafBookPageIndexForAyah(scoped, 114, 1)).toBe(0);
    expect(scoped[0]!.ayahs.some((a) => a.surahNumber === 114 && a.numberInSurah === 1)).toBe(true);
  });

  it("QCF4 full pages keep tap/audio mappings aligned with QCF4 verse keys", () => {
    const pages = buildQcf4MushafPagesGlobal();
    const p597 = pages[596]!;

    expect(p597.ayahs[0]).toMatchObject({ surahNumber: 94, numberInSurah: 3 });
    expect(p597.ayahs[p597.ayahs.length - 1]).toMatchObject({
      surahNumber: 96,
      numberInSurah: 12,
    });
    expect(p597.ayahs.every((a) => (a.text ?? "").trim().length > 0)).toBe(true);
    expect(findMushafBookPageIndexForAyah(pages, 94, 3)).toBe(596);
    expect(findMushafBookPageIndexForAyah(pages, 96, 12)).toBe(596);
  });
});
