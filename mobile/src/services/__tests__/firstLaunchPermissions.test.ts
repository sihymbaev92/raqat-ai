jest.mock("react-native", () => ({
  Platform: { OS: "android" },
}));

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
}));

jest.mock("expo-camera", () => ({
  Camera: {
    getCameraPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  },
}));

jest.mock("../prayerAzanPermissions", () => ({
  ensurePrayerAzanPermissions: jest.fn(async () => ({
    notificationsGranted: true,
    exactAlarmGranted: true,
    fullScreenIntentAllowed: true,
    batteryOptimizationIgnored: true,
    oemNeedsBackgroundSetup: false,
    openedExactAlarmScreen: false,
    openedFullScreenIntentScreen: false,
    openedBatteryWhitelistScreen: true,
    openedOemBackgroundScreen: false,
  })),
}));

import * as Location from "expo-location";
import { Camera } from "expo-camera";
import { requestAllCorePermissionsOnFirstLaunch } from "../firstLaunchPermissions";
import { ensurePrayerAzanPermissions } from "../prayerAzanPermissions";

describe("requestAllCorePermissionsOnFirstLaunch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("asks azan first, then location and camera", async () => {
    const callOrder: string[] = [];
    (ensurePrayerAzanPermissions as jest.Mock).mockImplementation(async () => {
      callOrder.push("azan");
      return {
        notificationsGranted: true,
        exactAlarmGranted: true,
        fullScreenIntentAllowed: true,
        batteryOptimizationIgnored: true,
        oemNeedsBackgroundSetup: false,
        openedExactAlarmScreen: false,
        openedFullScreenIntentScreen: false,
        openedBatteryWhitelistScreen: true,
        openedOemBackgroundScreen: false,
      };
    });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockImplementation(async () => {
      callOrder.push("location");
      return { granted: true };
    });
    (Camera.requestCameraPermissionsAsync as jest.Mock).mockImplementation(async () => {
      callOrder.push("camera");
      return { granted: true };
    });

    const result = await requestAllCorePermissionsOnFirstLaunch();

    expect(callOrder).toEqual(["azan", "location", "camera"]);
    expect(ensurePrayerAzanPermissions).toHaveBeenCalledWith({
      openAndroidSystemScreens: true,
      rescheduleAfter: true,
      openAppSettingsOnDenied: false,
    });
    expect(result).toEqual({
      notifications: true,
      location: true,
      camera: true,
      azan: expect.objectContaining({ batteryOptimizationIgnored: true }),
    });
  });
});
