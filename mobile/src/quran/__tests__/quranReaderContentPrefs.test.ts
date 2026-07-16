import fs from "fs";
import path from "path";
import {
  getQuranReaderShowMeaning,
  getQuranReaderShowTranslit,
} from "../../storage/quranReaderPrefs";
import { QURAN_READER_ARABIC_ONLY } from "../quranReaderModePolicy";

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("Quran reader content preferences", () => {
  it("forces transliteration and meaning off for Quran-only Arabic policy", async () => {
    expect(QURAN_READER_ARABIC_ONLY).toBe(true);
    await expect(getQuranReaderShowTranslit()).resolves.toBe(false);
    await expect(getQuranReaderShowMeaning()).resolves.toBe(false);
  });

  it("reader settings sheet shows Arabic-only content hint", () => {
    const settingsSrc = readSource("src/components/quran/QuranSurahReaderSettingsSheet.tsx");
    expect(settingsSrc).toContain("QURAN_READER_ARABIC_ONLY");
    expect(settingsSrc).toContain("readerShowContentArabicOnlyHint");
  });

  it("normalizes picked reciter before persisting it from the surah screen menu", () => {
    const src = readSource("src/screens/QuranSurahScreen.tsx");

    expect(src).toContain("const next = normalizeReciterEdition(edition);");
    expect(src).toContain("setReciterEdition(next);");
    expect(src).toContain("AsyncStorage.setItem(QURAN_READER_RECITER_KEY, next)");
    expect(src).not.toContain("AsyncStorage.setItem(QURAN_READER_RECITER_KEY, edition)");
  });
});
