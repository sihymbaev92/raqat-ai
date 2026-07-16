import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadPrayerCache, loadPrayerCacheRelaxed, savePrayerCache } from "../prayerCache";

jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
  };
});

jest.mock("../../services/openMeteoCurrent", () => ({
  fetchOpenMeteoCurrent: jest.fn(async () => null),
}));

const CACHE_KEY = "raqat_prayer_cache_v2";

const shymkentPrayer = {
  city: "Shymkent",
  country: "Kazakhstan",
  latitude: 42.368009,
  longitude: 69.612769,
  source: "muftyat" as const,
  date: "2026-06-13",
  fajr: "02:59",
  sunrise: "04:41",
  dhuhr: "12:25",
  asr: "17:42",
  maghrib: "20:02",
  isha: "21:44",
};

describe("prayer cache source guard", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("keeps Muftyat cache for Kazakhstan", async () => {
    await savePrayerCache(shymkentPrayer);

    await expect(loadPrayerCache()).resolves.toMatchObject({
      city: "Shymkent",
      source: "muftyat",
      asr: "17:42",
    });
  });

  it("rejects legacy cache with mismatched calculation profile", async () => {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ...shymkentPrayer,
        calculationMethod: 3,
        calculationSchool: 1,
        savedAt: new Date().toISOString(),
      })
    );

    await expect(loadPrayerCache()).resolves.toBeNull();
  });

  it("loadPrayerCacheRelaxed accepts legacy source without strict profile guard", async () => {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ...shymkentPrayer,
        source: "aladhan",
        calculationMethod: 3,
        calculationSchool: 1,
        savedAt: new Date().toISOString(),
      })
    );

    await expect(loadPrayerCacheRelaxed()).resolves.toMatchObject({
      city: "Shymkent",
      source: "aladhan",
    });
  });
});
