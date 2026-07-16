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

jest.mock("../prayerNotifications", () => ({
  requestNotificationPermissions: jest.fn(async () => true),
}));

jest.mock("../prayerAzanPermissions", () => ({
  ensurePrayerAzanPermissions: jest.fn(async () => ({
    notificationsGranted: true,
    exactAlarmGranted: true,
    batteryOptimizationIgnored: true,
    oemNeedsBackgroundSetup: false,
    openedExactAlarmScreen: false,
    openedBatteryWhitelistScreen: true,
    openedOemBackgroundScreen: false,
  })),
}));

import * as Location from "expo-location";
import { Camera } from "expo-camera";
import { requestAllCorePermissionsOnFirstLaunch } from "../firstLaunchPermissions";
import { ensurePrayerAzanPermissions } from "../prayerAzanPermissions";
import { requestNotificationPermissions } from "../prayerNotifications";

describe("requestAllCorePermissionsOnFirstLaunch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("asks notifications, location, camera, then azan/battery in order", async () => {
    const result = await requestAllCorePermissionsOnFirstLaunch();

    expect(requestNotificationPermissions).toHaveBeenCalled();
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
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
