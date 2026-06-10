import {
  DEFAULT_MUSHAF_DENSITY,
  MUSHAF_AYAHS_PER_PAGE,
  MUSHAF_DENSITY_ORDER,
  getMushafDensityPreset,
  normalizeMushafDensity,
  type MushafDensityId,
} from "../mushafConfig";

describe("mushafConfig", () => {
  it("exposes a small horizontal page chunk size for mushaf pager", () => {
    expect(MUSHAF_AYAHS_PER_PAGE).toBeGreaterThanOrEqual(1);
    expect(MUSHAF_AYAHS_PER_PAGE).toBeLessThanOrEqual(12);
  });

  it("orders densities tight → medium → comfort", () => {
    expect(MUSHAF_DENSITY_ORDER).toEqual(["tight", "medium", "comfort"]);
    expect(new Set(MUSHAF_DENSITY_ORDER).size).toBe(3);
  });

  it("defaults to tight density (book-like flow)", () => {
    expect(DEFAULT_MUSHAF_DENSITY).toBe("tight");
  });

  describe("normalizeMushafDensity", () => {
    it.each([
      ["tight", "tight"],
      ["comfort", "comfort"],
      ["medium", "medium"],
      ["", "tight"],
      [null, "tight"],
      [undefined, "tight"],
      ["unknown", "tight"],
    ] as const)("maps %p → %p", (raw, expected) => {
      expect(normalizeMushafDensity(raw)).toBe(expected);
    });
  });

  describe("getMushafDensityPreset", () => {
    it.each(MUSHAF_DENSITY_ORDER)("returns a full preset for %s", (id: MushafDensityId) => {
      const p = getMushafDensityPreset(id);
      expect(p.arabLineHeightFactor).toBeGreaterThan(0);
      expect(p.bismLineHeightFactor).toBeGreaterThan(0);
      expect(p.bismFontFactor).toBeGreaterThan(0);
      expect(p.mushafAyahRowMarginBottom).toBeGreaterThanOrEqual(0);
      expect(p.mushafAyahRowPaddingVertical).toBeGreaterThanOrEqual(0);
      expect(p.mushafBismillahBannerMarginBottom).toBeGreaterThanOrEqual(0);
      expect(p.mushafBismillahBannerPaddingVertical).toBeGreaterThanOrEqual(0);
      expect(p.mushafAyahArabicClusterGap).toBeGreaterThanOrEqual(0);
    });

    /**
     * Мұсаф «кітап» ағыны: аят арасындағы интервал tight ең аз, comfort ең көп
     * (бірақ барлығы бұрынғы «карточка» стилінен кіші — тығыз оқу).
     */
    it("keeps ayah row vertical rhythm monotonic tight ≤ medium ≤ comfort", () => {
      const t = getMushafDensityPreset("tight");
      const m = getMushafDensityPreset("medium");
      const c = getMushafDensityPreset("comfort");
      const rowGap = (p: typeof t) =>
        p.mushafAyahRowMarginBottom + 2 * p.mushafAyahRowPaddingVertical;
      expect(rowGap(t)).toBeLessThanOrEqual(rowGap(m));
      expect(rowGap(m)).toBeLessThanOrEqual(rowGap(c));
    });

    it("uses modest per-ayah spacing for tight (book-like flow)", () => {
      const p = getMushafDensityPreset("tight");
      expect(p.mushafAyahRowMarginBottom + p.mushafAyahRowPaddingVertical).toBeLessThanOrEqual(6);
    });
  });
});
