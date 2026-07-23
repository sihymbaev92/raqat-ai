import {
  analyzeIngredientsText,
  getHalalAdditivesSeedCount,
  lookupHalalAdditiveSeedByCode,
  searchHalalAdditivesSeed,
  sortAdditivesByRisk,
} from "../halalAdditivesSeedKz";
import type { HalalDamuAdditiveItem } from "../../api/halalDamuWp";

describe("halalAdditivesSeedKz", () => {
  it("loads bundled E-code seed", () => {
    expect(getHalalAdditivesSeedCount()).toBeGreaterThan(500);
  });

  it("finds E120 carmine as haram-flagged", () => {
    const hits = lookupHalalAdditiveSeedByCode("E120");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.title.toLowerCase()).toMatch(/e120|кармин|carmine/);
    expect((hits[0]?.risk || "").toUpperCase()).toBe("HARAM");
  });

  it("does not embed Kazakh risk label into description", () => {
    const hits = lookupHalalAdditiveSeedByCode("E120");
    expect(hits[0]?.description ?? "").not.toMatch(/^Харам|^Күдікті|^Анықтама/);
  });

  it("finds E471 via text search", () => {
    const hits = searchHalalAdditivesSeed("e471", 5);
    expect(hits.some((a) => /e471/i.test(a.title))).toBe(true);
  });

  it("finds E904 shellac as haram-flagged", () => {
    const hits = lookupHalalAdditiveSeedByCode("E904");
    expect(hits.length).toBeGreaterThan(0);
    expect((hits[0]?.risk || "").toUpperCase()).toBe("HARAM");
  });

  it("finds named ingredient rennet", () => {
    const hits = searchHalalAdditivesSeed("реннет", 5);
    expect(hits.length).toBeGreaterThan(0);
  });

  it("finds E481 stearoyl lactylate", () => {
    const hits = lookupHalalAdditiveSeedByCode("e481");
    expect(hits.some((a) => /e481/i.test(a.title))).toBe(true);
  });

  it("sorts haram before mushkil before reference", () => {
    const items: HalalDamuAdditiveItem[] = [
      { id: 1, title: "Ref", description: "", risk: "REFERENCE" },
      { id: 2, title: "Haram", description: "", risk: "HARAM" },
      { id: 3, title: "Mushkil", description: "", risk: "MUSHKIL" },
    ];
    const sorted = sortAdditivesByRisk(items);
    expect(sorted.map((a) => a.risk)).toEqual(["HARAM", "MUSHKIL", "REFERENCE"]);
  });

  it("analyzes ingredient paste with multiple E-codes and named items", () => {
    const hits = analyzeIngredientsText(
      "құрамы: су, қант, E120, эмульгатор E471, желатин, E904 шеллак",
    );
    expect(hits.length).toBeGreaterThanOrEqual(3);
    expect(hits.some((a) => /e120/i.test(a.title))).toBe(true);
    expect(hits.some((a) => /e471/i.test(a.title))).toBe(true);
    expect(hits.some((a) => /e904|шеллак|желатин/i.test(a.title))).toBe(true);
    const ranks = hits.map((a) => (a.risk || "").toUpperCase());
    const firstHaram = ranks.indexOf("HARAM");
    const firstRef = ranks.findIndex((r) => r === "REFERENCE" || r === "");
    if (firstHaram >= 0 && firstRef >= 0) {
      expect(firstHaram).toBeLessThan(firstRef);
    }
  });
});
