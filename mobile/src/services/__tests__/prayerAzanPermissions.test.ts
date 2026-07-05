jest.mock("react-native", () => ({
  Linking: { openSettings: jest.fn() },
  NativeModules: {},
  Platform: { OS: "android", Version: 35 },
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
}));

jest.mock("../prayerNotifications", () => ({
  getFullScreenAzanAlarmDiagnostics: jest.fn(async () => ({
    exactAlarmPermissionGranted: false,
    fullScreenIntentPermissionGranted: false,
    scheduledCount: 0,
    lastError: null,
  })),
  requestNotificationPermissions: jest.fn(async () => true),
  reschedulePrayerNotificationsFromCache: jest.fn(async () => undefined),
}));

jest.mock("../../storage/prefs", () => ({
  getNotifEnabled: jest.fn(async () => true),
}));

import { NativeModules, Platform } from "react-native";
import {
  ensurePrayerAzanPermissions,
  ensurePrayerAzanPermissionsOnAppActive,
  resetPrayerAzanPermissionPromptCooldown,
} from "../prayerAzanPermissions";

describe("prayerAzanPermissions", () => {
  const originalOs = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    resetPrayerAzanPermissionPromptCooldown();
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    Object.defineProperty(Platform, "Version", { configurable: true, value: 35 });
    NativeModules.PrayerWidget = {
      requestExactAlarmPermissionIfNeeded: jest.fn(async () => true),
      requestFullScreenIntentPermissionIfNeeded: jest.fn(async () => true),
    };
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: originalOs });
  });

  it("opens Android system screens for missing azan permissions", async () => {
    const result = await ensurePrayerAzanPermissions({ rescheduleAfter: false });

    expect(result.openedExactAlarmScreen).toBe(true);
    expect(result.openedFullScreenScreen).toBe(true);
    expect(NativeModules.PrayerWidget.requestExactAlarmPermissionIfNeeded).toHaveBeenCalled();
    expect(NativeModules.PrayerWidget.requestFullScreenIntentPermissionIfNeeded).toHaveBeenCalled();
  });

  it("re-prompts on app active after cooldown when permissions stay missing", async () => {
    jest.useFakeTimers();
    await ensurePrayerAzanPermissionsOnAppActive();
    await ensurePrayerAzanPermissionsOnAppActive();
    expect(NativeModules.PrayerWidget.requestExactAlarmPermissionIfNeeded).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(11_000);
    await ensurePrayerAzanPermissionsOnAppActive();
    expect(NativeModules.PrayerWidget.requestExactAlarmPermissionIfNeeded).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
