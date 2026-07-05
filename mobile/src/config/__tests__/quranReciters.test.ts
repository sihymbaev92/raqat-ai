import {
  defaultReciterEditionForAppLocale,
  QURAN_EN_WALK_EDITION,
  QURAN_KK_HALIFAH_ALTAI_EDITION,
  QURAN_RU_KULIEV_EDITION,
  QURAN_TR_DIYANET_EDITION,
} from "../quranReciters";

describe("defaultReciterEditionForAppLocale", () => {
  it("maps app locales to translation voice editions", () => {
    expect(defaultReciterEditionForAppLocale("kk")).toBe(QURAN_KK_HALIFAH_ALTAI_EDITION);
    expect(defaultReciterEditionForAppLocale("ru")).toBe(QURAN_RU_KULIEV_EDITION);
    expect(defaultReciterEditionForAppLocale("en")).toBe(QURAN_EN_WALK_EDITION);
    expect(defaultReciterEditionForAppLocale("uz")).toBe(QURAN_TR_DIYANET_EDITION);
  });

  it("falls back from unavailable Kyrgyz audio to Kazakh translation voice", () => {
    expect(defaultReciterEditionForAppLocale("ky")).toBe(QURAN_KK_HALIFAH_ALTAI_EDITION);
  });
});
