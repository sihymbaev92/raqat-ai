import { appLocaleFlag, formatAppLocaleLabel, formatQuranReciterGroupLabel } from "../localeFlags";

describe("localeFlags", () => {
  it("maps primary app locales to flags", () => {
    expect(appLocaleFlag("kk")).toBe("🇰🇿");
    expect(appLocaleFlag("ru")).toBe("🇷🇺");
    expect(appLocaleFlag("en")).toBe("🇬🇧");
    expect(appLocaleFlag("ky")).toBe("🇰🇬");
    expect(appLocaleFlag("uz")).toBe("🇺🇿");
    expect(appLocaleFlag("tr")).toBe("🇹🇷");
    expect(appLocaleFlag("ar")).toBe("🇸🇦");
  });

  it("prefixes labels with flags", () => {
    expect(formatAppLocaleLabel("kk", "Қазақша")).toBe("🇰🇿 Қазақша");
    expect(formatQuranReciterGroupLabel("ar", "Араб қарилары")).toBe("🇸🇦 Араб қарилары");
  });
});
