import { surahAyahToGlobalOneBased, globalAyahToRef } from "../quranAyahCounts";

describe("surahAyahToGlobalOneBased", () => {
  it("maps 1:1 to global 1", () => {
    expect(surahAyahToGlobalOneBased(1, 1)).toBe(1);
  });

  it("maps 2:1 to global 8 (after 7 ayahs of Al-Fatiha)", () => {
    expect(surahAyahToGlobalOneBased(2, 1)).toBe(8);
  });

  it("round-trips with globalAyahToRef", () => {
    const g = surahAyahToGlobalOneBased(3, 5);
    expect(globalAyahToRef(g)).toEqual({ surah: 3, ayah: 5 });
  });
});
