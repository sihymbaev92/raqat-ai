import {
  findNearestKzCityPreset,
  isInKazakhstanBBox,
} from "../../constants/kzCities";
import { resolvePrayerScheduleLocation } from "../devicePrayerLocation";

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

describe("resolvePrayerScheduleLocation", () => {
  it("uses device coords and nearest KZ city when auto is on", async () => {
    const loc = await resolvePrayerScheduleLocation();
    expect(loc.locationSource).toBe("device");
    expect(loc.city).toBe("Almaty");
    expect(loc.country).toBe("Kazakhstan");
    expect(loc.lat).toBeCloseTo(43.24, 2);
    expect(loc.lon).toBeCloseTo(76.95, 2);
  });
});
