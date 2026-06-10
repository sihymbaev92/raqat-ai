import { parseAlquranTajweedTaggedText, tajweedRuleToColorGroup } from "../alquranTajweedParse";

describe("parseAlquranTajweedTaggedText", () => {
  it("parses hamza wasl and adjacent lam tag", () => {
    const s = "بِسْمِ [h:1[ٱ]للَّهِ";
    const segs = parseAlquranTajweedTaggedText(s);
    expect(segs).toEqual([
      { text: "بِسْمِ " },
      { text: "ٱ", rule: "h" },
      { text: "للَّهِ" },
    ]);
  });

  it("parses lam shamsi tag", () => {
    const s = "[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ";
    const segs = parseAlquranTajweedTaggedText(s);
    expect(segs.some((x) => x.rule === "l" && x.text === "ل")).toBe(true);
    expect(segs.some((x) => x.rule === "n")).toBe(true);
  });
});

describe("tajweedRuleToColorGroup", () => {
  it("groups madd letters", () => {
    expect(tajweedRuleToColorGroup("o")).toBe("madd");
    expect(tajweedRuleToColorGroup("n")).toBe("madd");
  });
});
