import {
  findNearestKzCityPreset,
  isInKazakhstanBBox,
} from "../../constants/kzCities";
import {
  isPlusCodePlaceName,
  isStreetLikePlaceName,
  pickSettlementFromGeocode,
  resolvePrayerScheduleLocation,
} from "../devicePrayerLocation";
import * as Location from "expo-location";
import { setSelectedCity } from "../../storage/prefs";

jest.mock("../../storage/prefs", () => ({
  getSelectedCity: jest.fn(async () => ({ city: "Shymkent", country: "Kazakhstan" })),
  getPrayerLocationAutoEnabled: jest.fn(async () => true),
  setSelectedCity: jest.fn(async () => {}),
  setPrayerLocationAutoEnabled: jest.fn(async () => {}),
}));

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
  hasServicesEnabledAsync: jest.fn(async () => true),
  getLastKnownPositionAsync: jest.fn(async () => null),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 43.24, longitude: 76.95, accuracy: 42 },
  })),
  LocationAccuracy: { Balanced: 3 },
  reverseGeocodeAsync: jest.fn(async () => []),
}));

const reverseGeocodeAsync = Location.reverseGeocodeAsync as jest.Mock;

describe("kz city geo helpers", () => {
  it("findNearestKzCityPreset picks Almaty near city center", () => {
    const hit = findNearestKzCityPreset(43.23895, 76.88971);
    expect(hit?.city).toBe("Almaty");
    expect(hit?.distanceM).toBeLessThan(5_000);
  });

  it("isInKazakhstanBBox covers Almaty", () => {
    expect(isInKazakhstanBBox(43.24, 76.95)).toBe(true);
  });
});

describe("pickSettlementFromGeocode", () => {
  it("prefers village district over nearest metro city", () => {
    expect(
      pickSettlementFromGeocode({
        city: "Shymkent",
        district: "Құтарыс",
        region: "Turkistan Region",
        country: "Kazakhstan",
      })
    ).toBe("Құтарыс");
  });

  it("prefers settlement name when city is metro and name is village", () => {
    expect(
      pickSettlementFromGeocode({
        city: "Shymkent",
        name: "Qutarys",
        street: "Abay",
        region: "South Kazakhstan",
        country: "Kazakhstan",
      })
    ).toBe("Qutarys");
  });

  it("skips street-like name and falls back to city", () => {
    expect(
      pickSettlementFromGeocode({
        city: "Almaty",
        name: "Abay",
        street: "Abay",
        country: "Kazakhstan",
      })
    ).toBe("Almaty");
  });

  it("skips Google Plus Codes and prefers village/city", () => {
    expect(
      pickSettlementFromGeocode({
        name: "JJ2C+MR6",
        city: "Shymkent",
        district: "Құтарыс",
        country: "Kazakhstan",
      })
    ).toBe("Құтарыс");
    expect(
      pickSettlementFromGeocode({
        name: "JJ2C+MR6",
        city: "Shymkent",
        country: "Kazakhstan",
      })
    ).toBe("Shymkent");
  });

  it("isPlusCodePlaceName detects Open Location Codes", () => {
    expect(isPlusCodePlaceName("JJ2C+MR6")).toBe(true);
    expect(isPlusCodePlaceName("8Q7XJJ2C+MR6")).toBe(true);
    expect(isPlusCodePlaceName("Құтарыс")).toBe(false);
  });

  it("isStreetLikePlaceName detects house numbers", () => {
    expect(isStreetLikePlaceName("12A")).toBe(true);
    expect(isStreetLikePlaceName("Құтарыс")).toBe(false);
  });
});

describe("resolvePrayerScheduleLocation", () => {
  beforeEach(() => {
    reverseGeocodeAsync.mockReset();
    reverseGeocodeAsync.mockResolvedValue([]);
    (setSelectedCity as jest.Mock).mockClear();
  });

  it("uses reverse-geocode village label when auto is on in KZ", async () => {
    reverseGeocodeAsync.mockResolvedValue([
      {
        city: "Shymkent",
        district: "Құтарыс",
        country: "Kazakhstan",
        region: "Turkistan Region",
      },
    ]);

    const loc = await resolvePrayerScheduleLocation();
    expect(loc.locationSource).toBe("device");
    expect(loc.city).toBe("Құтарыс");
    expect(loc.country).toBe("Kazakhstan");
    expect(loc.lat).toBeCloseTo(43.24, 2);
    expect(loc.lon).toBeCloseTo(76.95, 2);
    expect(setSelectedCity).toHaveBeenCalledWith("Құтарыс", "Kazakhstan");
  });

  it("ignores Plus Code name and falls back to nearest city", async () => {
    reverseGeocodeAsync.mockResolvedValue([
      {
        name: "JJ2C+MR6",
        country: "Kazakhstan",
      },
    ]);
    const loc = await resolvePrayerScheduleLocation();
    expect(loc.city).toBe("Almaty");
    expect(loc.country).toBe("Kazakhstan");
    expect(isPlusCodePlaceName(loc.city)).toBe(false);
  });

  it("falls back to nearest KZ city when reverse geocode is empty", async () => {
    reverseGeocodeAsync.mockResolvedValue([]);
    const loc = await resolvePrayerScheduleLocation();
    expect(loc.locationSource).toBe("device");
    expect(loc.city).toBe("Almaty");
    expect(loc.country).toBe("Kazakhstan");
  });
});
