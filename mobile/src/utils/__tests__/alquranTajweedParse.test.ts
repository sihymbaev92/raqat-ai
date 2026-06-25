import {
  parseAlquranTajweedTaggedText,
  stripTajweedTags,
  tajweedColoredRuns,
  tajweedRuleForWordGlyph,
  tajweedRulesPerWordChar,
  tajweedRuleToColorGroup,
  tajweedWholeWordRules,
  tajweedWordCharRuns,
  tajweedWordColorSpans,
  tajweedWordHasPerLetterColoring,
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
    const maddIndex = perWord[0]!.findIndex((r) => r === "n");
    expect(tajweedRuleForWordGlyph(tagged, 0, maddIndex)).toBe("n");
  });

  it("tajweedColoredRuns colors only tagged segments inside a word", () => {
    expect(tajweedColoredRuns("بِسْمِ [h:1[ٱ]للَّهِ")).toEqual([
      { text: "بِسْمِ " },
      { text: "ٱ", rule: "h" },
      { text: "للَّهِ" },
    ]);
    expect(tajweedColoredRuns("[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ")).toEqual([
      { text: "ٱ", rule: "h" },
      { text: "ل", rule: "l" },
      { text: "رَّحْمَ" },
      { text: "ـٰ", rule: "n" },
      { text: "نِ" },
    ]);
  });

  it("tajweedRulesPerWordChar does not propagate color to untagged letters", () => {
    const tagged = "[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ";
    const perWord = tajweedRulesPerWordChar(tagged);
    expect(perWord).toHaveLength(1);
    const rules = perWord[0]!;
    expect(rules[0]).toBe("h");
    expect(rules[1]).toBe("l");
    expect(rules.slice(2, rules.findIndex((r) => r === "n")).every((r) => r == null)).toBe(true);
    expect(rules.filter((r) => r === "n").length).toBeGreaterThanOrEqual(1);
    expect(tajweedRuleForWordGlyph(tagged, 0, 2)).toBeUndefined();
    expect(tajweedRuleForWordGlyph(tagged, 0, rules.length - 1)).toBeUndefined();
  });

  it("tajweedWordHasPerLetterColoring detects partial word coloring", () => {
    const tagged = "[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ";
    expect(tajweedWordHasPerLetterColoring(tagged, 0)).toBe(true);
    expect(tajweedWordHasPerLetterColoring("قَالُوا [g[مِن] رَبِّهِمْ", 1)).toBe(false);
  });

  it("tajweedWordCharRuns merges adjacent letters with the same rule", () => {
    const tagged = "[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ";
    const runs = tajweedWordCharRuns(tagged, 0);
    expect(runs.some((run) => run.rule === "h" && run.text === "ٱ")).toBe(true);
    expect(runs.some((run) => run.rule === "l" && run.text === "ل")).toBe(true);
    expect(runs.some((run) => run.rule === "n")).toBe(true);
    expect(runs.some((run) => !run.rule && run.text.includes("ر"))).toBe(true);
  });
});

describe("tajweedRuleToColorGroup", () => {
  it("groups madd letters", () => {
    expect(tajweedRuleToColorGroup("o")).toBe("madd");
    expect(tajweedRuleToColorGroup("n")).toBe("madd");
  });
});
