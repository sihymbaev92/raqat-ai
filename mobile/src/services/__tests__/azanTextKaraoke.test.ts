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
  it("gives takbir a larger share than a single closing line, but not most of the clip", () => {
    expect(azanKaraokeBlockWeight(SAMPLE_BLOCKS[0])).toBeGreaterThan(
      azanKaraokeBlockWeight(SAMPLE_BLOCKS[6])
    );
    expect(azanKaraokeBlockWeight(SAMPLE_BLOCKS[0])).toBeLessThanOrEqual(25);
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

  it("starts on takbir and advances with playback progress without racing the ending", () => {
    const durationMs = 130_610;
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, 0, durationMs, true)).toBe(0);
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, 5_000, durationMs, true)).toBe(0);
    // ~25% — still early phrases, not already at the end
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, 32_000, durationMs, true)).toBeLessThanOrEqual(2);
    // ~50% — mid azan
    const mid = activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, 65_000, durationMs, true);
    expect(mid).toBeGreaterThanOrEqual(2);
    expect(mid).toBeLessThanOrEqual(4);
    // near end — last karaoke line, not dua
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, 125_000, durationMs, true)).toBe(6);
  });

  it("shows dua after audio finishes", () => {
    const durationMs = 130_610;
    expect(activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, durationMs, durationMs, false)).toBe(7);
  });

  it("never exceeds dua index while audio is still playing", () => {
    const durationMs = 130_610;
    for (let ms = 0; ms < durationMs; ms += 500) {
      const idx = activeAzanTextIndexFromPlayback(SAMPLE_BLOCKS, ms, durationMs, true);
      expect(idx).toBeLessThan(7);
    }
  });
});
