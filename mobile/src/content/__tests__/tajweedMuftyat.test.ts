import { TAJWEED_MUFTYAT_PAGES, TAJWEED_MUFTYAT_SOURCE } from "../tajweedMuftyatPages";
import { TAJWEED_MUFTYAT_SECTIONS } from "../tajweedMuftyatCatalog";
import { TAJWEED_RULES_CATALOG } from "../tajweedRulesCatalog";
import { getTajweedManualBookPage } from "../tajweedManualBook";
import {
  TAJWEED_APP_PAGE_COUNT,
  TAJWEED_APP_PAGES,
  TAJWEED_APP_SECTIONS,
  buildTajweedTocGroups,
  isTajweedAppPage,
} from "../tajweedMuftyatScope";

describe("tajweedMuftyat", () => {
  it("104 бет muftyat оқулығы (толық PDF)", () => {
    expect(TAJWEED_MUFTYAT_SOURCE.totalPages).toBe(104);
    expect(TAJWEED_MUFTYAT_PAGES).toHaveLength(104);
    expect(TAJWEED_MUFTYAT_PAGES[0].page).toBe(1);
    expect(TAJWEED_MUFTYAT_PAGES[103].page).toBe(104);
    for (const p of TAJWEED_MUFTYAT_PAGES) {
      expect(p.source).toBeTruthy();
    }
  });

  it("қолданбада тек тәжуид — мұқaba/сүрелер/дұға/намаз беттері жоқ", () => {
    expect(TAJWEED_APP_PAGE_COUNT).toBe(65);
    expect(TAJWEED_APP_PAGES.every((p) => isTajweedAppPage(p.page))).toBe(true);
    expect(TAJWEED_APP_PAGES.some((p) => p.page < 13)).toBe(false);
    expect(TAJWEED_APP_PAGES.some((p) => p.page >= 78)).toBe(false);
    expect(TAJWEED_APP_PAGES.some((p) => p.page === 73)).toBe(true);
    expect(TAJWEED_APP_PAGES.some((p) => p.page === 75)).toBe(true);
    expect(TAJWEED_APP_PAGES.some((p) => p.page === 76)).toBe(true);
    expect(TAJWEED_APP_PAGES.some((p) => p.page === 77)).toBe(true);
    expect(TAJWEED_APP_PAGES[0].page).toBe(13);
  });

  it("мазмұн — тек тәжуид бөлімдері", () => {
    expect(TAJWEED_APP_SECTIONS.length).toBeGreaterThan(10);
    const ids = new Set(TAJWEED_APP_SECTIONS.map((s) => s.id));
    expect(ids.has("short-surahs")).toBe(false);
    expect(ids.has("duas")).toBe(false);
    expect(ids.has("namaz-duas")).toBe(false);
    expect(ids.has("sajda")).toBe(true);
    for (const s of TAJWEED_APP_SECTIONS) {
      expect(isTajweedAppPage(s.startPage)).toBe(true);
      expect(s.endPage).toBeLessThanOrEqual(77);
    }
  });

  it("17 API тәжуид ережесі каталогта (Құран экраны)", () => {
    expect(TAJWEED_RULES_CATALOG).toHaveLength(17);
    const rules = new Set(TAJWEED_RULES_CATALOG.map((r) => r.rule));
    expect(rules.size).toBe(17);
  });

  it("мазмұн топтарға бөлінеді — isPart тақырып, тараулар ішінде", () => {
    const groups = buildTajweedTocGroups(TAJWEED_APP_SECTIONS);
    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(groups.some((g) => g.part?.id === "part1")).toBe(true);
    expect(groups.some((g) => g.part?.id === "part2")).toBe(true);
    expect(TAJWEED_APP_SECTIONS.some((s) => s.id === "foreword")).toBe(false);
    expect(TAJWEED_APP_SECTIONS.some((s) => s.id === "intro")).toBe(false);
    for (const g of groups) {
      if (g.part) {
        expect(g.chapters.length).toBeGreaterThan(0);
        for (const ch of g.chapters) {
          expect(ch.isPart).toBeFalsy();
        }
      }
    }
  });

  it("сыртқы тәжуид батырмалары қайталанбайтын тараулардан құралады", () => {
    const groups = buildTajweedTocGroups(TAJWEED_APP_SECTIONS);
    const chapters = groups.flatMap((g) => g.chapters);
    expect(chapters.length).toBeGreaterThan(10);
    expect(new Set(chapters.map((ch) => ch.id)).size).toBe(chapters.length);
    expect(new Set(chapters.map((ch) => `${ch.title}:${ch.startPage}`)).size).toBe(chapters.length);
    expect(chapters.every((ch) => !ch.isPart)).toBe(true);
  });

  it("қолданбадағы 65 тәжуид бетінің бәрі оқылатын контентке айналады", () => {
    const pages = TAJWEED_APP_PAGES.map((p) => getTajweedManualBookPage(p.page));
    expect(pages).toHaveLength(65);
    expect(pages.every((p) => p && p.blocks.length > 0)).toBe(true);
  });
});
