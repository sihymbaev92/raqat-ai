jest.mock("react-native", () => ({
  Linking: { openSettings: jest.fn() },
  NativeModules: {},
  Platform: { OS: "android", Version: 35 },
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
}));

jest.mock("../prayerNotifications", () => ({
  requestNotificationPermissions: jest.fn(async () => true),
  reschedulePrayerNotificationsFromCache: jest.fn(async () => undefined),
}));

jest.mock("../prayerFullScreenAzan", () => ({
  getFullScreenAzanAlarmDiagnostics: jest.fn(async () => ({
    exactAlarmPermissionGranted: false,
    scheduledCount: 0,
    lastError: null,
  })),
}));

jest.mock("../prayerOemBatterySetup", () => ({
  ensureOemPowerSetupForAzan: jest.fn(async () => ({
    batteryOptimizationIgnored: true,
    openedBatteryWhitelistScreen: true,
    openedOemBackgroundScreen: true,
    oemManufacturer: "Xiaomi",
    oemNeedsBackgroundSetup: true,
  })),
  getOemPowerDiagnostics: jest.fn(async () => ({
    batteryOptimizationIgnored: false,
    oemManufacturer: "Xiaomi",
    oemNeedsBackgroundSetup: true,
  })),
}));

jest.mock("../../storage/prefs", () => ({
  getNotifEnabled: jest.fn(async () => true),
}));

import { Linking, NativeModules, Platform } from "react-native";
import {
  ensurePrayerAzanPermissions,
  ensurePrayerAzanPermissionsOnAppActive,
  resetPrayerAzanPermissionPromptCooldown,
} from "../prayerAzanPermissions";
import { ensureOemPowerSetupForAzan } from "../prayerOemBatterySetup";

describe("prayerAzanPermissions", () => {
  const originalOs = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    resetPrayerAzanPermissionPromptCooldown();
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    Object.defineProperty(Platform, "Version", { configurable: true, value: 35 });
    NativeModules.PrayerWidget = {
      requestExactAlarmPermissionIfNeeded: jest.fn(async () => true),
    };
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: originalOs });
  });

  it("opens Android system screens for missing azan permissions", async () => {
    const result = await ensurePrayerAzanPermissions({ rescheduleAfter: false });

    expect(result.openedExactAlarmScreen).toBe(true);
    expect(result.openedBatteryWhitelistScreen).toBe(true);
    expect(NativeModules.PrayerWidget.requestExactAlarmPermissionIfNeeded).toHaveBeenCalled();
    expect(ensureOemPowerSetupForAzan).toHaveBeenCalledWith({
      openSystemScreens: true,
      forceBatteryPrompt: true,
    });
  });

  it("does not open app settings on first-launch deny path", async () => {
    const { requestNotificationPermissions } = jest.requireMock("../prayerNotifications");
    requestNotificationPermissions.mockResolvedValueOnce(false);

    await ensurePrayerAzanPermissions({
      rescheduleAfter: false,
      openAppSettingsOnDenied: false,
    });

    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it("re-prompts on app active after cooldown when permissions stay missing", async () => {
    let now = 1_000_000;
    const nowSpy = jest.spyOn(Date, "now").mockImplementation(() => now);

    await ensurePrayerAzanPermissionsOnAppActive();
    await ensurePrayerAzanPermissionsOnAppActive();
    expect(NativeModules.PrayerWidget.requestExactAlarmPermissionIfNeeded).toHaveBeenCalledTimes(1);

    now += 11_000;
    await ensurePrayerAzanPermissionsOnAppActive();
    expect(NativeModules.PrayerWidget.requestExactAlarmPermissionIfNeeded).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });
});
