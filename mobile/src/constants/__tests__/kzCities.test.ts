import { cityLabelKkForApiName, getKzPresetCoords, KZ_CITY_PRESETS } from "../kzCities";

describe("kzCities", () => {
  it("тізім бос емес және қайталанатын city кілті жоқ", () => {
    expect(KZ_CITY_PRESETS.length).toBeGreaterThan(40);
    const keys = new Set(KZ_CITY_PRESETS.map((p) => p.city.toLowerCase()));
    expect(keys.size).toBe(KZ_CITY_PRESETS.length);
  });

  it("getKzPresetCoords Алматы үшін координата қайтарады", () => {
    const c = getKzPresetCoords("Almaty", "Kazakhstan");
    expect(c).not.toBeNull();
    expect(c!.lat).toBeGreaterThan(42);
    expect(c!.lat).toBeLessThan(44);
    expect(c!.lon).toBeGreaterThan(76);
  });

  it("Uralsk алиасы Oral координатасына түседі", () => {
    const c = getKzPresetCoords("Uralsk", "Kazakhstan");
    const oral = getKzPresetCoords("Oral", "Kazakhstan");
    expect(c).toEqual(oral);
  });

  it("қазақша қала және ел атауларын да координатқа түсіреді", () => {
    expect(getKzPresetCoords("Шымкент", "Қазақстан")).toEqual(getKzPresetCoords("Shymkent", "Kazakhstan"));
    expect(getKzPresetCoords("Алматы", "Казахстан")).toEqual(getKzPresetCoords("Almaty", "Kazakhstan"));
  });

  it("cityLabelKkForApiName қазақша атауды қайтарады", () => {
    expect(cityLabelKkForApiName("Shymkent")).toBe("Шымкент");
    expect(cityLabelKkForApiName("Nur-Sultan")).toBe("Астана");
    expect(cityLabelKkForApiName("Uralsk")).toBe("Орал");
    expect(cityLabelKkForApiName("Шымкент")).toBe("Шымкент");
  });
});
