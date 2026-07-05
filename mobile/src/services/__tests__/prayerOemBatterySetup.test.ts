import { ensureOemPowerSetupForAzan, getOemPowerDiagnostics } from "../prayerOemBatterySetup";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native", () => ({
  NativeModules: {},
  Platform: { OS: "android", Version: 33 },
}));

import { NativeModules, Platform } from "react-native";
import { resetOemPowerPromptCooldown } from "../prayerOemBatterySetup";

describe("ensureOemPowerSetupForAzan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetOemPowerPromptCooldown();
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    NativeModules.PrayerWidget = {
      getOemPowerDiagnostics: jest
        .fn()
        .mockResolvedValueOnce({
          batteryOptimizationIgnored: false,
          oemManufacturer: "Xiaomi",
          oemNeedsBackgroundSetup: true,
        })
        .mockResolvedValueOnce({
          batteryOptimizationIgnored: true,
          oemManufacturer: "Xiaomi",
          oemNeedsBackgroundSetup: true,
        }),
      requestIgnoreBatteryOptimizationIfNeeded: jest.fn(async () => true),
      openOemBackgroundSettings: jest.fn(async () => true),
    };
  });

  it("opens battery whitelist then OEM background screen on aggressive OEM", async () => {
    const result = await ensureOemPowerSetupForAzan({ openSystemScreens: true });
    expect(result.openedBatteryWhitelistScreen).toBe(true);
    expect(result.openedOemBackgroundScreen).toBe(true);
    expect(result.batteryOptimizationIgnored).toBe(true);
    expect(NativeModules.PrayerWidget.requestIgnoreBatteryOptimizationIfNeeded).toHaveBeenCalled();
    expect(NativeModules.PrayerWidget.openOemBackgroundSettings).toHaveBeenCalled();
  });

  it("getOemPowerDiagnostics maps native payload", async () => {
    NativeModules.PrayerWidget.getOemPowerDiagnostics = jest.fn(async () => ({
      batteryOptimizationIgnored: false,
      oemManufacturer: "samsung",
      oemNeedsBackgroundSetup: true,
    }));
    const diag = await getOemPowerDiagnostics();
    expect(diag.oemManufacturer).toBe("samsung");
    expect(diag.oemNeedsBackgroundSetup).toBe(true);
  });
});
