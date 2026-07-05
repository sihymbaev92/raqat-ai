import { fetchTajweedAyahMap } from "../tajweedSurahFetch";
import {
  clearTajweedSurahMemoryCacheForTests,
  peekTajweedSurahMemoryCache,
  rememberTajweedSurahInMemory,
  writeTajweedSurahDiskCache,
} from "../../storage/tajweedSurahCache";

jest.mock("../../utils/loadBundledJson", () => ({
  loadBundledJson: jest.fn(async (name: string) => {
    if (name === "quran-tajweed-offline.json") {
      return {
        version: 1,
        surahs: {
          "1": {
            "1": "بِسْمِ [h:1[ٱ]للَّهِ",
            "2": "ٱلْحَمْدُ [n[لِلَّهِ",
          },
        },
      };
    }
    return null;
  }),
}));

describe("fetchTajweedAyahMap", () => {
  beforeEach(() => {
    clearTajweedSurahMemoryCacheForTests();
    global.fetch = jest.fn();
  });

  it("returns memory cache without network", async () => {
    rememberTajweedSurahInMemory(1, { 1: "tagged [n[text" });
    const map = await fetchTajweedAyahMap(1);
    expect(map).toEqual({ 1: "tagged [n[text" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("falls back to bundled seed when network fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));
    const map = await fetchTajweedAyahMap(1);
    expect(map?.[1]).toContain("[h:1[");
    expect(map?.[2]).toContain("[n[");
  });

  it("persists successful network fetch to memory", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 200,
        data: {
          ayahs: [{ numberInSurah: 3, text: "ٱ[l[ل]رَّحْمَ[n[ـٰ]نِ" }],
        },
      }),
    });
    const map = await fetchTajweedAyahMap(3);
    expect(map).toEqual({ 3: "ٱ[l[ل]رَّحْمَ[n[ـٰ]نِ" });
    expect(peekTajweedSurahMemoryCache(3)).toEqual(map);
  });
});

describe("tajweedSurahCache", () => {
  beforeEach(() => {
    clearTajweedSurahMemoryCacheForTests();
  });

  it("round-trips disk cache through memory", async () => {
    await writeTajweedSurahDiskCache(2, { 1: "text [q[tag" });
    clearTajweedSurahMemoryCacheForTests();
    const { readTajweedSurahDiskCache } = await import("../../storage/tajweedSurahCache");
    const map = await readTajweedSurahDiskCache(2);
    expect(map).toEqual({ 1: "text [q[tag" });
  });
});
