import {
  coordsFromJuz,
  coordsFromPage,
  coordsFromSurah,
  initialAyahForNavCoords,
  quranNavPageValuesForJuz,
} from "../quranNavPickerCoords";

describe("quranNavPickerCoords", () => {
  it("maps surah 38 to Sad juz 23 page 453", () => {
    const c = coordsFromSurah(38);
    expect(c.surah).toBe(38);
    expect(c.juz).toBe(23);
    expect(c.page).toBe(453);
  });

  it("maps juz 23 start to Ya-Sin", () => {
    const c = coordsFromJuz(23);
    expect(c.surah).toBe(36);
    expect(c.juz).toBe(23);
    expect(c.page).toBe(442);
  });

  it("maps page 458 to Sad ayah range", () => {
    const c = coordsFromPage(458);
    expect(c.surah).toBe(38);
    expect(c.juz).toBe(23);
    expect(c.page).toBe(458);
    expect(initialAyahForNavCoords(c)).toBeGreaterThanOrEqual(1);
  });

  it("lists mushaf pages only within selected juz", () => {
    const j19 = coordsFromJuz(19);
    const j20 = coordsFromJuz(20);
    const pages = quranNavPageValuesForJuz(19);
    expect(pages[0]).toBe(j19.page);
    expect(pages[pages.length - 1]).toBe(j20.page - 1);
    expect(pages).toContain(j19.page);
    expect(pages).not.toContain(1);
  });
});
