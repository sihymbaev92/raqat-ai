import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FARD_PRAYER_KEYS,
  loadPrayerDailyTracker,
  toggleFardPrayer,
} from "../prayerDailyTracker";

jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();
  return {
    setItem: jest.fn((k: string, v: string) => {
      store.set(k, v);
      return Promise.resolve();
    }),
    getItem: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
    removeItem: jest.fn((k: string) => {
      store.delete(k);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
  };
});

describe("prayerDailyTracker", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("starts empty for today", async () => {
    const s = await loadPrayerDailyTracker();
    expect(s.streak).toBe(0);
    expect(FARD_PRAYER_KEYS.every((k) => !s.prayed[k])).toBe(true);
  });

  it("marks all fard and increments streak on full day", async () => {
    for (const key of FARD_PRAYER_KEYS) {
      await toggleFardPrayer(key);
    }
    const s = await loadPrayerDailyTracker();
    expect(s.streak).toBe(1);
    expect(FARD_PRAYER_KEYS.every((k) => s.prayed[k])).toBe(true);
  });
});
