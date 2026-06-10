import { surahAyahToGlobalOneBased } from "../quranAyahCounts";
import { mushafDisplayPageFromGlobalAyahOneBased } from "../quranMushafPageByGlobalAyah";

describe("mushafDisplayPageFromGlobalAyahOneBased", () => {
  test("2:255 (Ayat al-Kursi) is page 42 in Hafs 604", () => {
    const g = surahAyahToGlobalOneBased(2, 255);
    expect(mushafDisplayPageFromGlobalAyahOneBased(g)).toBe(42);
  });

  test("first ayah is page 1", () => {
    expect(mushafDisplayPageFromGlobalAyahOneBased(1)).toBe(1);
  });
});
