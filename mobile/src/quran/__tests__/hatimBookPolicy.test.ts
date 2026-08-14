import {
  HATIM_BOOK_ARABIC_FONT,
  HATIM_BOOK_DENSITY,
  HATIM_BOOK_READING_THEME,
  HATIM_BOOK_SCRIPT,
  hatimBookUsesBundledTextHafsOffline,
  prewarmHatimSurahOpen,
  preloadHatimOfflineAssets,
  resetHatimOfflinePreloadCache,
  resolveHatimBookArabicFont,
  resolveHatimBookDensity,
  resolveHatimBookReadingTheme,
  resolveHatimBookScript,
  resolveHatimBookTajweedColors,
  HATIM_BOOK_TAJWEED_COLORS_ENABLED,
} from "../hatimBookPolicy";
import { clearMushafPagesGlobalCache } from "../buildMushafPagesGlobal";

jest.mock("../loadQcf4Page", () => ({
  loadQcf4FontMap: jest.fn(async () => null),
  loadQcf4Page: jest.fn(async () => null),
  preloadAdjacentQcf4Pages: jest.fn(),
}));

describe("hatimBookPolicy", () => {
  afterEach(() => {
    resetHatimOfflinePreloadCache();
    clearMushafPagesGlobalCache();
  });

  it("locks Hatim reader prefs to git HEAD defaults", () => {
    expect(resolveHatimBookReadingTheme("muftyat")).toBe(HATIM_BOOK_READING_THEME);
    expect(resolveHatimBookArabicFont("lateef")).toBe(HATIM_BOOK_ARABIC_FONT);
    expect(resolveHatimBookScript("turkish")).toBe(HATIM_BOOK_SCRIPT);
    expect(resolveHatimBookDensity("compact")).toBe(HATIM_BOOK_DENSITY);
    expect(HATIM_BOOK_READING_THEME).toBe("original");
    expect(HATIM_BOOK_ARABIC_FONT).toBe("quran_com");
    expect(HATIM_BOOK_SCRIPT).toBe("madinah");
    expect(resolveHatimBookTajweedColors(true)).toBe(false);
    expect(HATIM_BOOK_TAJWEED_COLORS_ENABLED).toBe(false);
  });

  it("uses QCF4 Madinah on native unless EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS=1", () => {
    const prev = process.env.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS;
    try {
      delete process.env.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS;
      expect(hatimBookUsesBundledTextHafsOffline()).toBe(false);
      process.env.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS = "1";
      expect(hatimBookUsesBundledTextHafsOffline()).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS;
      else process.env.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS = prev;
    }
  });

  it("preloads bundled quran pages without throwing", async () => {
    await expect(preloadHatimOfflineAssets()).resolves.toBeUndefined();
    await expect(preloadHatimOfflineAssets()).resolves.toBeUndefined();
  });

  it("prewarms QCF4 pages for surah open", () => {
    const { preloadAdjacentQcf4Pages } = require("../loadQcf4Page") as {
      preloadAdjacentQcf4Pages: jest.Mock;
    };
    prewarmHatimSurahOpen(2, 255);
    expect(preloadAdjacentQcf4Pages).toHaveBeenCalled();
  });
});
