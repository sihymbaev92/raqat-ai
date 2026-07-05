import AsyncStorage from "@react-native-async-storage/async-storage";
import { getQiblaMotionMode, setQiblaMotionMode } from "../prefs";

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

const KEY = "raqat_qibla_motion_mode_v1";

describe("qibla motion mode prefs", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("defaults to balanced when unset", async () => {
    expect(await getQiblaMotionMode()).toBe("balanced");
  });

  it("persists fast mode", async () => {
    await setQiblaMotionMode("fast");
    expect(await getQiblaMotionMode()).toBe("fast");
    expect(await AsyncStorage.getItem(KEY)).toBe("fast");
  });

  it("persists balanced mode", async () => {
    await setQiblaMotionMode("balanced");
    expect(await getQiblaMotionMode()).toBe("balanced");
    expect(await AsyncStorage.getItem(KEY)).toBe("balanced");
  });

  it("migrates unknown stored values to balanced", async () => {
    await AsyncStorage.setItem(KEY, "turbo");
    expect(await getQiblaMotionMode()).toBe("balanced");
  });
});
