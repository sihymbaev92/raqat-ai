import {
  clearMushafPagesGlobalCache,
} from "../../quran/buildMushafPagesGlobal";
import {
  ensureBundledQuranReaderLoaded,
  getBundledSurahAyahs,
  isBundledQuranReaderLoaded,
  releaseBundledQuranReaderMemory,
} from "../bundledQuranReader";
import * as loadBundledJson from "../../utils/loadBundledJson";

describe("bundledQuranReader optional remote packs", () => {
  beforeEach(() => {
    releaseBundledQuranReaderMemory({ keepSurahList: false });
    clearMushafPagesGlobalCache();
    jest.restoreAllMocks();
  });

  it("loads Arabic + KK from APK when remote EN translit pack is missing", async () => {
    jest.spyOn(loadBundledJson, "loadBundledJson").mockImplementation(async (name) => {
      if (name === "surah-list-api.json") return { data: [] };
      if (name === "quran-uthmani-full.json") {
        return {
          data: {
            surahs: [
              {
                number: 1,
                ayahs: [{ numberInSurah: 1, text: "بِسْمِ ٱللَّهِ" }],
              },
            ],
          },
        };
      }
      if (name === "quran-kk-from-db.json") {
        return {
          data: {
            surahs: [
              {
                number: 1,
                ayahs: [
                  {
                    numberInSurah: 1,
                    text_kk: "Аса қамқор, ерекше мейірімді Алланың атымен бастаймын,",
                    translit: "бисмилләһир рахманир рахиим",
                  },
                ],
              },
            ],
          },
        };
      }
      throw new loadBundledJson.BundledJsonMissingError(name);
    });
    jest.spyOn(loadBundledJson, "tryLoadBundledJson").mockResolvedValue(null);

    await ensureBundledQuranReaderLoaded();
    expect(isBundledQuranReaderLoaded()).toBe(true);
    const ayahs = getBundledSurahAyahs(1);
    expect(ayahs?.[0]?.text).toContain("بِسْمِ");
    expect(ayahs?.[0]?.textKk).toContain("қамқор");
    expect(ayahs?.[0]?.translit).toBe("бисмилләһир рахманир рахиим");
  });
});
