import type { Qcf4Word } from "../qcf4Types";
import { resolveQcf4TajweedPaint } from "../qcf4ColrTajweedHybrid";

function word(text: string): Qcf4Word {
  return {
    code: 1,
    char: text,
    font: "QCF4_Hafs_01",
    text,
    type: "word",
  };
}

describe("resolveQcf4TajweedPaint", () => {
  it("uses COLR when glyphs active so in-glyph multi-color stays joined", () => {
    expect(
      resolveQcf4TajweedPaint({
        useColrGlyphs: true,
        word: word("الرَّحْمَٰنِ"),
        taggedAyah: "[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ",
        wordIndex: 0,
        glyphIndexInWord: 0,
      }).mode
    ).toBe("colr");
  });

  it("keeps COLR when no API tag rule is mapped to the glyph", () => {
    expect(
      resolveQcf4TajweedPaint({
        useColrGlyphs: true,
        word: word("الرَّحْمَٰنِ"),
        taggedAyah: null,
        wordIndex: 0,
        glyphIndexInWord: 0,
      }).mode
    ).toBe("colr");
  });

  it("suppresses izhar tanween to base ink", () => {
    expect(
      resolveQcf4TajweedPaint({
        useColrGlyphs: true,
        word: word("عَذَابٌ"),
        nextWord: word("عَظِيمٌ"),
      }).mode
    ).toBe("base");
  });

  it("prefers API ikhfa tag over COLR on tanween", () => {
    const paint = resolveQcf4TajweedPaint({
      useColrGlyphs: true,
      word: word("مِنْ"),
      nextWord: word("بَعْدِ"),
      taggedAyah: "قَالُوا [f[مِنْ] بَعْدِ",
      wordIndex: 1,
      glyphIndexInWord: 0,
    });
    expect(paint.mode).toBe("tag");
    expect(paint.rule).toBe("f");
  });

  it("keeps COLR for ghunnah/qalqalah (multi-color inside glyph)", () => {
    expect(
      resolveQcf4TajweedPaint({
        useColrGlyphs: true,
        word: word("مِن"),
        taggedAyah: "قَالُوا [g[مِن] رَبِّهِمْ",
        wordIndex: 1,
        glyphIndexInWord: 0,
      }).mode
    ).toBe("colr");

    expect(
      resolveQcf4TajweedPaint({
        useColrGlyphs: true,
        word: word("قَدْ"),
        taggedAyah: "[q[قَدْ]",
        wordIndex: 0,
        glyphIndexInWord: 0,
      }).mode
    ).toBe("colr");
  });

  it("uses per-glyph tag colors when COLR inactive", () => {
    const paint = resolveQcf4TajweedPaint({
      useColrGlyphs: false,
      word: word("مِن"),
      taggedAyah: "قَالُوا [g[مِن] رَبِّهِمْ",
      wordIndex: 1,
      glyphIndexInWord: 0,
    });
    expect(paint.mode).toBe("tag");
    expect(paint.rule).toBe("g");
  });
});
