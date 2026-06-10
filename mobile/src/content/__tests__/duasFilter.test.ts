import { DUA_CATEGORIES } from "../duasCatalog";
import { filterDuaCategoriesByQuery } from "../duasFilter";

describe("filterDuaCategoriesByQuery", () => {
  it("returns same reference path for empty query (full catalog)", () => {
    const out = filterDuaCategoriesByQuery(DUA_CATEGORIES, "");
    expect(out).toBe(DUA_CATEGORIES);
  });

  it("does not mutate source categories", () => {
    const before = JSON.stringify(DUA_CATEGORIES);
    filterDuaCategoriesByQuery(DUA_CATEGORIES, "бисмилл");
    expect(JSON.stringify(DUA_CATEGORIES)).toBe(before);
  });

  it("finds by title substring", () => {
    const out = filterDuaCategoriesByQuery(DUA_CATEGORIES, "тамақ");
    expect(out.length).toBeGreaterThan(0);
    expect(out.some((c) => c.blocks.some((b) => b.title.includes("Тамақ")))).toBe(true);
  });

  it("returns empty when nothing matches", () => {
    const out = filterDuaCategoriesByQuery(DUA_CATEGORIES, "zzzznonexistentquery12345");
    expect(out).toEqual([]);
  });
});
