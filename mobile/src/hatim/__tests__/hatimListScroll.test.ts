import {
  buildHatimListLayouts,
  hatimListIndexForJuz,
  hatimScrollOffsetForIndex,
  HATIM_JUZ_HEADER_ROW_H,
  HATIM_SURAH_ROW_H,
} from "../hatimListScroll";

describe("hatimListScroll", () => {
  const rows = [
    { kind: "juzHeader" as const, juz: 1 },
    { kind: "surah" as const, row: { number: 1 } },
    { kind: "surah" as const, row: { number: 2 } },
    { kind: "juzHeader" as const, juz: 2 },
    { kind: "surah" as const, row: { number: 2 } },
  ];

  it("builds cumulative offsets", () => {
    const layouts = buildHatimListLayouts(rows);
    expect(layouts[0]).toMatchObject({ offset: 0, length: HATIM_JUZ_HEADER_ROW_H });
    expect(layouts[1]).toMatchObject({
      offset: HATIM_JUZ_HEADER_ROW_H,
      length: HATIM_SURAH_ROW_H,
    });
    expect(layouts[3]).toMatchObject({
      kind: "juzHeader",
      juz: 2,
      offset: HATIM_JUZ_HEADER_ROW_H + HATIM_SURAH_ROW_H * 2,
    });
  });

  it("finds juz header index", () => {
    const layouts = buildHatimListLayouts(rows);
    expect(hatimListIndexForJuz(layouts, 2)).toBe(3);
    expect(hatimListIndexForJuz(layouts, 99)).toBe(-1);
  });

  it("includes list header height in scroll offset", () => {
    const layouts = buildHatimListLayouts(rows);
    expect(hatimScrollOffsetForIndex(layouts, 3, 400)).toBe(
      400 + layouts[3]!.offset - 8
    );
  });
});
