import {
  TAJWEED_LEGEND_SECTIONS,
  TAJWEED_RULES_CATALOG,
  tajweedColorForRule,
} from "../content/tajweedRulesCatalog";
import type { TajweedRuleKey } from "../utils/alquranTajweedParse";

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

  it("d and b idgham colors differ in light and dark themes", () => {
    expect(tajweedColorForRule("d", false)).not.toBe(tajweedColorForRule("b", false));
    expect(tajweedColorForRule("d", true)).not.toBe(tajweedColorForRule("b", true));
  });

  it("tajweedColorForRule returns catalog colors", () => {
    const meta = TAJWEED_RULES_CATALOG.find((m) => m.rule === "n")!;
    expect(tajweedColorForRule("n", false)).toBe(meta.colorLight);
    expect(tajweedColorForRule("n", true)).toBe(meta.colorDark);
  });
});
