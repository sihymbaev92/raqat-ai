import { countryFlagEmoji, labelWithCountryFlag } from "../countryFlagEmoji";

describe("countryFlagEmoji", () => {
  it("maps ISO alpha-2 to regional indicator emoji", () => {
    expect(countryFlagEmoji("KZ")).toBe("🇰🇿");
    expect(countryFlagEmoji("SA")).toBe("🇸🇦");
    expect(countryFlagEmoji("eg")).toBe("🇪🇬");
  });

  it("returns empty string for invalid codes", () => {
    expect(countryFlagEmoji("")).toBe("");
    expect(countryFlagEmoji("KAZ")).toBe("");
  });

  it("prefixes label with flag", () => {
    expect(labelWithCountryFlag("KZ", "Халифа Алтай")).toBe("🇰🇿 Халифа Алтай");
  });
});
