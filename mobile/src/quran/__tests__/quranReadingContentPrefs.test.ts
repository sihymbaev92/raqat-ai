import {
  defaultQuranReadingLocaleForUi,
  normalizeQuranReadingLocale,
} from "../quranReadingLocale";
import {
  defaultQuranTranslitScriptForUi,
  normalizeQuranTranslitScript,
} from "../quranTranslitScript";

describe("quranReadingLocale", () => {
  it("normalizes known locales and falls back to kk", () => {
    expect(normalizeQuranReadingLocale("ru")).toBe("ru");
    expect(normalizeQuranReadingLocale("en")).toBe("en");
    expect(normalizeQuranReadingLocale("tr")).toBe("tr");
    expect(normalizeQuranReadingLocale("uz")).toBe("uz");
    expect(normalizeQuranReadingLocale("ky")).toBe("ky");
    expect(normalizeQuranReadingLocale("kk")).toBe("kk");
    expect(normalizeQuranReadingLocale("ar")).toBe("kk");
    expect(normalizeQuranReadingLocale("")).toBe("kk");
  });

  it("defaults reading locale from UI locale", () => {
    expect(defaultQuranReadingLocaleForUi("ru")).toBe("ru");
    expect(defaultQuranReadingLocaleForUi("en")).toBe("en");
    expect(defaultQuranReadingLocaleForUi("ar")).toBe("kk");
    expect(defaultQuranReadingLocaleForUi("kk")).toBe("kk");
  });
});

describe("quranTranslitScript", () => {
  it("normalizes latin vs kk", () => {
    expect(normalizeQuranTranslitScript("latin")).toBe("latin");
    expect(normalizeQuranTranslitScript("kk")).toBe("kk");
    expect(normalizeQuranTranslitScript(undefined)).toBe("kk");
  });

  it("defaults latin for en/tr UI", () => {
    expect(defaultQuranTranslitScriptForUi("en")).toBe("latin");
    expect(defaultQuranTranslitScriptForUi("tr")).toBe("latin");
    expect(defaultQuranTranslitScriptForUi("ru")).toBe("latin");
    expect(defaultQuranTranslitScriptForUi("ky")).toBe("latin");
    expect(defaultQuranTranslitScriptForUi("kk")).toBe("kk");
  });
});
