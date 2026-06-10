import { DUA_CATEGORIES } from "../duasCatalog";
import { DUAS_MENZIKIR, countDuasInCatalog, orderDuaCategories } from "../duasMenzikir";

describe("duas menzikir", () => {
  it("orders 8 sections", () => {
    expect(DUA_CATEGORIES.length).toBe(8);
    expect(DUA_CATEGORIES[0].title).toMatch(/^I\./);
    expect(DUA_CATEGORIES[7].title).toMatch(/^VIII\./);
  });

  it("has no duplicate block titles within a category", () => {
    for (const cat of DUA_CATEGORIES) {
      const seen = new Set<string>();
      for (const b of cat.blocks) {
        expect(seen.has(b.title)).toBe(false);
        seen.add(b.title);
      }
    }
  });

  it("short zikr section has 10 items not 100", () => {
    const z = DUA_CATEGORIES.find((c) => c.title.startsWith("VIII."));
    expect(z?.blocks.length).toBe(10);
  });

  it("countDuasInCatalog matches sum", () => {
    const n = countDuasInCatalog(DUA_CATEGORIES);
    expect(n).toBeGreaterThan(50);
    expect(n).toBeLessThan(120);
  });

  it("menzikir titles match catalog", () => {
    for (const m of DUAS_MENZIKIR) {
      expect(DUA_CATEGORIES.some((c) => c.title === m.categoryTitle)).toBe(true);
    }
  });
});
