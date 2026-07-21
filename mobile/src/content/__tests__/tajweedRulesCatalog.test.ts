import {
  TAJWEED_LEGEND_SECTIONS,
  TAJWEED_RULES_CATALOG,
  tajweedColorForRule,
} from "../tajweedRulesCatalog";
import type { TajweedRuleKey } from "../../utils/alquranTajweedParse";

describe("tajweedRulesCatalog", () => {
  it("covers all 17 API rule keys exactly once", () => {
    const keys = TAJWEED_RULES_CATALOG.map((m) => m.rule).sort();
    const expected: TajweedRuleKey[] = [
      "a",
      "b",
      "c",
      "d",
      "f",
      "g",
      "h",
      "i",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "s",
      "u",
      "w",
    ];
    expect(keys).toEqual(expected);
  });

  it("legend sections include every catalog rule", () => {
    const sectionRules = TAJWEED_LEGEND_SECTIONS.flatMap((s) => s.rules);
    expect(new Set(sectionRules).size).toBe(TAJWEED_RULES_CATALOG.length);
    for (const meta of TAJWEED_RULES_CATALOG) {
      expect(sectionRules).toContain(meta.rule);
    }
  });

  it("idgham mutajanis and mutaqarib share Al Quran Cloud gray", () => {
    expect(tajweedColorForRule("d", false)).toBe("#A1A1A1");
    expect(tajweedColorForRule("d", false)).toBe(tajweedColorForRule("b", false));
    expect(tajweedColorForRule("d", true)).toBe(tajweedColorForRule("b", true));
  });

  it("uses Al Quran Cloud official light palette", () => {
    expect(tajweedColorForRule("n", false)).toBe("#537FFF");
    expect(tajweedColorForRule("p", false)).toBe("#4050FF");
    expect(tajweedColorForRule("m", false)).toBe("#000EBC");
    expect(tajweedColorForRule("o", false)).toBe("#2144C1");
    expect(tajweedColorForRule("q", false)).toBe("#DD0008");
    expect(tajweedColorForRule("g", false)).toBe("#FF7E1E");
    expect(tajweedColorForRule("f", false)).toBe("#9400A8");
    expect(tajweedColorForRule("i", false)).toBe("#26BFFD");
    expect(tajweedColorForRule("a", false)).toBe("#169777");
    expect(tajweedColorForRule("h", false)).toBe("#AAAAAA");
  });

  it("ghunnah/ikhfa/iqlab section — not izhar; qalqalah uses Arabic dal", () => {
    const nasal = TAJWEED_LEGEND_SECTIONS.find((s) => s.rules.includes("i"));
    expect(nasal?.titleKk).toMatch(/иқлаб/i);
    expect(nasal?.titleKk).not.toMatch(/изһар/i);
    const qalqalah = TAJWEED_RULES_CATALOG.find((m) => m.rule === "q");
    expect(qalqalah?.detailKk).toContain("د");
    expect(qalqalah?.detailKk).not.toMatch(/ج д/);
  });

  it("tajweedColorForRule returns catalog colors", () => {
    const meta = TAJWEED_RULES_CATALOG.find((m) => m.rule === "n")!;
    expect(tajweedColorForRule("n", false)).toBe(meta.colorLight);
    expect(tajweedColorForRule("n", true)).toBe(meta.colorDark);
  });
});
