jest.mock("react-native", () => ({
  Linking: { openSettings: jest.fn() },
  NativeModules: {},
  Platform: { OS: "android" },
}));

jest.mock("../../api/halalDamuWp", () => ({
  invalidateHalalDamuAllCaches: jest.fn(async () => undefined),
}));

jest.mock("../../components/officialSiteWebViewReload", () => ({
  clearOfficialSiteWebCache: jest.fn(async () => undefined),
}));

import { NativeModules } from "react-native";
import { invalidateHalalDamuAllCaches } from "../../api/halalDamuWp";
import { clearOfficialSiteWebCache } from "../../components/officialSiteWebViewReload";
import {
  clearSelectableAppCaches,
  openAndroidAppStorageSettings,
} from "../appDataMaintenance";

describe("appDataMaintenance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (NativeModules as { PrayerWidget?: unknown }).PrayerWidget;
  });

  it("openAndroidAppStorageSettings uses native module", async () => {
    const openAppStorageSettings = jest.fn(async () => true);
    NativeModules.PrayerWidget = { openAppStorageSettings };
    await expect(openAndroidAppStorageSettings()).resolves.toBe(true);
    expect(openAppStorageSettings).toHaveBeenCalled();
  });

  it("clearSelectableAppCaches clears web and halal caches", async () => {
    await clearSelectableAppCaches();
    expect(clearOfficialSiteWebCache).toHaveBeenCalled();
    expect(invalidateHalalDamuAllCaches).toHaveBeenCalled();
  });
});
