import {
  QURAN_READER_TAJWEED_COLORS_ENABLED,
  resolveQuranReaderTajweedColors,
} from "../quranReaderTajweedPolicy";

describe("quranReaderTajweedPolicy", () => {
  it("locks Surah reader tajweed colors off regardless of stored pref", () => {
    expect(resolveQuranReaderTajweedColors(true)).toBe(false);
    expect(resolveQuranReaderTajweedColors(false)).toBe(false);
    expect(QURAN_READER_TAJWEED_COLORS_ENABLED).toBe(false);
  });
});
