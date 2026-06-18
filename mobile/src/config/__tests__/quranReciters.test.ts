import {
  normalizeReciterEdition,
  QURAN_ABDULRAHMAN_MOSSAD_EDITION,
  QURAN_ALAFASY_EDITION,
  QURAN_HUSARY_EDITION,
  QURAN_MAHER_MUAIQLY_EDITION,
  QURAN_RECITER_OPTIONS,
} from "../quranReciters";
import { quranComReciterIdForEdition } from "../quranComReciterMap";

describe("quranReciters", () => {
  it("replaces Abdulrahman Mossad with Mahmud Al-Husary in the picker", () => {
    expect(QURAN_RECITER_OPTIONS.some((r) => r.edition === QURAN_ABDULRAHMAN_MOSSAD_EDITION)).toBe(false);
    expect(QURAN_RECITER_OPTIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          edition: QURAN_HUSARY_EDITION,
          labelKk: "Махмуд Халил әл-Хусари",
        }),
      ])
    );
  });

  it("migrates saved Mossad edition prefs to Husary", () => {
    expect(normalizeReciterEdition(QURAN_ABDULRAHMAN_MOSSAD_EDITION)).toBe(QURAN_HUSARY_EDITION);
  });

  it("replaces Maher with Alafasy because Quran.com timed id 7 belongs to Alafasy", () => {
    expect(QURAN_RECITER_OPTIONS.some((r) => r.edition === QURAN_MAHER_MUAIQLY_EDITION)).toBe(false);
    expect(QURAN_RECITER_OPTIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          edition: QURAN_ALAFASY_EDITION,
          labelKk: "Мишари Рашид әл-Афаси",
        }),
      ])
    );
    expect(normalizeReciterEdition(QURAN_MAHER_MUAIQLY_EDITION)).toBe(QURAN_ALAFASY_EDITION);
  });

  it("shows only Arabic reciters that have exact karaoke timing", () => {
    const arabicReciters = QURAN_RECITER_OPTIONS.filter((r) => r.group === "ar");

    expect(arabicReciters.length).toBeGreaterThan(0);
    for (const reciter of arabicReciters) {
      expect(quranComReciterIdForEdition(reciter.edition)).toEqual(expect.any(Number));
    }
  });
});
