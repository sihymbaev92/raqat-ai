import { computeHatimJuzStats } from "../hatimJuzProgress";

describe("computeHatimJuzStats", () => {
  it("returns 30 entries", () => {
    const s = computeHatimJuzStats(new Set());
    expect(s).toHaveLength(30);
    expect(s[0]!.juz).toBe(1);
    expect(s[29]!.juz).toBe(30);
  });

  it("marks juz 1 progress when al-Fatiha read", () => {
    const s = computeHatimJuzStats(new Set([1]));
    const j1 = s.find((x) => x.juz === 1)!;
    expect(j1.readInJuz).toBeGreaterThanOrEqual(1);
    expect(j1.fraction).toBeGreaterThan(0);
    expect(j1.fraction).toBeLessThanOrEqual(1);
  });

  it("full read marks all juz fractions as 1", () => {
    const all = new Set(Array.from({ length: 114 }, (_, i) => i + 1));
    const s = computeHatimJuzStats(all);
    for (const row of s) {
      expect(row.fraction).toBe(1);
      expect(row.readInJuz).toBe(row.totalInJuz);
    }
  });
});
