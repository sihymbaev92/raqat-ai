import fs from "fs";
import path from "path";

const quranSurahScreenSource = () =>
  fs.readFileSync(path.join(process.cwd(), "src/screens/QuranSurahScreen.tsx"), "utf8");

describe("Quran reader content preferences", () => {
  it("loads saved Arabic, transliteration, and meaning visibility prefs", () => {
    const src = quranSurahScreenSource();

    expect(src).toContain("getQuranReaderShowArabic()");
    expect(src).toContain("getQuranReaderShowTranslit()");
    expect(src).toContain("getQuranReaderShowMeaning()");
  });

  it("persists disabling transliteration and meaning switches", () => {
    const src = quranSurahScreenSource();

    expect(src).toContain("setShowReaderTranslit(value)");
    expect(src).toContain("setQuranReaderShowTranslit(value)");
    expect(src).toContain("setShowReaderMeaning(value)");
    expect(src).toContain("setQuranReaderShowMeaning(value)");
    expect(src).not.toContain("setShowReaderTranslit(true);\n      } else");
    expect(src).not.toContain("setShowReaderMeaning(true);\n      }");
  });

  it("normalizes picked reciter before persisting it from the surah screen menu", () => {
    const src = quranSurahScreenSource();

    expect(src).toContain("const next = normalizeReciterEdition(edition);");
    expect(src).toContain("setReciterEdition(next);");
    expect(src).toContain("AsyncStorage.setItem(QURAN_READER_RECITER_KEY, next)");
    expect(src).not.toContain("AsyncStorage.setItem(QURAN_READER_RECITER_KEY, edition)");
  });
});
