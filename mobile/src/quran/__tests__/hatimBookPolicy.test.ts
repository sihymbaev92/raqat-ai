import { Platform } from "react-native";
import {
  HATIM_BOOK_ARABIC_FONT,
  HATIM_BOOK_DENSITY,
  HATIM_BOOK_READING_THEME,
  HATIM_BOOK_SCRIPT,
  hatimBookUsesBundledTextHafsOffline,
  preloadHatimOfflineAssets,
  resetHatimOfflinePreloadCache,
  resolveHatimBookArabicFont,
  resolveHatimBookDensity,
  resolveHatimBookReadingTheme,
  resolveHatimBookScript,
} from "../hatimBookPolicy";
import { clearMushafPagesGlobalCache } from "../buildMushafPagesGlobal";

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
  });

  it("uses bundled text-hafs offline on native", () => {
    const os = Platform.OS;
    try {
      Platform.OS = "android";
      expect(hatimBookUsesBundledTextHafsOffline()).toBe(true);
      Platform.OS = "web";
      expect(hatimBookUsesBundledTextHafsOffline()).toBe(false);
    } finally {
      Platform.OS = os;
    }
  });

  it("preloads bundled quran pages without throwing", async () => {
    await expect(preloadHatimOfflineAssets()).resolves.toBeUndefined();
    await expect(preloadHatimOfflineAssets()).resolves.toBeUndefined();
  });
});
