import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadWeatherCache, saveWeatherCache } from "../weatherCache";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("weatherCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("round-trips weather snapshot by coordinates", async () => {
    const store: Record<string, string> = {};
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => store[key] ?? null);
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      store[key] = value;
    });

    await saveWeatherCache(42.342, 69.591, {
      tempC: 24,
      wmoCode: 1,
      isDay: true,
      observedAt: "2026-06-17T12:00",
    });

    await expect(loadWeatherCache(42.342, 69.591)).resolves.toEqual({
      tempC: 24,
      wmoCode: 1,
      isDay: true,
      observedAt: "2026-06-17T12:00",
    });
  });

  it("expires entries older than max age", async () => {
    const old = new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        "42.342:69.591": {
          lat: 42.342,
          lon: 69.591,
          snap: { tempC: 10, wmoCode: 0 },
          savedAt: old,
        },
      })
    );

    await expect(loadWeatherCache(42.342, 69.591)).resolves.toBeNull();
  });
});
