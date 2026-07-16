import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCityLocationMode,
  getSelectedCityCoords,
  setPrayerLocationAutoEnabled,
  setSelectedCityCoords,
} from "../prefs";

jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    multiSet: jest.fn((pairs: Array<[string, string]>) => {
      pairs.forEach(([key, value]) => store.set(key, value));
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
  };
});

describe("prefs city location", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("defaults to auto location mode", async () => {
    expect(await getCityLocationMode()).toBe("auto");
  });

  it("switches to manual when auto-detect is disabled", async () => {
    await setPrayerLocationAutoEnabled(false);
    expect(await getCityLocationMode()).toBe("manual");
  });

  it("stores and reads selected city coordinates", async () => {
    await setSelectedCityCoords(43.24, 76.95);
    await expect(getSelectedCityCoords()).resolves.toEqual({ lat: 43.24, lon: 76.95 });
  });

  it("returns null for invalid stored coordinates", async () => {
    await AsyncStorage.setItem("raqat_city_lat_v1", "bad");
    await AsyncStorage.setItem("raqat_city_lon_v1", "76.95");
    expect(await getSelectedCityCoords()).toBeNull();
  });
});
