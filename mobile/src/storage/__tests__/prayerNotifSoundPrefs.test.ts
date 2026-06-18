import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getSelectedCity,
  getPrayerNotifMutedSalatKeys,
  getPrayerNotifSoundId,
  PRAYER_NOTIF_SOUND_UI_ORDER,
  setSelectedCity,
  setPrayerNotifMutedSalatKeys,
  setPrayerNotifSoundId,
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

const KEY = "raqat_prayer_notif_sound_id";

describe("prayer notification sound prefs", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("shows only the five curated adhan presets in settings", () => {
    expect(PRAYER_NOTIF_SOUND_UI_ORDER).toEqual([
      "adhan_haramain",
      "adhan_madina_clear",
      "adhan_makkah_live",
      "adhan_soft_cc0",
      "adhan_takbir_high",
    ]);
  });

  it("migrates old sound choices into the curated adhan set", async () => {
    await AsyncStorage.setItem(KEY, "bell");
    expect(await getPrayerNotifSoundId()).toBe("adhan_haramain");

    await AsyncStorage.setItem(KEY, "azan_makkah");
    expect(await getPrayerNotifSoundId()).toBe("adhan_makkah_live");
  });

  it("keeps the selected curated adhan preset", async () => {
    await setPrayerNotifSoundId("adhan_soft_cc0");
    expect(await getPrayerNotifSoundId()).toBe("adhan_soft_cc0");
  });

  it("stores individually muted prayer adhan keys in stable order", async () => {
    await setPrayerNotifMutedSalatKeys(["isha", "asr", "asr"]);
    expect(await getPrayerNotifMutedSalatKeys()).toEqual(["asr", "isha"]);
  });

  it("falls back to a valid city when selected city storage is blank", async () => {
    await setSelectedCity("", "");
    expect(await getSelectedCity()).toEqual({ city: "Shymkent", country: "Kazakhstan" });
  });
});
