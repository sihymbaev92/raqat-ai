import fs from "fs";
import path from "path";
import {
  getQuranReaderShowMeaning,
  getQuranReaderShowTranslit,
} from "../../storage/quranReaderPrefs";
import { QURAN_READER_ARABIC_ONLY } from "../quranReaderModePolicy";

const quranSurahScreenSource = () =>
  fs.readFileSync(path.join(process.cwd(), "src/screens/QuranSurahScreen.tsx"), "utf8");

describe("Quran reader content preferences", () => {
  it("forces transliteration and meaning off for Quran-only Arabic policy", async () => {
    expect(QURAN_READER_ARABIC_ONLY).toBe(true);
    await expect(getQuranReaderShowTranslit()).resolves.toBe(false);
    await expect(getQuranReaderShowMeaning()).resolves.toBe(false);
  });

  it("QuranSurahScreen uses locked Arabic-only reader layers", () => {
    const src = quranSurahScreenSource();
    expect(src).toContain("quranReaderArabicOnlyLayers");
    expect(src).not.toContain("getQuranReaderShowTranslit()");
    expect(src).not.toContain("getQuranReaderShowMeaning()");
  });

  it("normalizes picked reciter before persisting it from the surah screen menu", () => {
    const src = quranSurahScreenSource();

    expect(src).toContain("const next = normalizeReciterEdition(edition);");
    expect(src).toContain("setReciterEdition(next);");
    expect(src).toContain("AsyncStorage.setItem(QURAN_READER_RECITER_KEY, next)");
    expect(src).not.toContain("AsyncStorage.setItem(QURAN_READER_RECITER_KEY, edition)");
  });
});
