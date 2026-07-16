import {
  findKzCityPresetByName,
  findNearestKzCityPreset,
} from "../kzCities";

describe("findNearestKzCityPreset", () => {
  it("returns Almaty near city center", () => {
    const hit = findNearestKzCityPreset(43.24, 76.89);
    expect(hit).not.toBeNull();
    expect(hit!.city).toBe("Almaty");
  });

  it("returns Astana near city center", () => {
    const hit = findNearestKzCityPreset(51.17, 71.45);
    expect(hit).not.toBeNull();
    expect(hit!.city).toBe("Astana");
  });

  it("returns Shymkent near city center", () => {
    const hit = findNearestKzCityPreset(42.34, 69.59);
    expect(hit).not.toBeNull();
    expect(hit!.city).toBe("Shymkent");
  });
});

describe("findKzCityPresetByName", () => {
  it("matches Kazakh labels", () => {
    expect(findKzCityPresetByName("Алматы")?.city).toBe("Almaty");
    expect(findKzCityPresetByName("Астана")?.city).toBe("Astana");
  });

  it("matches API city keys", () => {
    expect(findKzCityPresetByName("Shymkent")?.city).toBe("Shymkent");
  });
});
