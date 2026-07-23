import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultQuranReadingLocaleForUi,
  normalizeQuranReadingLocale,
} from "../quranReadingLocale";
import {
  defaultQuranTranslitScriptForUi,
  ensureDefaultQuranTranslitScript,
  getQuranTranslitScript,
  normalizeQuranTranslitScript,
  setQuranTranslitScript,
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
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

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

  it("restores Cyrillic once for Kazakh UI even if latin was stored", async () => {
    await AsyncStorage.setItem("quran_translit_script_v1", "latin");
    const next = await ensureDefaultQuranTranslitScript("kk");
    expect(next).toBe("kk");
    expect(getQuranTranslitScript()).toBe("kk");
    expect(await AsyncStorage.getItem("quran_translit_script_v1")).toBe("kk");
  });

  it("keeps user latin choice after restore flag is set", async () => {
    await ensureDefaultQuranTranslitScript("kk");
    await setQuranTranslitScript("latin");
    const next = await ensureDefaultQuranTranslitScript("kk");
    expect(next).toBe("latin");
    expect(getQuranTranslitScript()).toBe("latin");
  });

  it("forces latin in memory for non-kk UI", async () => {
    await setQuranTranslitScript("kk");
    const next = await ensureDefaultQuranTranslitScript("en");
    expect(next).toBe("latin");
    expect(getQuranTranslitScript()).toBe("latin");
    expect(await AsyncStorage.getItem("quran_translit_script_v1")).toBe("kk");
  });
});
