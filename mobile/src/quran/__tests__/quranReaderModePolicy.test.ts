import fs from "fs";
import path from "path";
import {
  HATIM_MUSHAF_ARABIC_ONLY,
  QURAN_READER_ARABIC_ONLY,
  hatimMushafReaderLayers,
  shouldRenderSingleMushafBookPage,
} from "../quranReaderModePolicy";

describe("quranReaderModePolicy", () => {
  it("locks Hatim mushaf to Arabic-only one-page layers", () => {
    expect(QURAN_READER_ARABIC_ONLY).toBe(true);
    expect(HATIM_MUSHAF_ARABIC_ONLY).toBe(true);
    expect(hatimMushafReaderLayers()).toEqual({
      showReaderArabic: true,
      showReaderTranslit: false,
      showReaderMeaning: false,
    });
  });

  it("renders single mushaf page on web and native pan-pager", () => {
    expect(shouldRenderSingleMushafBookPage("web")).toBe(true);
    expect(shouldRenderSingleMushafBookPage("android")).toBe(true);
    expect(shouldRenderSingleMushafBookPage("ios")).toBe(true);
  });

  it("QuranMushafBookScreen uses Hatim locked reader layers", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/screens/QuranMushafBookScreen.tsx"),
      "utf8"
    );
    expect(src).toContain("HATIM_MUSHAF_ARABIC_ONLY");
    expect(src).toContain("hatimMushafReaderLayers");
  });

  it("QuranMushafBookScreen does not auto-load locale translations onto pages", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/screens/QuranMushafBookScreen.tsx"),
      "utf8"
    );
    expect(src).not.toContain("useMushafAppLocaleTranslations(");
  });
});
