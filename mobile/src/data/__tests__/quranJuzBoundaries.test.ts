import { juzForSurahAyah } from "../quranJuzBoundaries";

describe("juzForSurahAyah", () => {
  it("Фатиха басталуы — 1 джуз", () => {
    expect(juzForSurahAyah(1, 1)).toBe(1);
  });

  it("Бақараның басындағы аяттар — 1 джуз; 2:142-тен — 2", () => {
    expect(juzForSurahAyah(2, 1)).toBe(1);
    expect(juzForSurahAyah(2, 141)).toBe(1);
    expect(juzForSurahAyah(2, 142)).toBe(2);
  });
});
