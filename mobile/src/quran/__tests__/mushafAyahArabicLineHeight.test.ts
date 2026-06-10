import { mushafArabicLineHeightForAyah } from "../mushafAyahArabicLineHeight";

describe("mushafArabicLineHeightForAyah", () => {
  it("leaves short ayah unchanged", () => {
    expect(mushafArabicLineHeightForAyah(40, "بِسْمِ")).toBe(40);
  });

  it("increases for long text", () => {
    const long = "ا".repeat(200);
    const out = mushafArabicLineHeightForAyah(40, long);
    expect(out).toBeGreaterThan(40);
    expect(out).toBeLessThanOrEqual(46);
  });
});
