import {
  ensureQuranTajweedAssetLoaded,
  getQuranTajweedSurahAyahMap,
  getQuranTajweedSurahs,
  loadQuranTajweedCachedAyahs,
} from "../quranTajweedAsset";

describe("quranTajweedAsset", () => {
  beforeAll(async () => {
    await ensureQuranTajweedAssetLoaded();
  });

  it("loads 114 surahs from assets/quran_tajweed.json", () => {
    const surahs = getQuranTajweedSurahs();
    expect(surahs.length).toBe(114);
    expect(surahs[0]?.englishName).toBe("Al-Faatiha");
  });

  it("returns tajweed-tagged ayah map for surah 1", () => {
    const map = getQuranTajweedSurahAyahMap(1);
    expect(map?.[1]).toContain("[h:");
    expect(map?.[1]).toContain("ٱ");
  });

  it("builds CachedAyah rows with textTajweed", async () => {
    const ayahs = await loadQuranTajweedCachedAyahs(1);
    expect(ayahs.length).toBe(7);
    expect(ayahs[0]?.textTajweed).toContain("[");
    expect(ayahs[0]?.text).not.toContain("[h:");
  });
});
