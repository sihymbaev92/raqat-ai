import { ayahNumbersUntilJuzEndInSurah, ayahNumbersForAudioPlayUntil } from "../quranAyahPlayQueue";

describe("ayahNumbersUntilJuzEndInSurah", () => {
  it("queues until juz boundary within same surah (juz 6 ends before 5:82)", () => {
    expect(ayahNumbersUntilJuzEndInSurah(4, 150, 176)).toEqual([
      150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166,
      167, 168, 169, 170, 171, 172, 173, 174, 175, 176,
    ]);
  });

  it("queues from ayah to surah end when juz continues in next surah", () => {
    expect(ayahNumbersUntilJuzEndInSurah(4, 170, 176)).toEqual([170, 171, 172, 173, 174, 175, 176]);
  });
});

describe("ayahNumbersForAudioPlayUntil", () => {
  it("respects ayah scope", () => {
    expect(ayahNumbersForAudioPlayUntil("ayah", 4, 170, 176)).toEqual([170]);
  });

  it("respects surah scope", () => {
    expect(ayahNumbersForAudioPlayUntil("surah", 4, 170, 176)).toEqual([170, 171, 172, 173, 174, 175, 176]);
  });

  it("defaults juz scope to juz boundary", () => {
    expect(ayahNumbersForAudioPlayUntil("juz", 4, 170, 176)).toEqual([170, 171, 172, 173, 174, 175, 176]);
  });
});
