import {
  activeAzanTextIndexFromPlayback,
  azanKaraokeBlocks,
  azanKaraokeBlockWeight,
} from "../azanTextKaraoke";

const SAMPLE_BLOCKS = [
  { id: "takbir-open", repeat: "4 рет" },
  { id: "shahada-tawhid", repeat: "2 рет" },
  { id: "shahada-risala", repeat: "2 рет" },
  { id: "hayya-salah", repeat: "2 рет" },
  { id: "hayya-falah", repeat: "2 рет" },
  { id: "takbir-close", repeat: "2 рет" },
  { id: "tahlil" },
  { id: "azan-dua" },
] as const;

describe("azanTextKaraoke", () => {
  it("gives takbir the largest share of playback time", () => {
    expect(azanKaraokeBlockWeight(SAMPLE_BLOCKS[0])).toBeGreaterThan(
      azanKaraokeBlockWeight(SAMPLE_BLOCKS[1])
    );
  });

  it("excludes dua from karaoke blocks during playback", () => {
    expect(azanKaraokeBlocks(SAMPLE_BLOCKS).map((b) => b.id)).toEqual([
      "takbir-open",
      "shahada-tawhid",
      "shahada-risala",
      "hayya-salah",
      "hayya-falah",
      "takbir-close",
      "tahlil",
    ]);
  });

  it("starts on takbir and advances only with playback progress", () => {
    const durationMs = 48_000;
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, 0, durationMs, true)).toBe(0);
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, 5_000, durationMs, true)).toBe(0);
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, 20_000, durationMs, true)).toBeLessThanOrEqual(2);
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, 47_000, durationMs, true)).toBe(6);
  });

  it("shows dua after audio finishes", () => {
    const durationMs = 48_000;
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, durationMs, durationMs, false)).toBe(7);
  });

  it("never exceeds dua index while audio is still playing", () => {
    const durationMs = 60_000;
    for (let ms = 0; ms < durationMs; ms += 500) {
      const idx = activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, ms, durationMs, true);
      expect(idx).toBeLessThan(7);
    }
  });
});
