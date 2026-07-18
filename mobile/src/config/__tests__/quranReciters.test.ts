import {
  DEFAULT_QURAN_RECITER_EDITION,
  QURAN_ALAFASY_EDITION,
  QURAN_EN_WALK_EDITION,
  QURAN_HUSARY_EDITION,
  QURAN_KK_HALIFAH_ALTAI_EDITION,
  QURAN_KY_HAKIMOV_AUDIO_EDITION,
  QURAN_MAHER_MUAIQLY_EDITION,
  QURAN_PLAYABLE_RECITER_EDITIONS,
  QURAN_RECITER_OPTIONS,
  QURAN_RU_KULIEV_EDITION,
  QURAN_TR_DIYANET_EDITION,
  QURAN_UZ_RWWAD_AUDIO_EDITION,
  defaultReciterEditionForAppLocale,
  findQuranReciterOption,
  isQuranReciterAudioAvailable,
  normalizeReciterEdition,
} from "../quranReciters";

describe("defaultReciterEditionForAppLocale", () => {
  it("maps app locales to translation voice editions", () => {
    expect(defaultReciterEditionForAppLocale("kk")).toBe(QURAN_KK_HALIFAH_ALTAI_EDITION);
    expect(defaultReciterEditionForAppLocale("ru")).toBe(QURAN_RU_KULIEV_EDITION);
    expect(defaultReciterEditionForAppLocale("en")).toBe(QURAN_EN_WALK_EDITION);
    expect(defaultReciterEditionForAppLocale("uz")).toBe(QURAN_UZ_RWWAD_AUDIO_EDITION);
    expect(defaultReciterEditionForAppLocale("tr")).toBe(QURAN_TR_DIYANET_EDITION);
    expect(defaultReciterEditionForAppLocale("ky")).toBe(QURAN_KY_HAKIMOV_AUDIO_EDITION);
  });
});

describe("QURAN_RECITER_OPTIONS catalog", () => {
  it("lists every playable edition with a Kazakh label", () => {
    expect(QURAN_PLAYABLE_RECITER_EDITIONS.length).toBeGreaterThanOrEqual(16);
    for (const edition of QURAN_PLAYABLE_RECITER_EDITIONS) {
      const opt = findQuranReciterOption(edition);
      expect(opt?.audioAvailable).toBe(true);
      expect((opt?.labelKk ?? "").trim().length).toBeGreaterThan(3);
    }
  });

  it("enables Kyrgyz and Uzbek translation audio on RAQAT CDN", () => {
    expect(isQuranReciterAudioAvailable(QURAN_KY_HAKIMOV_AUDIO_EDITION)).toBe(true);
    expect(isQuranReciterAudioAvailable(QURAN_UZ_RWWAD_AUDIO_EDITION)).toBe(true);
    expect(QURAN_RECITER_OPTIONS.some((o) => o.edition === QURAN_KY_HAKIMOV_AUDIO_EDITION)).toBe(true);
    expect(QURAN_RECITER_OPTIONS.some((o) => o.edition === QURAN_UZ_RWWAD_AUDIO_EDITION)).toBe(true);
  });

  it("keeps Turkish Diyanet under the tr group", () => {
    expect(findQuranReciterOption(QURAN_TR_DIYANET_EDITION)?.group).toBe("tr");
  });

  it("treats Maher as a real Arabic CDN reciter", () => {
    expect(normalizeReciterEdition(QURAN_MAHER_MUAIQLY_EDITION)).toBe(QURAN_MAHER_MUAIQLY_EDITION);
    expect(findQuranReciterOption(QURAN_MAHER_MUAIQLY_EDITION)?.audioAvailable).toBe(true);
  });

  it("still migrates legacy Mossad preference to Husary", () => {
    expect(normalizeReciterEdition("archive.abdulrahman-mossad-selected")).toBe(QURAN_HUSARY_EDITION);
  });

  it("falls back unknown editions to default Arabic reciter", () => {
    expect(normalizeReciterEdition("ar.unknown-reciter")).toBe(DEFAULT_QURAN_RECITER_EDITION);
    expect(normalizeReciterEdition("")).toBe(DEFAULT_QURAN_RECITER_EDITION);
  });

  it("keeps core timed Arabic reciters", () => {
    for (const edition of [
      "ar.abdurrahmaansudais",
      "ar.abdulbasitmurattal",
      QURAN_HUSARY_EDITION,
      QURAN_ALAFASY_EDITION,
    ]) {
      expect(isQuranReciterAudioAvailable(edition)).toBe(true);
    }
  });
});
