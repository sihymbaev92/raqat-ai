import {
  ayahArabicWordBoundaries,
  graphemeHighlightIndexFromWordProgress,
  karaokeGraphemeIndexFromMs,
  karaokeGraphemeIndexFromProgress,
  karaokeGraphemeIndexMonotonicForward,
  karaokeWordIndexFromMs,
  karaokeWordIndexFromTimestampSegments,
  karaokeWordIndexMonotonicForward,
  karaokeWordIndexFromProgress,
  splitAyahArabicGraphemes,
  splitAyahArabicWords,
} from "../quranAyahAudioKaraoke";

describe("quranAyahAudioKaraoke", () => {
  it("splits on spaces", () => {
    expect(splitAyahArabicWords("  a  b  ")).toEqual(["a", "b"]);
  });

  it("word index respects length weighting", () => {
    const w = ["a", "bbb"];
    expect(karaokeWordIndexFromProgress(w, 0)).toBe(0);
    expect(karaokeWordIndexFromProgress(w, 0.25)).toBe(0);
    expect(karaokeWordIndexFromProgress(w, 0.26)).toBe(1);
    expect(karaokeWordIndexFromProgress(w, 1)).toBe(1);
  });

  it("grapheme split is non-empty for Arabic snippet", () => {
    const g = splitAyahArabicGraphemes("بِسْمِ");
    expect(g.length).toBeGreaterThan(0);
    expect(g.join("")).toBeTruthy();
  });

  it("grapheme index tracks linear progress", () => {
    const g = ["a", "b", "c", "d"];
    expect(karaokeGraphemeIndexFromProgress(g, 0)).toBe(0);
    expect(karaokeGraphemeIndexFromProgress(g, 0.15)).toBe(0);
    expect(karaokeGraphemeIndexFromProgress(g, 0.26)).toBe(1);
    expect(karaokeGraphemeIndexFromProgress(g, 1)).toBe(3);
  });

  it("grapheme index from ms uses lead and rounding (count fallback)", () => {
    expect(karaokeGraphemeIndexFromMs(0, 1000, 4)).toBe(1);
    expect(karaokeGraphemeIndexFromMs(1000, 1000, 4)).toBe(3);
  });

  it("word-weighted plain text advances through second word mid-ayah", () => {
    const plain = "بِسْمِ اللَّهِ";
    const g = splitAyahArabicGraphemes(plain);
    const mid = graphemeHighlightIndexFromWordProgress(plain, 0.55);
    expect(mid).toBeGreaterThan(Math.floor(g.length * 0.2));
    expect(mid).toBeLessThan(g.length);
  });

  it("monotonic forward prevents highlight rewind during playback", () => {
    expect(karaokeGraphemeIndexMonotonicForward(5, 8, 2000, 1900)).toBe(8);
    expect(karaokeGraphemeIndexMonotonicForward(3, 8, 500, 2000)).toBe(3);
    expect(karaokeGraphemeIndexMonotonicForward(4, -1, 0, 0)).toBe(4);
    expect(karaokeWordIndexMonotonicForward(2, 4, 2000, 1900)).toBe(4);
  });

  it("word index from ms advances through ayah words", () => {
    const plain = "بِسْمِ اللَّهِ الرَّحْمَٰنِ";
    const words = splitAyahArabicWords(plain);
    expect(words.length).toBeGreaterThan(1);
    const early = karaokeWordIndexFromMs(0, 1000, plain);
    const late = karaokeWordIndexFromMs(900, 1000, plain);
    expect(early).toBeGreaterThanOrEqual(0);
    expect(late).toBeGreaterThanOrEqual(early);
    expect(late).toBeLessThan(words.length);
  });

  it("word boundaries preserve original spacing", () => {
    const plain = "بِسْمِ اللَّهِ";
    const bounds = ayahArabicWordBoundaries(plain);
    expect(bounds).toHaveLength(2);
    expect(bounds[0]!.word).toBe("بِسْمِ");
    expect(bounds[1]!.word).toBe("اللَّهِ");
    expect(plain.slice(bounds[1]!.start, bounds[1]!.end)).toBe("اللَّهِ");
  });

  it("grapheme fallback keeps letter with diacritics", () => {
    const g = splitAyahArabicGraphemes("بِسْ");
    expect(g.some((seg) => seg.includes("ب") && seg.length > 1)).toBe(true);
  });

  it("timestamp segments pick word index inside segment window", () => {
    const segments = [
      [0, 1, 380, 730],
      [1, 4, 740, 3082],
    ] as const;
    expect(karaokeWordIndexFromTimestampSegments(segments, 500, 4, 3082, 3082)).toBe(0);
    expect(karaokeWordIndexFromTimestampSegments(segments, 1500, 4, 3082, 3082)).toBe(1);
    expect(karaokeWordIndexFromTimestampSegments(segments, 2200, 4, 3082, 3082)).toBe(2);
    expect(karaokeWordIndexFromTimestampSegments(segments, 3000, 4, 3082, 3082)).toBe(3);
  });
});
