import { prayerResultWeatherCoords, resolvePrayerWeatherCoords } from "../services/prayerWeatherCoords";

jest.mock("../storage/prefs", () => ({
  getSelectedCityCoords: jest.fn(),
}));

jest.mock("../constants/kzCities", () => ({
  getKzPresetCoords: jest.fn((city: string) =>
    city === "Almaty" ? { lat: 43.24, lon: 76.95 } : null
  ),
}));

const { getSelectedCityCoords } = jest.requireMock("../storage/prefs") as {
  getSelectedCityCoords: jest.Mock;
};

describe("resolvePrayerWeatherCoords", () => {
  beforeEach(() => {
    getSelectedCityCoords.mockReset();
  });

  it("prefers prayer API lat/lon", async () => {
    const coords = await resolvePrayerWeatherCoords("Almaty", "Kazakhstan", {
      latitude: 43.1,
      longitude: 76.8,
    });
    expect(coords).toEqual({ lat: 43.1, lon: 76.8 });
    expect(getSelectedCityCoords).not.toHaveBeenCalled();
  });

  it("falls back to stored GPS coords", async () => {
    getSelectedCityCoords.mockResolvedValue({ lat: 51.17, lon: 71.45 });
    const coords = await resolvePrayerWeatherCoords("Astana", "Kazakhstan", null);
    expect(coords).toEqual({ lat: 51.17, lon: 71.45 });
  });

  it("falls back to KZ preset", async () => {
    getSelectedCityCoords.mockResolvedValue(null);
    const coords = await resolvePrayerWeatherCoords("Almaty", "Kazakhstan", null);
    expect(coords).toEqual({ lat: 43.24, lon: 76.95 });
  });
});

describe("prayerResultWeatherCoords", () => {
  it("returns null when coords missing", () => {
    expect(prayerResultWeatherCoords(null)).toBeNull();
    expect(prayerResultWeatherCoords({ latitude: NaN, longitude: 1 })).toBeNull();
  });
});
