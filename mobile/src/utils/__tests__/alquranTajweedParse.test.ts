import {
  parseAlquranTajweedTaggedText,
  stripTajweedTags,
  tajweedColoredRuns,
  tajweedRuleForWordGlyph,
  tajweedRulesPerWordChar,
  tajweedRuleToColorGroup,
  tajweedWholeWordRules,
  tajweedWordColorSpans,
} from "../alquranTajweedParse";

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

  it("skips helper-only tags when picking QCF4 whole-word colors", () => {
    expect(tajweedWholeWordRules("[h:1[ٱ]للَّهِ")).toEqual([undefined]);
    expect(tajweedWholeWordRules("[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ")).toEqual(["n"]);
  });

  it("marks only words that are fully covered by one tajweed rule", () => {
    expect(tajweedWholeWordRules("قَالُوا [g[مِن] رَبِّهِمْ")).toEqual([
      undefined,
      "g",
      undefined,
    ]);
  });

  it("stripTajweedTags removes bracket markup", () => {
    expect(stripTajweedTags("بِسْمِ [h:1[ٱ]للَّهِ")).toBe("بِسْمِ ٱللَّهِ");
  });

  it("tajweedWordColorSpans returns one span per word", () => {
    const tagged = "قَالُوا [g[مِن] رَبِّهِمْ";
    expect(tajweedWordColorSpans(tagged)).toEqual([
      { text: "قَالُوا", rule: undefined },
      { text: "مِن", rule: "g" },
      { text: "رَبِّهِمْ", rule: undefined },
    ]);
  });

  it("tajweedRulesPerWordChar colors letters inside one Arabic word", () => {
    const tagged = "[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ";
    const perWord = tajweedRulesPerWordChar(tagged);
    expect(perWord).toHaveLength(1);
    expect(perWord[0]?.some((r) => r === "n")).toBe(true);
    expect(tajweedRuleForWordGlyph(tagged, 0, perWord[0]!.length - 1)).toBe("n");
  });

  it("tajweedColoredRuns merges tag splits inside one Arabic word", () => {
    expect(tajweedColoredRuns("بِسْمِ [h:1[ٱ]للَّهِ")).toEqual([
      { text: "بِسْمِ", rule: undefined },
      { text: " ٱللَّهِ" },
    ]);
    expect(tajweedColoredRuns("[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ")).toEqual([{ text: "ٱلرَّحْمَـٰنِ", rule: "n" }]);
  });
});

describe("tajweedRuleToColorGroup", () => {
  it("groups madd letters", () => {
    expect(tajweedRuleToColorGroup("o")).toBe("madd");
    expect(tajweedRuleToColorGroup("n")).toBe("madd");
  });
});
