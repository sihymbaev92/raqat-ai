import {
  quranTranslationLocaleChoiceLabel,
  quranTranslationTranslatorName,
} from "../quranTranslationLocaleOptions";

describe("quranTranslationLocaleOptions", () => {
  it("shows flag and translator name", () => {
    expect(quranTranslationTranslatorName("kk")).toBe("Ерлан Алимулы");
    expect(quranTranslationLocaleChoiceLabel("kk")).toContain("🇰🇿");
    expect(quranTranslationLocaleChoiceLabel("kk")).toContain("Ерлан Алимулы");
    expect(quranTranslationLocaleChoiceLabel("ru")).toContain("🇷🇺");
    expect(quranTranslationLocaleChoiceLabel("ru")).toContain("Кулиев");
    expect(quranTranslationLocaleChoiceLabel("en")).toContain("🇬🇧");
    expect(quranTranslationLocaleChoiceLabel("tr")).toContain("🇹🇷");
    expect(quranTranslationLocaleChoiceLabel("ky")).toContain("🇰🇬");
    expect(quranTranslationLocaleChoiceLabel("uz")).toContain("🇺🇿");
  });
});
