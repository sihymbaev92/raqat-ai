import { TAJWEED_MUFTYAT_PAGE_TEXT, getMuftyatPageText } from "../tajweedMuftyatPageText";

describe("tajweedMuftyatPageText", () => {
  it("has 104 pages with sequential numbers", () => {
    expect(TAJWEED_MUFTYAT_PAGE_TEXT).toHaveLength(104);
    TAJWEED_MUFTYAT_PAGE_TEXT.forEach((row, i) => {
      expect(row.page).toBe(i + 1);
      expect(typeof row.text).toBe("string");
      expect(Array.isArray(row.arabic)).toBe(true);
    });
  });

  it("page 71 (waqf) has Kazakh text", () => {
    const p = getMuftyatPageText(71);
    expect(p?.text).toMatch(/уақф/i);
  });

  it("page 78 (Fatiha) exists in full PDF text but not in app scope", () => {
    const p = getMuftyatPageText(78);
    expect(p?.text).toMatch(/Фатиха/i);
    expect(p?.arabic.length).toBeGreaterThanOrEqual(1);
  });

  it("lookup returns undefined for out of range", () => {
    expect(getMuftyatPageText(0)).toBeUndefined();
    expect(getMuftyatPageText(105)).toBeUndefined();
  });
});
