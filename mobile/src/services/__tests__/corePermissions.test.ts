import { Linking, NativeModules, Platform } from "react-native";
import * as Location from "expo-location";

jest.mock("react-native", () => ({
  Linking: { openSettings: jest.fn(async () => undefined) },
  NativeModules: {},
  Platform: { OS: "android", Version: 35 },
}));

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: false, canAskAgain: true })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
}));

jest.mock("../prayerNotifications", () => ({
  getFullScreenAzanAlarmDiagnostics: jest.fn(async () => ({
    exactAlarmPermissionGranted: true,
    fullScreenIntentPermissionGranted: true,
    scheduledCount: 0,
    lastError: null,
  })),
  requestNotificationPermissions: jest.fn(async () => true),
  reschedulePrayerNotificationsFromCache: jest.fn(async () => undefined),
}));

jest.mock("../../storage/prefs", () => ({
  setOnboardingDone: jest.fn(async () => undefined),
  setFirstLaunchPermissionsBurstDone: jest.fn(async () => undefined),
  setNotifEnabled: jest.fn(async () => undefined),
}));

import { NativeModules } from "react-native";
import * as Location from "expo-location";
import {
  areCorePermissionsSatisfied,
  getCorePermissionSnapshot,
  requestNextCorePermission,
} from "../corePermissions";

describe("corePermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NativeModules.PrayerWidget = {
      isBatteryOptimizationIgnored: jest.fn(async () => true),
      requestBatteryOptimizationIfNeeded: jest.fn(async () => false),
    };
  });

  it("reports missing location until granted", async () => {
    const snap = await getCorePermissionSnapshot();
    expect(snap.missing[0]).toBe("location");
    expect(snap.allSatisfied).toBe(false);

    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });

    const after = await getCorePermissionSnapshot();
    expect(after.locationGranted).toBe(true);
    expect(after.allSatisfied).toBe(true);
    expect(await areCorePermissionsSatisfied()).toBe(true);
  });

  it("requests location as the first missing step", async () => {
    const step = await requestNextCorePermission();
    expect(step).toBe("location");
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
  });
});
