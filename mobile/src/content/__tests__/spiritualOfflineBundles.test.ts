import { DUA_CATEGORIES } from "../duasCatalog";
import { loadDhikrItems } from "../../screens/tasbihShared";

describe("spiritual offline bundles", () => {
  it("duas catalog is non-empty and fully offline", () => {
    expect(DUA_CATEGORIES.length).toBeGreaterThanOrEqual(8);
    const blocks = DUA_CATEGORIES.flatMap((c) => c.blocks);
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      expect(b.ar.trim().length).toBeGreaterThan(0);
      expect(b.meaningKk.trim().length).toBeGreaterThan(0);
    }
  });

  it("dhikr-list bundle loads with ids and goals", () => {
    const items = loadDhikrItems();
    expect(items.length).toBeGreaterThan(0);
    for (const d of items) {
      expect(d.id).toBeGreaterThan(0);
      expect(d.textAr.trim().length).toBeGreaterThan(0);
      expect(d.textKk.trim().length).toBeGreaterThan(0);
      expect(d.defaultTarget).toBeGreaterThan(0);
    }
  });

  it("asma-al-husna bundle has 99 names", () => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const raw = require("../../../assets/bundled/asma-al-husna-kk.json") as {
      n: number;
      ar: string;
      kk: string;
    }[];
    /* eslint-enable @typescript-eslint/no-require-imports */
    expect(Array.isArray(raw)).toBe(true);
    expect(raw.length).toBe(99);
    const nums = raw.map((r) => r.n).sort((a, b) => a - b);
    expect(nums[0]).toBe(1);
    expect(nums[98]).toBe(99);
    for (const r of raw) {
      expect(r.ar.trim().length).toBeGreaterThan(0);
      expect(r.kk.trim().length).toBeGreaterThan(0);
    }
  });
});
