import {
  ensureBundledQuranReaderLoaded,
  releaseBundledQuranReaderMemory,
  searchBundledArabicAyahs,
} from "../bundledQuranReader";
import * as loadBundledJson from "../../utils/loadBundledJson";

const mockBundles = {
  "surah-list-api.json": { data: [] },
  "quran-uthmani-full.json": {
    data: {
      surahs: [
        {
          number: 1,
          ayahs: [
            { numberInSurah: 1, text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ" },
            { numberInSurah: 2, text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ" },
          ],
        },
        {
          number: 2,
          ayahs: [
            { numberInSurah: 1, text: "الف لام ميم" },
            { numberInSurah: 2, text: "الف لام ميم ثان" },
            { numberInSurah: 3, text: "الف لام ميم ثالث" },
          ],
        },
      ],
    },
  },
  "quran-kk-from-db.json": {
    data: {
      surahs: [
        {
          number: 1,
          ayahs: [{ numberInSurah: 1, text_kk: "Аса қамқор", translit: "бисмилләһ" }],
        },
      ],
    },
  },
} as const;

describe("searchBundledArabicAyahs", () => {
  beforeEach(() => {
    releaseBundledQuranReaderMemory({ keepSurahList: false });
    jest.spyOn(loadBundledJson, "loadBundledJson").mockImplementation(async (name) => {
      const hit = mockBundles[name as keyof typeof mockBundles];
      if (!hit) throw new Error(`unexpected bundled json: ${name}`);
      return hit;
    });
    jest.spyOn(loadBundledJson, "tryLoadBundledJson").mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns empty for short query", async () => {
    await ensureBundledQuranReaderLoaded();
    expect(searchBundledArabicAyahs("ا")).toEqual([]);
    expect(searchBundledArabicAyahs("  ")).toEqual([]);
  });

  it("finds ayahs in bundled uthmani text", async () => {
    await ensureBundledQuranReaderLoaded();
    const hits = searchBundledArabicAyahs("ٱلْحَمْدُ", 10);
    expect(hits).toEqual([{ surah: 1, ayah: 2, meaning: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ" }]);
  });

  it("respects result limit", async () => {
    await ensureBundledQuranReaderLoaded();
    const hits = searchBundledArabicAyahs("الف", 2);
    expect(hits).toHaveLength(2);
  });
});
