import type { Qcf4Word } from "../qcf4Types";
import { qcf4ColrSuppressTajweedColor } from "../qcf4ColrTajweedOverride";

function word(text: string, overrides: Partial<Qcf4Word> = {}): Qcf4Word {
  return {
    code: 1,
    char: text,
    font: "QCF4_Hafs_01",
    text,
    type: "word",
    ...overrides,
  };
}

describe("qcf4ColrSuppressTajweedColor", () => {
  it("suppresses COLR on izhar tanween before ain (2:7 عذابٌ عظيمٌ)", () => {
    expect(qcf4ColrSuppressTajweedColor(word("عَذَابٌ"), word("عَظِيمٌ"))).toBe(true);
  });

  it("does not suppress when next letter is not izhar harf", () => {
    expect(qcf4ColrSuppressTajweedColor(word("عَذَابٌ"), word("كَبِيرٌ"))).toBe(false);
  });

  it("does not suppress words without tanween", () => {
    expect(qcf4ColrSuppressTajweedColor(word("الَّذِينَ"), word("عَظِيمٌ"))).toBe(false);
  });

  it("ignores end markers and headers", () => {
    expect(
      qcf4ColrSuppressTajweedColor(word("عَذَابٌ"), word("V7", { type: "end", verse_key: "2:7" }))
    ).toBe(false);
  });
});

describe("qcf4ColrPreferApiTagOverColr", () => {
  it("overrides COLR only for ikhfa so other rules keep in-glyph multi-color", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { qcf4ColrPreferApiTagOverColr } = require("../qcf4ColrTajweedOverride");
    expect(qcf4ColrPreferApiTagOverColr(word("مِنْ"), word("بَعْدِ"), "f")).toBe(true);
    expect(qcf4ColrPreferApiTagOverColr(word("مِن"), undefined, "g")).toBe(false);
    expect(qcf4ColrPreferApiTagOverColr(word("قَدْ"), undefined, "q")).toBe(false);
    expect(qcf4ColrPreferApiTagOverColr(word("الرَّحْمَٰنِ"), undefined, undefined)).toBe(false);
  });
});

describe("qcf4HatimLineJustifyContent", () => {
  it("right-aligns hatim lines (flex-start in row-reverse)", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { qcf4HatimLineJustifyContent } = require("../mushafQcf4Layout");
    expect(qcf4HatimLineJustifyContent()).toBe("flex-start");
  });
});
