import {
  normalizeDeepLinkPath,
  parseMushafBookQueryParams,
  parseQuranSurahDeepPath,
  rewriteMushafSurahPathToRouterPath,
} from "../quranSurahDeepLink";

describe("quranSurahDeepLink", () => {
  it("normalizes scheme and query", () => {
    expect(normalizeDeepLinkPath("imamai://more/surah/2/10?x=1")).toBe("more/surah/2/10");
    expect(normalizeDeepLinkPath("/more/mushaf-surah/3/")).toBe("more/mushaf-surah/3");
  });

  it("parses mushaf-surah", () => {
    expect(parseQuranSurahDeepPath("more/mushaf-surah/2")).toEqual({ surahNumber: 2, initialAyah: undefined });
    expect(parseQuranSurahDeepPath("more/mushaf-surah/2/255")).toEqual({ surahNumber: 2, initialAyah: 255 });
  });

  it("parses surah/.../mushaf suffix", () => {
    expect(parseQuranSurahDeepPath("more/surah/2/10/mushaf")).toEqual({ surahNumber: 2, initialAyah: 10 });
  });

  it("rewrites mushaf paths to router surah path", () => {
    expect(rewriteMushafSurahPathToRouterPath("more/mushaf-surah/2/5")).toBe("more/surah/2/5");
    expect(rewriteMushafSurahPathToRouterPath("more/surah/2/5/mushaf")).toBe("more/surah/2/5");
  });

  it("parses mushaf-book query focusSurah", () => {
    expect(parseMushafBookQueryParams("more/mushaf-book?focusSurah=2&focusAyah=1")).toEqual({
      focusSurah: 2,
      focusAyah: 1,
    });
  });

  it("parses continuous mushaf-book query for Hatim reading", () => {
    expect(
      parseMushafBookQueryParams(
        "more/mushaf-book/1?focusSurah=1&focusAyah=1&continuousMushaf=1"
      )
    ).toEqual({
      focusSurah: 1,
      focusAyah: 1,
      continuousMushaf: true,
    });
  });

  it("returns null for plain scroll surah path", () => {
    expect(parseQuranSurahDeepPath("more/surah/2")).toBeNull();
    expect(parseQuranSurahDeepPath("more/surah/2/10")).toBeNull();
    expect(rewriteMushafSurahPathToRouterPath("more/surah/2")).toBeNull();
  });
});
